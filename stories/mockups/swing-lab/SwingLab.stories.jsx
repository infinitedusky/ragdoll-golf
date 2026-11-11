import { useEffect, useRef, useState } from 'react'
import { mountSwingLabScene, VIEWS, CLUB } from './scene.js'
import './swing-lab.css'

// MOCKUP (RG-1): the agreed Swing Lab screen (sketch B). The golfer is the crash-test dummy, posed point by
// point; the bone values are made up. The build gives it a real skeleton we define.
const BONES = [
  ['Hips', [0, 0, 0]], ['Spine', [28, 0, 0]], ['Spine2', [12, 0, 0]], ['Neck', [-20, 0, 0]],
  ['LeftArm', [62, -8, 4]], ['LeftForeArm', [6, 0, 0]], ['LeftHand', [0, 0, 0]],
  ['RightArm', [58, 10, -6]], ['RightForeArm', [14, 0, 0]], ['RightHand', [0, 0, 0]],
  ['LeftUpLeg', [-18, 0, 4]], ['RightUpLeg', [-18, 0, -4]],
]

function SwingLab({ view: initialView, skeleton: initialSkeleton, selectedBone }) {
  const stageRef = useRef(null)
  const sceneRef = useRef(null)
  const [view, setView] = useState(initialView)
  const [skeleton, setSkeleton] = useState(initialSkeleton)
  const [selected, setSelected] = useState(selectedBone)
  const [rotations, setRotations] = useState(() => Object.fromEntries(BONES))

  useEffect(() => {
    sceneRef.current = mountSwingLabScene(stageRef.current, { view: initialView, skeleton: initialSkeleton, onViewChange: setView })
    return () => sceneRef.current.dispose()
  }, [initialView, initialSkeleton])

  const pickView = (name) => {
    sceneRef.current.goTo(name)
    setView(name)
  }
  const toggleSkeleton = () => {
    sceneRef.current.setSkeleton(!skeleton)
    setSkeleton(!skeleton)
  }
  const setAxis = (bone, axis, value) =>
    setRotations((r) => ({ ...r, [bone]: r[bone].map((v, i) => (i === axis ? value : v)) }))

  return (
    <div className="swing-lab">
      <div className="swing-lab__stage" ref={stageRef}>
        <div className="swing-lab__top">
          <a href="/">← Home</a>
          <h1>Swing Lab</h1>
          <span className="swing-lab__licence">at address · crash-test dummy</span>
        </div>
        <div className="swing-lab__hint">drag to orbit · scroll to zoom · right-drag to pan</div>
        <div className="swing-lab__bar" role="toolbar" aria-label="View">
          {Object.entries(VIEWS).map(([name, v]) => (
            <button key={name} aria-pressed={view === name} onClick={() => pickView(name)}>{v.label}</button>
          ))}
          <span className="swing-lab__sep" />
          <button aria-pressed={skeleton} onClick={toggleSkeleton}>Skeleton</button>
          <button onClick={() => pickView('face')}>Reset view</button>
        </div>
      </div>

      <aside className="swing-lab__panel" aria-label="Skeleton">
        <h2>Club</h2>
        <div className="swing-lab__bone">
          <span>{CLUB.name} · {CLUB.lengthIn}″ · {CLUB.loftDeg}° loft · {CLUB.lieDeg}° lie</span>
          <span className="swing-lab__value">in RightHand</span>
        </div>
        <h2>Skeleton · {BONES.length} bones</h2>
        <div role="listbox" aria-label="Bones">
          {BONES.map(([name]) => (
            <div key={name}>
              <button
                className="swing-lab__bone"
                role="option"
                aria-selected={selected === name}
                onClick={() => setSelected(selected === name ? null : name)}
              >
                <span>{name}</span>
                <span className="swing-lab__value">{rotations[name].join(' · ')}</span>
              </button>
              {selected === name &&
                ['X', 'Y', 'Z'].map((axis, i) => (
                  <label className="swing-lab__axis" key={axis}>
                    {axis}
                    <input
                      type="range" min="-180" max="180" value={rotations[name][i]}
                      onChange={(e) => setAxis(name, i, Number(e.target.value))}
                    />
                    <output>{rotations[name][i]}°</output>
                  </label>
                ))}
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

export default {
  title: 'Mockups/SwingLab',
  component: SwingLab,
  args: { view: 'face', skeleton: false, selectedBone: null },
  argTypes: {
    view: { control: 'inline-radio', options: Object.keys(VIEWS) },
    selectedBone: { control: 'select', options: [null, ...BONES.map(([n]) => n)] },
  },
}

export const FaceOn = {}
export const DownTheLine = { args: { view: 'dtl' } }
export const Top = { args: { view: 'top' } }
export const ClubHead = { args: { view: 'club' } }
export const Skeleton = { args: { skeleton: true } }
export const BoneSelected = { args: { selectedBone: 'LeftArm' } }
