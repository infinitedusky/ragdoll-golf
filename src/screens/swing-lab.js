// PROTOTYPE (RG-1): Swing Lab — a real rigged golfer at address, with the skeleton panel driving its joints.
// Conventions: the golfer faces +Z, the target line runs along +X, units are metres.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { buildClub, CLUB } from '../golfer/club.js'
import { createSkeleton, worldPosition } from '../golfer/skeleton.js'
import { ADDRESS_POSE, GOLFER_ROOT, CLUB_IN_RIGHT_HAND } from '../golfer/address-pose.js'
import './swing-lab.css'

export const VIEWS = {
  face: { label: 'Face-on', pos: [0, 1.15, 4.6], target: [0, 0.8, 0.35] },
  dtl: { label: 'Down the line', pos: [-4.8, 1.25, 0.75], target: [0, 0.75, 0.6] },
  top: { label: 'Top', pos: [0, 6, 0.42], target: [0, 0, 0.4] },
  club: { label: 'Club head', pos: [0.32, 0.1, 1.12], target: [0.02, 0.02, 0.95] },
}
const LICENCE = 'Xbot.glb · Mixamo (Adobe) via three.js examples'
const KEY_BONES = new Set(Object.keys(ADDRESS_POSE))

export function renderSwingLab(root) {
  root.innerHTML = `
<div class="swing-lab">
  <div class="swing-lab__stage">
    <div class="swing-lab__top">
      <a href="/" data-link>← Home</a>
      <h1>Swing Lab</h1>
      <span class="swing-lab__licence">at address · ${LICENCE}</span>
    </div>
    <div class="swing-lab__hint">drag to orbit · scroll to zoom · right-drag to pan</div>
    <div class="swing-lab__bar" role="toolbar" aria-label="View">
      ${Object.entries(VIEWS).map(([n, v]) => `<button data-view="${n}">${v.label}</button>`).join('')}
      <span class="swing-lab__sep"></span>
      <button data-skeleton aria-pressed="false">Skeleton</button>
      <button data-view="face" data-reset>Reset view</button>
    </div>
  </div>
  <aside class="swing-lab__panel" aria-label="Skeleton">
    <h2>Club</h2>
    <div class="swing-lab__bone">
      <span>${CLUB.name} · ${CLUB.lengthIn}″ · ${CLUB.loftDeg}° loft · ${CLUB.lieDeg}° lie</span>
      <span class="swing-lab__value">in RightHand</span>
    </div>
    <h2 data-count>Skeleton · loading…</h2>
    <label class="swing-lab__filter"><input type="checkbox" data-all> show fingers, eyes and ends</label>
    <button class="swing-lab__reset-pose" data-reset-pose>Reset to address</button>
    <div role="listbox" aria-label="Bones" data-bones></div>
  </aside>
</div>`

  const stage = root.querySelector('.swing-lab__stage')
  const scene3d = mountScene(stage)
  const viewButtons = [...root.querySelectorAll('[data-view]:not([data-reset])')]
  const markView = (name) => viewButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === name)))
  scene3d.onViewChange = markView
  markView('face')
  root.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { scene3d.goTo(b.dataset.view); markView(b.dataset.view) }))
  const skelBtn = root.querySelector('[data-skeleton]')
  skelBtn.addEventListener('click', () => {
    const on = skelBtn.getAttribute('aria-pressed') !== 'true'
    skelBtn.setAttribute('aria-pressed', String(on))
    scene3d.setSkeleton(on)
  })

  let selected = null
  const list = root.querySelector('[data-bones]')
  const showAll = root.querySelector('[data-all]')
  const fmt = (r) => r.map((v) => Math.round(v)).join(' · ')

  function renderList() {
    const skel = scene3d.skeleton
    if (!skel) return
    const bones = skel.list().filter((b) => showAll.checked || !/Thumb|Index|Middle|Ring|Pinky|Eye|_End/.test(b.name))
    root.querySelector('[data-count]').textContent = `Skeleton · ${bones.length} of ${skel.list().length} bones`
    list.innerHTML = bones.map(({ name, depth }) => `
      <div data-bone="${name}">
        <button class="swing-lab__bone" role="option" aria-selected="${selected === name}" style="padding-left:${8 + depth * 8}px">
          <span>${name}${KEY_BONES.has(name) ? '' : ' <i>bind</i>'}</span>
          <span class="swing-lab__value">${fmt(skel.get(name))}</span>
        </button>
        ${selected === name ? ['X', 'Y', 'Z'].map((a, i) => `
          <label class="swing-lab__axis">${a}
            <input type="range" min="-180" max="180" step="0.5" value="${skel.get(name)[i]}" data-axis="${i}">
            <output>${skel.get(name)[i]}°</output>
          </label>`).join('') : ''}
      </div>`).join('')
  }

  list.addEventListener('click', (e) => {
    const row = e.target.closest('.swing-lab__bone')
    if (!row) return
    const name = row.parentElement.dataset.bone
    selected = selected === name ? null : name
    scene3d.select(selected)
    renderList()
  })
  list.addEventListener('input', (e) => {
    const i = e.target.dataset.axis
    if (i === undefined) return
    const r = scene3d.skeleton.get(selected)
    r[i] = Number(e.target.value)
    scene3d.skeleton.set(selected, r)
    e.target.nextElementSibling.textContent = `${r[i]}°`
    list.querySelector(`[data-bone="${selected}"] .swing-lab__value`).textContent = fmt(r)
  })
  showAll.addEventListener('change', renderList)
  root.querySelector('[data-reset-pose]').addEventListener('click', () => { scene3d.skeleton.applyPose(ADDRESS_POSE); renderList() })
  scene3d.ready.then(renderList)

  return () => scene3d.dispose()
}

function mountScene(container) {
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

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: '#4f8a3a', roughness: 1 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(80, 1.2), new THREE.MeshStandardMaterial({ color: '#5c9a45', roughness: 1 }))
  stripe.rotation.x = -Math.PI / 2
  stripe.position.set(0, 0.001, 0.95)
  stripe.receiveShadow = true
  scene.add(stripe)

  const api = { skeleton: null, onViewChange: null }
  const materials = []
  let helper = null, skeletonOn = false
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffcf3f', depthTest: false, transparent: true, opacity: 0.85 }))
  marker.renderOrder = 3
  marker.visible = false
  scene.add(marker)
  let selectedBone = null

  api.ready = new GLTFLoader().loadAsync('/models/golfer.glb').then((gltf) => {
    const model = gltf.scene
    model.position.fromArray(GOLFER_ROOT)
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = o.receiveShadow = true
        o.frustumCulled = false
        for (const m of [o.material].flat()) { m.transparent = true; materials.push(m) }
      }
    })
    scene.add(model)
    api.skeleton = createSkeleton(model)
    api.skeleton.applyPose(ADDRESS_POSE)

    // Club in the right hand; the ball sits just in front of the face centre, where the pose puts the club
    const { club, faceCentreAt } = buildClub()
    club.position.fromArray(CLUB_IN_RIGHT_HAND.position)
    club.quaternion.fromArray(CLUB_IN_RIGHT_HAND.quaternion)
    club.scale.setScalar(CLUB_IN_RIGHT_HAND.scale)
    api.skeleton.bone('RightHand').add(club)
    scene.updateMatrixWorld(true)
    const R = 0.0214
    const face = club.localToWorld(faceCentreAt(R))
    const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 }))
    ball.position.set(face.x + R + 0.003, R, face.z)
    ball.castShadow = true
    scene.add(ball)

    helper = new THREE.SkeletonHelper(model)
    helper.material.depthTest = false
    helper.material.linewidth = 2
    helper.renderOrder = 2
    scene.add(helper)
    setSkeleton(skeletonOn)
  })

  function setSkeleton(on) {
    skeletonOn = on
    if (helper) helper.visible = on
    for (const m of materials) { m.opacity = on ? 0.3 : 1; m.depthWrite = !on }
  }

  let tween = null
  function goTo(name, instant = false) {
    const v = VIEWS[name]
    const to = { pos: new THREE.Vector3(...v.pos), target: new THREE.Vector3(...v.target) }
    if (instant) { camera.position.copy(to.pos); controls.target.copy(to.target); tween = null; return }
    tween = { from: { pos: camera.position.clone(), target: controls.target.clone() }, to, t0: performance.now(), ms: 700 }
  }
  controls.addEventListener('start', () => { tween = null; api.onViewChange?.(null) })

  const resize = () => {
    const w = container.clientWidth || 1, h = container.clientHeight || 1
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(container)
  resize()
  goTo('face', true)
  window.__cam = (pos, target) => { camera.position.fromArray(pos); controls.target.fromArray(target); tween = null } // PROTOTYPE: screenshot hook

  renderer.setAnimationLoop((now) => {
    if (tween) {
      const k = Math.min((now - tween.t0) / tween.ms, 1)
      const e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2
      camera.position.lerpVectors(tween.from.pos, tween.to.pos, e)
      controls.target.lerpVectors(tween.from.target, tween.to.target, e)
      if (k === 1) tween = null
    }
    controls.update()
    if (selectedBone) marker.position.copy(worldPosition(selectedBone))
    renderer.render(scene, camera)
  })

  return Object.assign(api, {
    goTo,
    setSkeleton,
    select(name) {
      selectedBone = name ? api.skeleton.bone(name) : null
      marker.visible = !!selectedBone
    },
    dispose() {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      controls.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  })
}
