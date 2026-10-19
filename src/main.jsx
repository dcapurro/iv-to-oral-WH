import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { MedicationProvider } from './context/MedicationContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MedicationProvider>
      <App />
    </MedicationProvider>
  </React.StrictMode>,
)
