import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/lora/latin-400.css'
import '@fontsource/lora/latin-400-italic.css'
import '@fontsource/petit-formal-script/latin-400.css'
import '@fontsource/cedarville-cursive/latin-400.css'
import './styles.css'

import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('#root introuvable dans index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
