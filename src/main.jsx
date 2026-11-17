import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import LabApp from './lab/LabApp.jsx'
import './styles.css'

const RootApp = window.location.pathname.startsWith('/lab') ? LabApp : App
createRoot(document.getElementById('root')).render(<React.StrictMode><RootApp /></React.StrictMode>)
