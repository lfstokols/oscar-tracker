import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import {Container} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import Routing from './app/Routing';

// Global error logging
const logError = (data: Record<string, unknown>) => {
  fetch('/api/log-error', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({...data, url: location.href, timestamp: new Date().toISOString()}),
  }).catch(() => {});
};

window.addEventListener('error', (e) => {
  const stack = 'stack' in e.error ? (e.error as {'stack': unknown}).stack : undefined;  
  logError({type: 'error', message: e.message, stack: stack});
});

window.addEventListener('unhandledrejection', (e) => {
  logError({type: 'unhandledrejection', message: String(e.reason)});
});

const _root = ReactDOM.createRoot(
  document.getElementById('root') as Container,
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routing />
    </BrowserRouter>
  </React.StrictMode>,
);
