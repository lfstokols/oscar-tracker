import {Box, CircularProgress} from '@mui/material';
import {QueryErrorResetBoundary} from '@tanstack/react-query';
import * as React from 'react';
import {Suspense} from 'react';

/**
 * Visible loading spinner for route-level suspense boundaries.
 */
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

/**
 * Invisible fallback that lets the HTML spinner from index.html remain visible.
 * Use this for top-level suspense to avoid jarring transitions between spinners.
 */
export function InvisibleFallback(): React.ReactElement {
  return <div style={{display: 'none'}} />;
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
