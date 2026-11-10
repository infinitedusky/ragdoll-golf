import { useEffect, useRef } from 'react'
import { renderHome } from '../src/screens/home.js'

// The app is vanilla JS; this mounts the real screen into a React-owned #app.
function Home() {
  const ref = useRef(null)
  useEffect(() => renderHome(ref.current), [])
  return <div id="app" ref={ref} />
}

export default {
  title: 'Screens/Home',
  component: Home,
}

export const Default = {}
