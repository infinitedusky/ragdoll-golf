// PROTOTYPE (RG-1): the address pose, solved by scripts/solve-address.mjs on the dummy skeleton (body by hand, arms by two-bone IK).
// Local Euler XYZ in degrees relative to the rest pose; bones not listed stay at rest.
export const ADDRESS_POSE = {
  pelvis: [30, 0, 0],
  lowerBack: [5, 8, 6],
  upperBack: [3, 10, 5],
  neck: [-14, 0, -6],
  head: [-10, 0, -4],
  leadShoulder: [-63.2, -36.6, -24.1],
  leadElbow: [-36.6, 0, 0],
  leadWrist: [15.7, 33.4, 10.2],
  trailShoulder: [-44.8, 49.9, -12.8],
  trailElbow: [-32.5, 0, 0],
  trailWrist: [15.2, -48.8, -26.3],
  leadHip: [-48, 0, 7],
  leadKnee: [34, 0, 0],
  leadAnkle: [-14.5, 11.7, -6.8],
  trailHip: [-48, 0, -7],
  trailKnee: [34, 0, 0],
  trailAnkle: [-15.2, -5.8, 6.7],
}

// Where the pelvis (the root bone) stands, metres: feet flat on the ground, arms nearly straight
export const ADDRESS_ROOT = [0, 0.895, 0.0202]

// The club in the trail wrist's frame (metres, unit quaternion)
export const CLUB_IN_TRAIL_WRIST = { position: [0.04, -0.8301, -0.0028], quaternion: [0.23769, 0, 0, 0.97134] }
