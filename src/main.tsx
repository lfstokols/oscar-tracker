import React from 'react';
import ReactDOM, { Container } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './assets/Theme';
import App from './App';
//import SignUp from './SignUp';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const root = ReactDOM.createRoot(
  document.getElementById('root') as Container
).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
