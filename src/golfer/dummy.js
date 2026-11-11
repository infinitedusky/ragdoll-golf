// PROTOTYPE (RG-1): the golfer is a crash-test dummy built in code on our own THREE.Bone skeleton.
// Rest pose: standing, arms down, palms in, facing +Z, left side at +X, metres. Every bone's rest rotation
// is identity, so a bone's local X/Y/Z are the world axes until a parent rotates.
// "Lead" is the left side (+X) and "trail" the right (−X), for a right-handed golfer.
// The pelvis is the root: a centre plus two hip joints as children.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const Y = new THREE.Vector3(0, 1, 0)
const SIDES = { lead: 1, trail: -1 }

// [name, parent, offset from parent, panel group, plain label] — listed from the body outward
const DEFS = [
  ['pelvis', null, [0, 0.93, 0], 'Pelvis', 'Pelvis'],
  ['lowerBack', 'pelvis', [0, 0.07, 0], 'Torso', 'Lower back'],
  ['upperBack', 'lowerBack', [0, 0.15, 0], 'Torso', 'Upper back'],
  ['neck', 'upperBack', [0, 0.18, 0], 'Head', 'Neck'],
  ['head', 'neck', [0, 0.11, 0], 'Head', 'Head'],
]
for (const [side, s] of Object.entries(SIDES)) {
  const G = side === 'lead' ? 'Lead' : 'Trail'
  DEFS.push(
    [side + 'Shoulder', 'upperBack', [0.2 * s, 0.22, 0], G + ' arm', 'Shoulder'],
    [side + 'Elbow', side + 'Shoulder', [0, -0.29, 0], G + ' arm', 'Elbow'],
    [side + 'Wrist', side + 'Elbow', [0, -0.27, 0], G + ' arm', 'Wrist'],
    [side + 'Hip', 'pelvis', [0.11 * s, -0.02, 0], G + ' leg', 'Hip'],
    [side + 'Knee', side + 'Hip', [0, -0.42, 0], G + ' leg', 'Knee'],
    [side + 'Ankle', side + 'Knee', [0, -0.42, 0], G + ' leg', 'Ankle'],
  )
}
export const GROUPS = ['Pelvis', 'Torso', 'Head', 'Lead arm', 'Trail arm', 'Lead leg', 'Trail leg']
export const BONE_DEFS = DEFS.map(([name, parent, offset, group, label]) => ({ name, parent, offset, group, label }))

export function buildDummy() {
  const bones = {}
  for (const d of BONE_DEFS) {
    const b = new THREE.Bone()
    b.name = d.name
    b.position.fromArray(d.offset)
    bones[d.name] = b
    if (d.parent) bones[d.parent].add(b)
  }

  const yellow = new THREE.MeshStandardMaterial({ color: '#f0bf2a', roughness: 0.45, metalness: 0.05, transparent: true })
  const black = new THREE.MeshStandardMaterial({ color: '#1b1b1d', roughness: 0.55, transparent: true })
  const rubber = new THREE.MeshStandardMaterial({ color: '#2a2a2c', roughness: 0.9, transparent: true })
  const bolt = new THREE.MeshStandardMaterial({ color: '#9aa0a6', metalness: 0.8, roughness: 0.3, transparent: true })
  const targetBlack = new THREE.MeshBasicMaterial({ color: '#111', side: THREE.DoubleSide, transparent: true })
  const targetYellow = new THREE.MeshBasicMaterial({ color: '#ffd84a', side: THREE.DoubleSide, transparent: true })

  // Everything below is in the owning bone's local frame, which is world-aligned at rest
  const V = (x, y, z) => new THREE.Vector3(x, y, z)
  const add = (bone, m, pos) => { m.castShadow = m.receiveShadow = true; if (pos) m.position.copy(pos); bones[bone].add(m); return m }
  const seg = (bone, a, b, r0, r1, mat, gap = 0.03) => {
    const dir = b.clone().sub(a), len = dir.length() - 2 * gap
    const m = add(bone, new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 20, 1), mat), a.clone().addScaledVector(dir, 0.5))
    m.quaternion.setFromUnitVectors(Y, dir.normalize())
    return m
  }
  const joint = (bone, r) => add(bone, new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), black), V(0, 0, 0))
  const marker = (bone, pos, normal, r = 0.035) => {
    const g = new THREE.Group()
    for (let i = 0; i < 4; i++) g.add(new THREE.Mesh(new THREE.CircleGeometry(r, 12, (i * Math.PI) / 2, Math.PI / 2), i % 2 ? targetBlack : targetYellow))
    g.position.copy(pos)
    g.lookAt(pos.clone().add(normal))
    bones[bone].add(g)
  }
  const off = (name) => V(...BONE_DEFS.find((d) => d.name === name).offset)

  // Pelvis: a black block across the hip joints
  add('pelvis', new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.16, 0.2, 4, 0.04), black), V(0, 0.02, 0))
  // Lumbar: a rubber column; then the chest block with ribs and side targets
  seg('lowerBack', V(0, 0, 0), off('upperBack'), 0.09, 0.09, rubber, 0)
  add('upperBack', new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.28, 0.22, 4, 0.06), yellow), V(0, 0.04, 0))
  for (let i = 0; i < 3; i++) {
    const rib = add('upperBack', new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.008, 6, 32), black), V(0, 0 + i * 0.05, 0))
    rib.rotation.x = Math.PI / 2
    rib.scale.set(1.15, 0.72, 1)
  }
  marker('upperBack', V(0.182, 0.05, 0), V(1, 0, 0))
  marker('upperBack', V(-0.182, 0.05, 0), V(-1, 0, 0))
  // Neck: stacked rubber discs
  for (let i = 0; i < 4; i++) {
    add('neck', new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.022, 20), i % 2 ? black : rubber), V(0, 0.015 + i * 0.027, 0))
  }
  const head = add('head', new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 24), yellow), V(0, 0.09, 0))
  head.scale.set(0.88, 1.08, 1)
  marker('head', V(0.098, 0.1, 0), V(1, 0, 0), 0.04)
  marker('head', V(-0.098, 0.1, 0), V(-1, 0, 0), 0.04)

  for (const [side, s] of Object.entries(SIDES)) {
    // Legs
    seg(side + 'Hip', V(0, 0, 0), off(side + 'Knee'), 0.075, 0.062, yellow)
    seg(side + 'Knee', V(0, 0, 0), off(side + 'Ankle'), 0.058, 0.045, yellow)
    joint(side + 'Hip', 0.07); joint(side + 'Knee', 0.062); joint(side + 'Ankle', 0.045)
    marker(side + 'Knee', V(0, 0, 0.065), V(0, 0.15, 1).normalize(), 0.03)
    const foot = add(side + 'Ankle', new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.07, 0.27, 3, 0.025), black), V(0, -0.045, 0.06))
    foot.rotation.y = 0 // the toe-out is the ankle's job
    // Arms: ball joint, segment, ball joint, segment, ball joint, black mitten (palm faces inward at rest)
    seg(side + 'Shoulder', V(0, 0, 0), off(side + 'Elbow'), 0.055, 0.048, yellow)
    seg(side + 'Elbow', V(0, 0, 0), off(side + 'Wrist'), 0.046, 0.038, yellow, 0.035)
    joint(side + 'Shoulder', 0.065); joint(side + 'Elbow', 0.05); joint(side + 'Wrist', 0.034)
    add(side + 'Wrist', new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.1, 0.08, 3, 0.018), black), V(0, -0.055, 0))
    // Bolt caps on the outside of each elbow and knee
    for (const [j, d] of [['Elbow', 0.052], ['Knee', 0.064]]) {
      const c = add(side + j, new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 12), bolt), V(s * d, 0, 0))
      c.rotation.z = Math.PI / 2
    }
  }

  const materials = [yellow, black, rubber, bolt, targetBlack, targetYellow]
  return { root: bones.pelvis, bones, materials }
}
