import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// 主题预设（避免闪白）
try {
  const t = localStorage.getItem('theme')
  if (t === 'light') document.documentElement.classList.remove('dark')
  else document.documentElement.classList.add('dark')
} catch {
  /* noop */
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
