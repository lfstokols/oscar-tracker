import React from 'react';
import ReactDOM, {Container} from 'react-dom/client';
import App from './app/App';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const root = ReactDOM.createRoot(
  document.getElementById('root') as Container,
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
