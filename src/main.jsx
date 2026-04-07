import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import axios from 'axios'
import { decodeData } from './utils/decodeUtils'

import { AuthProvider } from './context/AuthContext.jsx'

// Global Axios Interceptor for HTML Entities Decoding
axios.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = decodeData(response.data);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// Check for updates every hour
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
)
