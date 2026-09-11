import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Preload critical brand image assets immediately on startup
if (typeof window !== 'undefined') {
  const logoPreload = new Image();
  logoPreload.src = '/CSiLogo.png';
  const iconPreload = new Image();
  iconPreload.src = '/app-icon.png';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
