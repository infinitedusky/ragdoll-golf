// PROTOTYPE (RG-1): the golfer's skeleton by name. Bones are named as in the GLB without the
// "mixamorig:" prefix. Rotations are local Euler XYZ in degrees, relative to the bind (T-)pose, whose
// bind rotations are all identity in this rig — so at bind, X/Y/Z are the world axes.
import * as THREE from 'three'

const DEG = Math.PI / 180
const PREFIX = /^mixamorig:?/ // GLTFLoader drops the colon: mixamorigHips

export function createSkeleton(model) {
  const bones = new Map()
  model.traverse((o) => {
    if (o.isBone) bones.set(o.name.replace(PREFIX, ''), o)
  })
  const depth = (b) => { let d = 0; for (let p = b.parent; p?.isBone; p = p.parent) d++; return d }

  return {
    // [{ name, depth }] in hierarchy order
    list: () => [...bones].map(([name, b]) => ({ name, depth: depth(b) })),
    bone: (name) => bones.get(name),
    get(name) {
      const r = bones.get(name).rotation
      return [r.x, r.y, r.z].map((v) => Math.round((v / DEG) * 10) / 10 + 0)
    },
    set(name, [x, y, z]) {
      bones.get(name).rotation.set(x * DEG, y * DEG, z * DEG, 'XYZ')
    },
    // Back to bind, then apply a name → degrees table
    applyPose(pose) {
      for (const b of bones.values()) b.quaternion.identity()
      for (const [name, r] of Object.entries(pose)) this.set(name, r)
    },
  }
}

export const worldPosition = (bone) => bone.getWorldPosition(new THREE.Vector3())
