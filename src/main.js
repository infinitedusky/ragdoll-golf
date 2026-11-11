import './style.css'
import { renderHome } from './screens/home.js'
import { renderSwingLab } from './screens/swing-lab.js'

// PROTOTYPE: path → screen, with in-app links marked data-link
const ROUTES = { '/': renderHome, '/swing-lab': renderSwingLab }
const app = document.querySelector('#app')
let cleanup = null

function render() {
  cleanup?.()
  app.innerHTML = ''
  cleanup = (ROUTES[location.pathname] ?? renderHome)(app) || null
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]')
  if (!a) return
  e.preventDefault()
  history.pushState(null, '', a.getAttribute('href'))
  render()
})
window.addEventListener('popstate', render)
render()
