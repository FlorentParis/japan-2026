import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { Visionneuse } from './components/Visionneuse.tsx'
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
      {/* La visionneuse enveloppe tout le site : n'importe quelle photo, dans
          n'importe quelle vue, doit pouvoir s'ouvrir en grand — et il ne doit
          jamais y en avoir deux ouvertes à la fois. */}
      <Visionneuse>
        <App />
      </Visionneuse>
    </TripProvider>
  </StrictMode>,
)
