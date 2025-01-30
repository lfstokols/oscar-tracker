import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import {Container} from 'react-dom/client';
import App from './app/App';

const _root = ReactDOM.createRoot(
  document.getElementById('root') as Container,
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
