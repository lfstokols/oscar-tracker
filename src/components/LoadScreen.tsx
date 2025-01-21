import React, {Suspense} from 'react';
import {Container, CircularProgress} from '@mui/material';
import {QueryErrorResetBoundary} from '@tanstack/react-query';

export function LoadScreen(): React.ReactElement {
  return (
    <Container
      sx={theme => ({
        color: '#fff',
        // zIndex: theme.zIndex.drawer + 1,
        flexGrow: 1,
      })}
      // open={true}
      // onClick={() => {}}>
    >
      <CircularProgress color="inherit" />
    </Container>
  );
}

export default function DefaultCatcher({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <QueryErrorResetBoundary>
      <Suspense fallback={<LoadScreen />}>{children}</Suspense>
    </QueryErrorResetBoundary>
  );
}
