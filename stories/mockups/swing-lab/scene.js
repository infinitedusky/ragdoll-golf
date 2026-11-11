// MOCKUP (RG-1): the Swing Lab scene, with the golfer as a crash-test dummy built in code.
// Conventions: the golfer faces +Z, the target line runs along +X, units are metres.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const DEG = Math.PI / 180
const Y = new THREE.Vector3(0, 1, 0)

export const VIEWS = {
  face: { label: 'Face-on', pos: [0, 1.15, 4.6], target: [0, 0.8, 0.35] }, // square to the chest
  dtl: { label: 'Down the line', pos: [-4.8, 1.25, 0.75], target: [0, 0.75, 0.6] }, // behind the hands, along the target line
  top: { label: 'Top', pos: [0, 6, 0.42], target: [0, 0, 0.4] },
  club: { label: 'Club head', pos: [0.32, 0.1, 1.12], target: [0.02, 0.02, 0.95] }, // close on the head and ball
}

// Joint positions at address
const JOINTS = {
  ankleL: [0.21, 0.08, 0.02], ankleR: [-0.21, 0.08, 0.02],
  kneeL: [0.19, 0.5, 0.14], kneeR: [-0.19, 0.5, 0.14],
  hipL: [0.11, 0.92, -0.1], hipR: [-0.11, 0.92, -0.1], pelvis: [0, 0.94, -0.1],
  chest: [0, 1.33, 0.25], shoulderL: [0.2, 1.37, 0.24], shoulderR: [-0.2, 1.33, 0.27],
  neck: [0, 1.44, 0.33], head: [0, 1.53, 0.43],
  elbowL: [0.12, 1.06, 0.42], elbowR: [-0.12, 1.03, 0.44],
  handL: [0.02, 0.795, 0.5], handR: [0.02, 0.725, 0.537],
}
const BONES = [
  ['ankleL', 'kneeL'], ['kneeL', 'hipL'], ['ankleR', 'kneeR'], ['kneeR', 'hipR'], ['hipL', 'pelvis'], ['hipR', 'pelvis'],
  ['pelvis', 'chest'], ['chest', 'neck'], ['neck', 'head'], ['chest', 'shoulderL'], ['chest', 'shoulderR'],
  ['shoulderL', 'elbowL'], ['elbowL', 'handL'], ['shoulderR', 'elbowR'], ['elbowR', 'handR'],
]

function buildGolfer(J) {
  const body = new THREE.Group()
  // Crash-test dummy: yellow rigid segments, black ball joints, a stacked rubber neck, target markers
  const yellow = new THREE.MeshStandardMaterial({ color: '#f0bf2a', roughness: 0.45, metalness: 0.05, transparent: true })
  const black = new THREE.MeshStandardMaterial({ color: '#1b1b1d', roughness: 0.55, transparent: true })
  const neckRubber = new THREE.MeshStandardMaterial({ color: '#2a2a2c', roughness: 0.9, transparent: true })
  const bolt = new THREE.MeshStandardMaterial({ color: '#9aa0a6', metalness: 0.8, roughness: 0.3, transparent: true })

  const P = (p) => (p.isVector3 ? p : J[p])
  const add = (m) => { m.castShadow = m.receiveShadow = true; body.add(m); return m }
  // A segment from joint a to joint b, shortened at both ends so the joints show
  function seg(a, b, r0, r1, mat, gap = 0.03) {
    const A = P(a), B = P(b), dir = new THREE.Vector3().subVectors(B, A), len = dir.length() - 2 * gap
    const m = add(new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 20, 1), mat))
    m.position.copy(A).addScaledVector(dir, 0.5)
    m.quaternion.setFromUnitVectors(Y, dir.normalize())
    return m
  }
  function block(a, b, w, d, r, mat, gap = 0) {
    const A = P(a), B = P(b), dir = new THREE.Vector3().subVectors(B, A)
    const m = add(new THREE.Mesh(new RoundedBoxGeometry(w, dir.length() - 2 * gap, d, 4, r), mat))
    m.position.copy(A).addScaledVector(dir, 0.5)
    m.quaternion.setFromUnitVectors(Y, dir.normalize())
    return m
  }
  const joint = (p, r) => { const m = add(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), black)); m.position.copy(P(p)); return m }
  // Black-and-yellow quadrant target, facing along `normal`
  function marker(pos, normal, r = 0.035) {
    const g = new THREE.Group()
    for (let i = 0; i < 4; i++) {
      const q = new THREE.Mesh(new THREE.CircleGeometry(r, 12, i * Math.PI / 2, Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: i % 2 ? '#111' : '#ffd84a', side: THREE.DoubleSide }))
      g.add(q)
    }
    g.position.copy(pos)
    g.lookAt(pos.clone().add(normal))
    body.add(g)
  }
  const mid = (a, b, t = 0.5) => P(a).clone().lerp(P(b), t)

  // Legs
  for (const s of ['L', 'R']) {
    seg('hip' + s, 'knee' + s, 0.075, 0.062, yellow)
    seg('knee' + s, 'ankle' + s, 0.058, 0.045, yellow)
    joint('hip' + s, 0.07); joint('knee' + s, 0.062); joint('ankle' + s, 0.045)
    const side = s === 'L' ? 1 : -1
    marker(P('knee' + s).clone().add(new THREE.Vector3(0.0, 0.0, 0.065)), new THREE.Vector3(0, 0.15, 1).normalize(), 0.03)
    const f = add(new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.07, 0.27, 3, 0.025), black))
    f.position.copy(P('ankle' + s)).add(new THREE.Vector3(0.02 * side, -0.045, 0.06))
    f.rotation.y = 0.2 * side
  }
  // Pelvis: a black block across the hip joints
  const pelvis = add(new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.16, 0.2, 4, 0.04), black))
  pelvis.position.copy(J.pelvis).add(new THREE.Vector3(0, 0.02, 0))
  pelvis.rotation.x = 0.35
  // Lumbar: neckRubber cylinder, then the yellow chest block with ribs
  seg('pelvis', mid('pelvis', 'chest', 0.35), 0.09, 0.09, neckRubber, 0.0)
  const chest = block(mid('pelvis', 'chest', 0.3), J.chest, 0.36, 0.22, 0.06, yellow)
  for (let i = 1; i <= 3; i++) {
    const rib = add(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.008, 6, 32), black))
    rib.position.copy(mid('pelvis', 'chest', 0.45 + i * 0.13))
    rib.quaternion.copy(chest.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2))
    rib.scale.set(1.15, 0.72, 1)
  }
  marker(mid('pelvis', 'chest', 0.7).add(new THREE.Vector3(0.182, 0, 0)), new THREE.Vector3(1, 0, 0))
  marker(mid('pelvis', 'chest', 0.7).add(new THREE.Vector3(-0.182, 0, 0)), new THREE.Vector3(-1, 0, 0))
  // Neck: stacked neckRubber discs, then the head
  const neckDir = new THREE.Vector3().subVectors(J.head, J.neck)
  for (let i = 0; i < 4; i++) {
    const d = add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.022, 20), i % 2 ? black : neckRubber))
    d.position.copy(J.chest).lerp(J.neck, 0.3 + i * 0.25)
    d.quaternion.setFromUnitVectors(Y, new THREE.Vector3().subVectors(J.neck, J.chest).normalize())
  }
  const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 24), yellow))
  head.position.copy(J.head)
  head.scale.set(0.88, 1.08, 1)
  marker(J.head.clone().add(new THREE.Vector3(0.098, 0.01, 0)), new THREE.Vector3(1, 0, 0), 0.04)
  marker(J.head.clone().add(new THREE.Vector3(-0.098, 0.01, 0)), new THREE.Vector3(-1, 0, 0), 0.04)
  // Arms
  for (const s of ['L', 'R']) {
    joint('shoulder' + s, 0.065)
    seg('shoulder' + s, 'elbow' + s, 0.055, 0.048, yellow)
    joint('elbow' + s, 0.05)
    seg('elbow' + s, 'hand' + s, 0.046, 0.038, yellow, 0.035)
    joint('hand' + s, 0.034)
    // Bolt caps on the outside of each elbow and knee
    for (const j of ['elbow' + s, 'knee' + s]) {
      const c = add(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 12), bolt))
      c.position.copy(J[j]).add(new THREE.Vector3((s === 'L' ? 1 : -1) * (j.startsWith('knee') ? 0.064 : 0.052), 0, 0))
      c.rotation.z = Math.PI / 2
    }
  }
  // Mitten hands, black, wrapped round the grip
  for (const s of ['L', 'R']) {
    const h = add(new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.1, 0.05, 3, 0.02), black))
    h.position.copy(J['hand' + s]).add(new THREE.Vector3(0, -0.045, 0.02))
    h.rotation.x = 0.5
  }
  return { body, materials: [yellow, black, neckRubber, bolt] }
}

// A 7-iron in its own frame: origin at the heel of the sole, face toward +X, toe toward +Z,
// shaft rising toward the golfer at the lie angle. 37″, 34° loft, 62.5° lie.
export const CLUB = { name: '7-iron', lengthIn: 37, loftDeg: 34, lieDeg: 62.5 }

function buildClub() {
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

export function mountSwingLabScene(container, { view = 'face', skeleton = false, onViewChange } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.prepend(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#9fbfd4')
  scene.fog = new THREE.Fog('#9fbfd4', 18, 45)

  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.maxPolarAngle = Math.PI / 2 - 0.02
  controls.minDistance = 0.15
  controls.maxDistance = 15

  scene.add(new THREE.HemisphereLight('#dfefff', '#3b5a2c', 1.1))
  const sun = new THREE.DirectionalLight('#fff4e0', 2.4)
  sun.position.set(3, 6, 4)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 20 })
  sun.shadow.bias = -0.0005
  scene.add(sun)

  // Fairway with a mown stripe along the target line
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: '#4f8a3a', roughness: 1 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(80, 1.2), new THREE.MeshStandardMaterial({ color: '#5c9a45', roughness: 1 }))
  stripe.rotation.x = -Math.PI / 2
  stripe.position.set(0, 0.001, 0.95)
  stripe.receiveShadow = true
  scene.add(stripe)

  const J = Object.fromEntries(Object.entries(JOINTS).map(([k, v]) => [k, new THREE.Vector3(...v)]))
  const golfer = buildGolfer(J)
  scene.add(golfer.body)

  const { club, faceCentreAt } = buildClub()
  club.position.set(0.026, 0, 0.906)
  scene.add(club)
  club.updateMatrixWorld()

  const R = 0.0214
  const faceCentre = club.localToWorld(faceCentreAt(R))
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 }))
  ball.position.set(faceCentre.x + R + 0.003, R, faceCentre.z)
  ball.castShadow = true
  scene.add(ball)

  // Skeleton overlay: joints and bones, drawn through the body
  const skel = new THREE.Group()
  const jointMat = new THREE.MeshBasicMaterial({ color: '#ffcf3f', depthTest: false })
  for (const p of Object.values(J)) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), jointMat)
    s.position.copy(p)
    s.renderOrder = 2
    skel.add(s)
  }
  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(BONES.flatMap(([a, b]) => [J[a], J[b]])),
    new THREE.LineBasicMaterial({ color: '#ffcf3f', depthTest: false }),
  )
  lines.renderOrder = 1
  skel.add(lines)
  scene.add(skel)

  function setSkeleton(on) {
    skel.visible = on
    for (const m of golfer.materials) m.opacity = on ? 0.3 : 1
  }

  let tween = null
  function goTo(name, instant = false) {
    const v = VIEWS[name]
    const to = { pos: new THREE.Vector3(...v.pos), target: new THREE.Vector3(...v.target) }
    if (instant) {
      camera.position.copy(to.pos)
      controls.target.copy(to.target)
      tween = null
      return
    }
    tween = { from: { pos: camera.position.clone(), target: controls.target.clone() }, to, t0: performance.now(), ms: 700 }
  }
  // Dragging leaves the preset views
  controls.addEventListener('start', () => {
    tween = null
    onViewChange?.(null)
  })

  const resize = () => {
    const w = container.clientWidth || 1, h = container.clientHeight || 1
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(container)
  resize()

  setSkeleton(skeleton)
  goTo(view, true)

  renderer.setAnimationLoop((now) => {
    if (tween) {
      const k = Math.min((now - tween.t0) / tween.ms, 1)
      const e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2
      camera.position.lerpVectors(tween.from.pos, tween.to.pos, e)
      controls.target.lerpVectors(tween.from.target, tween.to.target, e)
      if (k === 1) tween = null
    }
    controls.update()
    renderer.render(scene, camera)
  })

  return {
    goTo,
    setSkeleton,
    dispose() {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        o.geometry?.dispose()
        for (const m of [o.material].flat()) m?.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
