// PROTOTYPE (RG-1): the mockup's 7-iron, copied unchanged from stories/mockups/swing-lab/scene.js.
import * as THREE from 'three'

const DEG = Math.PI / 180
const Y = new THREE.Vector3(0, 1, 0)

// A 7-iron in its own frame: origin at the heel of the sole, face toward +X, toe toward +Z,
// shaft rising toward the golfer at the lie angle. 37″, 34° loft, 62.5° lie.
export const CLUB = { name: '7-iron', lengthIn: 37, loftDeg: 34, lieDeg: 62.5 }

export function buildClub() {
  const LOFT = CLUB.loftDeg * DEG, LIE = CLUB.lieDeg * DEG, LENGTH = CLUB.lengthIn * 0.0254
  const club = new THREE.Group()
  const chrome = new THREE.MeshStandardMaterial({ color: '#d4d8dc', metalness: 0.55, roughness: 0.22 })
  const satin = new THREE.MeshStandardMaterial({ color: '#b9bec3', metalness: 0.45, roughness: 0.45 })
  const rubber = new THREE.MeshStandardMaterial({ color: '#1d1d1d', roughness: 0.9 })
  const grooveMat = new THREE.MeshStandardMaterial({ color: '#4a4f54', metalness: 0.3, roughness: 0.6 })

  // Blade profile seen face-on (x: heel→toe, y: sole→top line): low heel, taller rounded toe
  const profile = new THREE.Shape()
  profile.moveTo(0, 0.004)
  profile.quadraticCurveTo(0.002, 0, 0.012, 0)
  profile.lineTo(0.064, 0.001)
  profile.quadraticCurveTo(0.08, 0.003, 0.08, 0.024)
  profile.quadraticCurveTo(0.079, 0.046, 0.064, 0.048)
  profile.lineTo(0.014, 0.034)
  profile.quadraticCurveTo(0.003, 0.031, 0, 0.024)
  profile.lineTo(0, 0.004)
  const headGeo = new THREE.ExtrudeGeometry(profile, { depth: 1, bevelEnabled: false, curveSegments: 16 })
  // Extrusion depth becomes the back of the head: sole ~22 mm wide, top line ~8 mm, face sheared back by the loft
  const pos = headGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i), v = pos.getY(i), d = pos.getZ(i)
    const thick = 0.022 - 0.014 * Math.min(v / 0.045, 1)
    pos.setXYZ(i, -v * Math.tan(LOFT) - d * thick, v, u)
  }
  headGeo.computeVertexNormals()
  const head = new THREE.Mesh(headGeo, chrome)
  head.castShadow = head.receiveShadow = true
  club.add(head)

  for (let i = 0; i < 9; i++) {
    const y = 0.006 + i * 0.0038
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.0004, 0.0007, 0.046), grooveMat)
    g.position.set(-y * Math.tan(LOFT) + 0.0002, y, 0.04)
    g.rotation.z = LOFT
    club.add(g)
  }

  const up = new THREE.Vector3(0, Math.sin(LIE), -Math.cos(LIE))
  const base = new THREE.Vector3(-0.006, 0.006, 0)
  const along = (r0, r1, from, to, mat) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, to - from, 16), mat)
    m.position.copy(base).addScaledVector(up, (from + to) / 2)
    m.quaternion.setFromUnitVectors(Y, up)
    m.castShadow = true
    club.add(m)
  }
  along(0.0078, 0.0068, 0, 0.065, chrome) // hosel
  along(0.0048, 0.0075, 0.065, LENGTH - 0.26, satin) // shaft, tapering toward the head
  along(0.0098, 0.0118, LENGTH - 0.27, LENGTH, rubber) // grip
  const butt = new THREE.Mesh(new THREE.CircleGeometry(0.0118, 16), rubber)
  butt.position.copy(base).addScaledVector(up, LENGTH)
  butt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), up)
  club.add(butt)

  return { club, faceCentreAt: (h) => new THREE.Vector3(-h * Math.tan(LOFT), h, 0.04) }
}

