import {Box, CircularProgress} from '@mui/material';
import {QueryErrorResetBoundary} from '@tanstack/react-query';
import * as React from 'react';
import {Suspense} from 'react';

export function LoadScreen(): React.ReactElement {
  return (
    <Box
      alignItems="center"
      display="flex"
      height="100%"
      justifyContent="center"
      width="100%">
      <CircularProgress color="inherit" />
    </Box>
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
