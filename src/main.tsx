import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// In your main.tsx or App.tsx
import 'leaflet/dist/leaflet.css'; // MUST BE FIRST
import './index.css'; // Your custom CSS after


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
