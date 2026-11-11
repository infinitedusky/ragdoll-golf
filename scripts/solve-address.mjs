// PROTOTYPE: offline address-pose solver, run on the dummy's own bones (src/golfer/dummy.js).
// The body angles come from scripts/body-pose.json; the ankles are levelled with a toe-out; each arm is solved
// with analytic two-bone IK so the mitten sits on the grip; the stance is searched along Z until the longer
// reach is `reach` of a straight arm. Prints the name → degrees table, the pelvis position and the club's
// offset in the trail wrist's frame. Run: node scripts/solve-address.mjs
import fs from 'fs'
import * as THREE from 'three'
import { buildDummy } from '../src/golfer/dummy.js'

const BODY = JSON.parse(fs.readFileSync(new URL('./body-pose.json', import.meta.url)))
const { root, bones } = buildDummy()
const world = new THREE.Group(); world.add(root)
const D = Math.PI / 180
const V = (...a) => new THREE.Vector3(...a)
const wq = (o) => { o.updateWorldMatrix(true, false); return o.getWorldQuaternion(new THREE.Quaternion()) }
const wp = (o) => { o.updateWorldMatrix(true, false); return o.getWorldPosition(V()) }
const setWorldQuat = (o, q) => o.quaternion.copy(wq(o.parent).invert().multiply(q))
const basis = (x, y) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, V().crossVectors(x, y)))

// The club, as in the mockup: heel of the sole at BODY.club, shaft rising toward the golfer at the lie angle
const LIE = 62.5 * D, LENGTH = 37 * 0.0254
const clubPos = V(...BODY.club)
const up = V(0, Math.sin(LIE), -Math.cos(LIE))
const along = (s) => V(-0.006, 0.006, 0).add(clubPos).addScaledVector(up, s)
const club = new THREE.Object3D(); club.position.copy(clubPos); world.add(club)

// Mitten in the wrist frame: fingers down −Y, palm toward n·X, the grip axis 3.4 cm out from the palm centre
const GRIP = { lead: { s: LENGTH - 0.065, n: -1 }, trail: { s: LENGTH - 0.17, n: 1 } }
const PALM = (n) => V(n * 0.034, -0.055, 0)
const POLE = { lead: V(0.15, -1, 0).normalize(), trail: V(-0.15, -1, 0).normalize() }

function solveArm(side) {
  const { s, n } = GRIP[side]
  // Hand frame: ŷ up the shaft (fingers down it), palm toward the shaft
  const R = basis(V(n === 1 ? 1 : 1, 0, 0), up.clone()) // x̂ → +X for both hands (n·palmDir), ŷ → up
  const wrist = along(s).sub(PALM(n).applyQuaternion(R))
  const S = wp(bones[side + 'Shoulder']), E0 = bones[side + 'Elbow'], W0 = bones[side + 'Wrist']
  const a = E0.position.length(), b = W0.position.length()
  const toW = wrist.clone().sub(S), d = Math.min(toW.length(), (a + b) * 0.9999), dir = toW.clone().normalize()
  const cosA = (a * a + d * d - b * b) / (2 * a * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA))
  const pole = POLE[side], perp = pole.clone().addScaledVector(dir, -pole.dot(dir)).normalize()
  const E = S.clone().addScaledVector(dir, a * cosA).addScaledVector(perp, a * sinA)
  const u = E.clone().sub(S).normalize(), f = wrist.clone().sub(E).normalize()
  // Shoulder: local −Y along the upper arm; the elbow hinges about local X, forearm swinging toward local +Z
  let zf = f.clone().addScaledVector(u, -f.dot(u)); zf = zf.lengthSq() < 1e-8 ? perp.clone() : zf.normalize()
  const yS = u.clone().negate(), xS = V().crossVectors(yS, zf)
  const qS = basis(xS, yS)
  setWorldQuat(bones[side + 'Shoulder'], qS)
  const phi = Math.acos(THREE.MathUtils.clamp(u.dot(f), -1, 1))
  bones[side + 'Elbow'].rotation.set(-phi, 0, 0)
  setWorldQuat(bones[side + 'Wrist'], R)
  return { reach: toW.length() / (a + b), err: wp(bones[side + 'Wrist']).distanceTo(wrist) }
}

function pose(z) {
  for (const o of Object.values(bones)) o.quaternion.identity()
  for (const [k, r] of Object.entries(BODY.bones)) bones[k].rotation.set(r[0] * D, r[1] * D, r[2] * D)
  root.position.set(0, 0.93, z)
  world.updateMatrixWorld(true)
  // Level feet, toed out
  for (const side of ['lead', 'trail']) setWorldQuat(bones[side + 'Ankle'], new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), BODY.footYawDeg[side] * D))
  world.updateMatrixWorld(true)
  root.position.y += 0.08 - Math.min(wp(bones.leadAnkle).y, wp(bones.trailAnkle).y) // soles on the ground
  world.updateMatrixWorld(true)
  return { lead: solveArm('lead'), trail: solveArm('trail') }
}

let lo = -0.6, hi = 0.4
for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, r = pose(m); Math.max(r.lead.reach, r.trail.reach) > BODY.reach ? (lo = m) : (hi = m) }
const res = pose((lo + hi) / 2)
console.error('pelvis', root.position.toArray().map((v) => +v.toFixed(3)), JSON.stringify(res))

const r1 = (x) => Math.round((x / D) * 10) / 10 + 0
const poseOut = {}
for (const [k, o] of Object.entries(bones)) { const e = o.rotation, v = [r1(e.x), r1(e.y), r1(e.z)]; if (v.some((x) => x !== 0)) poseOut[k] = v }
const tw = bones.trailWrist; tw.updateWorldMatrix(true, false); club.updateMatrixWorld(true)
const off = tw.matrixWorld.clone().invert().multiply(club.matrixWorld)
const p = V(), q = new THREE.Quaternion(), sc = V(); off.decompose(p, q, sc)
const torso = wp(bones.neck).sub(wp(bones.pelvis))
console.log(JSON.stringify({
  root: root.position.toArray().map((v) => +v.toFixed(4)),
  pose: poseOut,
  clubInTrailWrist: { position: p.toArray().map((v) => +v.toFixed(4)), quaternion: q.toArray().map((v) => +v.toFixed(5)) },
  torsoLeanDeg: +(Math.atan2(torso.z, torso.y) / D).toFixed(1),
  joints: Object.fromEntries(['head', 'leadShoulder', 'leadElbow', 'leadWrist', 'trailShoulder', 'trailElbow', 'trailWrist', 'pelvis', 'leadKnee', 'leadAnkle', 'trailAnkle'].map((n) => [n, wp(bones[n]).toArray().map((v) => +v.toFixed(3))])),
}))
