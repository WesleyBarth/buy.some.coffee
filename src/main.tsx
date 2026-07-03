import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastProvider } from '@hyperview/ui'
import '@hyperview/ui/styles.css'
import './hyperview-overrides.css'
import App from './App.tsx'

document.documentElement.dataset.hvTheme = 'dark'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider position="bottom-right">
      <App />
    </ToastProvider>
  </StrictMode>,
)
