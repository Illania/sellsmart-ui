import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { applyStoredAppearanceBeforeRender } from './themeScript.ts'

applyStoredAppearanceBeforeRender()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
