import { useEffect, useRef } from 'react'
import { renderHome } from '../../src/screens/home.js'
import './swing-lab-mockup.css'

// Mockups for RG-1 (Swing Lab screen with a rigged golfer). Static drawings of
// what the build should look like; the real screen replaces the drawn golfer
// with a three.js scene and the rigged GLB.

const body = '#b8bcc6'
const joint = '#3b3f4a'
const arm = '#8d93a0'

// A Mixamo-style mannequin at address, seen face-on (target to the viewer's right).
function Golfer() {
  const limb = { stroke: body, strokeLinecap: 'round', fill: 'none' }
  const j = (x, y, r = 6) => <circle cx={x} cy={y} r={r} fill={joint} />
  return (
    <svg className="sl-mock__golfer" viewBox="90 125 220 330" aria-label="Golfer at address">
      <ellipse cx="200" cy="444" rx="80" ry="8" fill="rgba(0,0,0,0.18)" />
      {/* legs: hips, flexed knees, ankles */}
      <polyline points="172,300 165,370 160,432" {...limb} strokeWidth="20" />
      <polyline points="228,300 235,370 240,432" {...limb} strokeWidth="20" />
      <rect x="146" y="428" width="26" height="12" rx="5" fill={joint} />
      <rect x="230" y="428" width="26" height="12" rx="5" fill={joint} />
      {/* pelvis and spine tilted away from the target, right shoulder lower */}
      <path d="M166 288 L234 288 L230 312 L170 312 Z" fill={body} />
      <path d="M164 200 L240 191 L226 250 L230 292 L170 292 L176 250 Z" fill={body} />
      {/* head, tilted a little, eyes on the ball */}
      <line x1="203" y1="196" x2="205" y2="180" {...limb} strokeWidth="12" />
      <circle cx="206" cy="160" r="22" fill={body} />
      {/* arms hanging to the grip, hands slightly ahead of the ball */}
      <polyline points="170,204 184,252 202,296" {...limb} stroke={arm} strokeWidth="13" />
      <polyline points="234,196 226,250 210,292" {...limb} stroke={arm} strokeWidth="13" />
      {j(184, 252)}
      {j(226, 250)}
      {j(165, 370)}
      {j(235, 370)}
      {j(170, 204, 7)}
      {j(234, 196, 7)}
      {/* club: grip in both hands, shaft leaning toward the target, head at the ball */}
      <line x1="210" y1="288" x2="196" y2="436" stroke="#2a2a2a" strokeWidth="4" strokeLinecap="round" />
      <line x1="210" y1="288" x2="206" y2="320" stroke="#111" strokeWidth="7" strokeLinecap="round" />
      <path d="M184 434 L204 432 L206 442 L182 443 Z" fill="#555" />
      <circle cx="207" cy="285" r="7" fill={joint} />
      <circle cx="205" cy="300" r="7" fill={joint} />
      <circle cx="213" cy="439" r="5" fill="#fff" stroke="#ccc" />
    </svg>
  )
}

// Ground plane: lines converge on a vanishing point above the horizon; rows
// get closer together toward it.
function Ground() {
  const rails = Array.from({ length: 41 }, (_, i) => (i - 20) * 15)
  const rows = Array.from({ length: 12 }, (_, i) => 100 * (1 - 1 / (1 + i * 0.35)))
  const grid = 'rgba(0,0,0,0.12)'
  return (
    <svg className="sl-mock__ground" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <rect width="100" height="100" fill="#7fae6a" />
      {rails.map((x) => (
        <line key={x} x1="50" y1="-40" x2={50 + x} y2="100" stroke={grid} strokeWidth="0.3" />
      ))}
      {rows.map((y) => (
        <line key={y} x1="0" y1={100 - y} x2="100" y2={100 - y} stroke={grid} strokeWidth="0.4" />
      ))}
    </svg>
  )
}

function Gizmo() {
  return (
    <svg className="sl-mock__gizmo" viewBox="-32 -32 64 64" aria-label="Camera orientation">
      <circle r="30" fill="rgba(8,6,13,0.35)" />
      <line x1="0" y1="0" x2="20" y2="6" stroke="#ff5a5a" strokeWidth="3" />
      <line x1="0" y1="0" x2="0" y2="-22" stroke="#6fdc6f" strokeWidth="3" />
      <line x1="0" y1="0" x2="-12" y2="12" stroke="#6aa8ff" strokeWidth="3" />
      <text x="22" y="10" fill="#fff" fontSize="9">X</text>
      <text x="3" y="-22" fill="#fff" fontSize="9">Y</text>
      <text x="-22" y="20" fill="#fff" fontSize="9">Z</text>
    </svg>
  )
}

function SwingLab({ state }) {
  return (
    <div className="sl-mock">
      <header className="sl-mock__bar">
        <a href="#/">← Home</a>
        <h1>Swing Lab</h1>
      </header>
      <main className="sl-mock__view">
        <Ground />
        {state === 'ready' && (
          <>
            <Golfer />
            <Gizmo />
            <span className="sl-mock__chip sl-mock__hint">Drag to orbit · scroll to zoom · right-drag to pan</span>
            <span className="sl-mock__chip sl-mock__credit">Golfer model: CC0 (see licence in repo)</span>
          </>
        )}
        {state === 'loading' && (
          <div className="sl-mock__center">
            <div className="sl-mock__spinner" />
            <span>Loading golfer…</span>
          </div>
        )}
        {state === 'error' && (
          <div className="sl-mock__center">
            <div className="sl-mock__card">
              <h2>Couldn't load the golfer</h2>
              <p>
                The model at <code>/models/golfer.glb</code> didn't load. The ground and camera still
                work.
              </p>
              <button className="sl-mock__btn" type="button">Try again</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// The way in: the real Home screen with the Swing Lab link added below the counter.
function HomeWithEntry() {
  const ref = useRef(null)
  useEffect(() => {
    renderHome(ref.current)
    const link = document.createElement('a')
    link.className = 'sl-mock__entry'
    link.href = '#/swing-lab'
    link.textContent = 'Open Swing Lab →'
    ref.current.querySelector('#counter').after(link)
  }, [])
  return <div id="app" ref={ref} />
}

export default {
  title: 'Mockups/SwingLab',
  component: SwingLab,
}

export const AtAddress = { args: { state: 'ready' } }
export const Loading = { args: { state: 'loading' } }
export const ModelFailed = { args: { state: 'error' } }
export const HomeEntry = { render: () => <HomeWithEntry /> }
