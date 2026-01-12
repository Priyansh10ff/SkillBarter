import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from './context/NotificationContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster position="top-center" toastOptions={{
      style: {
        background: '#1e293b',
        color: '#fff',
      }
    }} />
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>,
)