import React from 'react';
import ErrorPage from '../assets/ErrorPage.png';
import {Container} from '@mui/material';

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
        src={ErrorPage}
        alt="Error"
        height={Math.min(window.innerHeight, window.innerWidth) * 0.8}
        width={Math.min(window.innerHeight, window.innerWidth) * 0.8}
      />
    </Container>
  );
}
