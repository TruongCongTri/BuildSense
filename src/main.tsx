import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom';
import { WebSocketProvider } from './context/WebSocketProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebSocketProvider>
      <BrowserRouter>
      <App />
    </BrowserRouter>
    </WebSocketProvider>
  </StrictMode>,
)
