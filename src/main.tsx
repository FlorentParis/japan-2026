import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { TripProvider } from './state/TripProvider.tsx'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/map.css'
import './styles/timeline.css'
import './styles/views.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TripProvider>
      <App />
    </TripProvider>
  </StrictMode>,
)
