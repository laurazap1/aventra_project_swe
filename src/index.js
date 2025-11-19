import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext"; 

const root = ReactDOM.createRoot(document.getElementById("root"));

// Global error capture: collect runtime errors with details to help debugging.
function captureGlobalErrors() {
  try {
    window.addEventListener('error', (ev) => {
      try {
        const payload = {
          message: ev.message || 'error',
          source: ev.filename || (ev && ev.srcElement && ev.srcElement.src) || null,
          lineno: ev.lineno || null,
          colno: ev.colno || null,
          error: ev.error ? (ev.error.stack || ev.error.message || String(ev.error)) : null,
          time: new Date().toISOString()
        };
        console.error('Captured global error', payload);
        try { localStorage.setItem('aventra_last_runtime_error', JSON.stringify(payload)); } catch (e) {}
      } catch (e) { console.error('error in global error handler', e); }
    });

    window.addEventListener('unhandledrejection', (ev) => {
      try {
        const payload = {
          message: ev.reason ? (ev.reason.message || String(ev.reason)) : 'unhandledrejection',
          source: null,
          lineno: null,
          colno: null,
          error: ev.reason ? (ev.reason.stack || String(ev.reason)) : null,
          time: new Date().toISOString()
        };
        console.error('Captured unhandledrejection', payload);
        try { localStorage.setItem('aventra_last_runtime_promise_rejection', JSON.stringify(payload)); } catch (e) {}
      } catch (e) { console.error('error in global unhandledrejection handler', e); }
    });
  } catch (e) {
    console.error('Failed to install global error handlers', e);
  }
}

captureGlobalErrors();

root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
