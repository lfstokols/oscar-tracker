import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// A custom theme for this app
export default {
  cssVariables: true,
  palette: {
    mode: 'dark',
    secondary: {
      // main: '#b71c1c',
      main: '#EEBD22',
    },
    // secondary: {
    //   main: '#E3D026',
    // },
    // error: {
    //   main: red.A400,
    // },
  },
} satisfies Parameters<typeof createTheme>[0];