import {createTheme} from '@mui/material/styles';
import { SEEN_COLOR, TODO_COLOR, TODO_CONTRAST_COLOR } from './StyleChoices';
declare module '@mui/material/styles' {
  interface Palette {
    seen: Palette['primary'];
    todo: Palette['primary'];
  }

  interface PaletteOptions {
    seen?: PaletteOptions['primary'];
    todo?: PaletteOptions['primary'];
  }
}

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
    seen: {main: SEEN_COLOR, },
    todo: {main: TODO_COLOR, contrastText: TODO_CONTRAST_COLOR},
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px',
        },
      },
    },
  },
} satisfies Parameters<typeof createTheme>[0];
