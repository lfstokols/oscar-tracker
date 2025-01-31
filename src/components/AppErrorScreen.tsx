import {Container} from '@mui/material';
import * as React from 'react';
import ErrorPage from '../assets/ErrorPage.png';

export default function AppErrorScreen({
  isFullScreen,
}: {
  isFullScreen: boolean;
}): React.ReactElement {
  return (
    <Container
      sx={{
        height: isFullScreen ? '100vh' : '100%',
        width: isFullScreen ? '100vw' : '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <img
        alt="Error"
        height={Math.min(window.innerHeight, window.innerWidth) * 0.8}
        src={ErrorPage}
        width={Math.min(window.innerHeight, window.innerWidth) * 0.8}
      />
    </Container>
  );
}
