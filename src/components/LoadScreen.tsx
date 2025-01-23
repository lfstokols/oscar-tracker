import React, {Suspense} from 'react';
import {Box, CircularProgress} from '@mui/material';
import {QueryErrorResetBoundary} from '@tanstack/react-query';

export function LoadScreen(): React.ReactElement {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      width="100%"
      height="100%">
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
