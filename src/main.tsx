import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext.tsx'
import { BinanceStreamProvider } from './context/BinanceStreamContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <BinanceStreamProvider>
        <App />
      </BinanceStreamProvider>
    </LanguageProvider>
  </StrictMode>,
)

