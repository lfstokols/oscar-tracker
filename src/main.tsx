import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import {Container} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import Routing from './app/Routing';

const _root = ReactDOM.createRoot(
  document.getElementById('root') as Container,
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routing />
    </BrowserRouter>
  </React.StrictMode>,
);
