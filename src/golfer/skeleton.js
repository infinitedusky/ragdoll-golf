// PROTOTYPE (RG-1): the golfer's skeleton by name. Rotations are local Euler XYZ in degrees relative to the
// rest pose (standing, arms down), where every bone's rest rotation is identity — so at rest a bone's X/Y/Z
// are the world axes. Axes at rest: X is left (+X) to right, pitching forward/back; Y is vertical, turning;
// Z is the front-to-back axis, rolling sideways. Positive X on a bone pointing up (spine) leans it forward;
// on a bone pointing down (arm, leg) it swings it back.
import { BONE_DEFS, GROUPS } from './dummy.js'

const DEG = Math.PI / 180

export function createSkeleton(bones) {
  return {
    names: () => BONE_DEFS.map((d) => d.name),
    // [{ group, bones: [{ name, label }] }], flat and ordered from the body outward
    groups: () => GROUPS.map((group) => ({ group, bones: BONE_DEFS.filter((d) => d.group === group).map(({ name, label }) => ({ name, label })) })),
    bone: (name) => bones[name],
    get(name) {
      const r = bones[name].rotation
      return [r.x, r.y, r.z].map((v) => Math.round((v / DEG) * 10) / 10 + 0)
    },
    set(name, [x, y, z]) {
      bones[name].rotation.set(x * DEG, y * DEG, z * DEG, 'XYZ')
    },
    // Back to rest, then apply a name → degrees table
    applyPose(pose) {
      for (const b of Object.values(bones)) b.quaternion.identity()
      for (const [name, r] of Object.entries(pose)) this.set(name, r)
    },
  }
}
