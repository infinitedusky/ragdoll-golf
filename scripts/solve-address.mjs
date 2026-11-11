// PROTOTYPE: offline address-pose solver. Builds the GLB's bone hierarchy in three.js (no meshes),
// applies the hand-picked body pose (scripts/body-pose.json), then solves each arm with analytic
// two-bone IK so both palms sit on the grip, and prints the name → degrees table and the club offset
// in the right-hand bone's frame. Run: node scripts/solve-address.mjs public/models/golfer.glb
import fs from 'fs'
import * as THREE from 'three'

const b = fs.readFileSync(process.argv[2])
const j = JSON.parse(b.slice(20, 20 + b.readUInt32LE(12)).toString())
const objs = j.nodes.map((n) => {
  const o = new THREE.Object3D(); o.name = n.name
  if (n.translation) o.position.fromArray(n.translation)
  if (n.rotation) o.quaternion.fromArray(n.rotation)
  if (n.scale) o.scale.fromArray(n.scale)
  return o
})
j.nodes.forEach((n, i) => n.children?.forEach((c) => objs[i].add(objs[c])))
const world = new THREE.Group(); world.add(objs[j.scenes[0].nodes[0]])
const bone = (n) => objs.find((o) => o.name === 'mixamorig:' + n)
const D = Math.PI / 180
const V = (...a) => new THREE.Vector3(...a)
const wpos = (n) => { bone(n).updateWorldMatrix(true, false); return bone(n).getWorldPosition(V()) }
const wquat = (o) => { o.updateWorldMatrix(true, false); return o.getWorldQuaternion(new THREE.Quaternion()) }
const frame = (x, y) => { // world quaternion whose local X, Y map to x, y
  const z = V().crossVectors(x, y)
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
}
const setWorldQuat = (o, q) => o.quaternion.copy(wquat(o.parent).invert().multiply(q))

const BODY = JSON.parse(fs.readFileSync(new URL('./body-pose.json', import.meta.url)))
const LIE = 62.5 * D, LENGTH = 37 * 0.0254
const clubPos = V(...BODY.club)
const up = V(0, Math.sin(LIE), -Math.cos(LIE))
const along = (s) => V(-0.006, 0.006, 0).add(clubPos).addScaledVector(up, s)
const club = new THREE.Object3D(); club.position.copy(clubPos); world.add(club)

// Grip: palm centre on the shaft axis; fingers down the shaft; left palm faces the golfer's right, right palm the target
const GRIP = {
  Left: { s: LENGTH - 0.055, palmN: V(-1, 0, 0.3), sign: 1 },
  Right: { s: LENGTH - 0.13, palmN: V(1, 0, -0.1), sign: -1 },
}
const PALM = { along: 0.055, down: 0.03 } // palm centre from the wrist joint, metres, in the hand's frame
const POLE = V(0, -0.4, -1).normalize() // elbows point back toward the hips

function solveArm(side) {
  const g = GRIP[side], s = g.sign
  const finger = up.clone().negate()
  const palmN = g.palmN.clone().normalize().addScaledVector(finger, -g.palmN.clone().normalize().dot(finger)).normalize()
  const wrist = along(g.s).addScaledVector(finger, -PALM.along).addScaledVector(palmN, -PALM.down)
  const S = wpos(side + 'Arm'), a = wpos(side + 'ForeArm').distanceTo(S), bl = wpos(side + 'Hand').distanceTo(wpos(side + 'ForeArm'))
  const toW = V().subVectors(wrist, S), d = Math.min(toW.length(), (a + bl) * 0.9999), dir = toW.clone().normalize()
  const cosA = (a * a + d * d - bl * bl) / (2 * a * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA))
  const perp = POLE.clone().addScaledVector(dir, -POLE.dot(dir)).normalize()
  const E = S.clone().addScaledVector(dir, a * cosA).addScaledVector(perp, a * sinA)
  const u = V().subVectors(E, S).normalize(), f = V().subVectors(wrist, E).normalize()
  let zf = f.clone().addScaledVector(u, -f.dot(u)); zf = zf.lengthSq() < 1e-8 ? perp.clone() : zf.normalize()
  const ux = u.clone().multiplyScalar(s), Y = V().crossVectors(zf, ux)
  const qUpper = frame(ux, Y)
  setWorldQuat(bone(side + 'Arm'), qUpper)
  setWorldQuat(bone(side + 'ForeArm'), new THREE.Quaternion().setFromUnitVectors(u, f).multiply(qUpper))
  setWorldQuat(bone(side + 'Hand'), frame(finger.clone().multiplyScalar(s), palmN.clone().negate()))
  return { reach: toW.length() / (a + bl), wristErr: wpos(side + 'Hand').distanceTo(wrist) }
}

function pose(rootZ) {
  for (const o of objs) if (o.name.startsWith('mixamorig:')) o.quaternion.identity()
  for (const [n, r] of Object.entries(BODY.bones)) bone(n).rotation.set(r[0] * D, r[1] * D, r[2] * D)
  world.position.set(BODY.root[0], 0, rootZ)
  world.updateMatrixWorld(true)
  const toes = Math.min(wpos('LeftToeBase').y, wpos('RightToeBase').y)
  world.position.y = -toes + BODY.toeHeight
  world.updateMatrixWorld(true)
  return { Left: solveArm('Left'), Right: solveArm('Right') }
}

// Stand where the longer reach is nearly straight
let lo = -0.6, hi = 0.4
for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, r = pose(m); Math.max(r.Left.reach, r.Right.reach) > BODY.leftReach ? (lo = m) : (hi = m) }
const res = pose((lo + hi) / 2)
console.error('root z', world.position.z.toFixed(3), JSON.stringify(res))

const out = {}
for (const o of objs) if (o.name.startsWith('mixamorig:')) {
  const r = o.rotation, v = [r.x, r.y, r.z].map((x) => Math.round(x / D * 10) / 10 + 0)
  if (v.some((x) => x !== 0)) out[o.name.slice(10)] = v
}
const rh = bone('RightHand'); rh.updateWorldMatrix(true, false); club.updateMatrixWorld(true)
const off = rh.matrixWorld.clone().invert().multiply(club.matrixWorld)
const p = V(), q = new THREE.Quaternion(), sc = V(); off.decompose(p, q, sc)
console.log(JSON.stringify({
  root: world.position.toArray().map((v) => +v.toFixed(4)),
  pose: out,
  clubInRightHand: { position: p.toArray().map((v) => +v.toFixed(3)), quaternion: q.toArray().map((v) => +v.toFixed(5)), scale: +sc.x.toFixed(3) },
  joints: Object.fromEntries(['Head', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand', 'Hips', 'LeftLeg', 'LeftFoot'].map((n) => [n, wpos(n).toArray().map((v) => +v.toFixed(3))])),
}))
