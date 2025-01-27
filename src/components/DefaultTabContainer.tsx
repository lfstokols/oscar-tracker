import React from 'react';
import Stack from '@mui/material/Stack';
import {useIsMobile} from '../hooks/useIsMobile';

type Props = {children: React.ReactNode};

export default function DefaultTabContainer({
  children,
}: Props): React.ReactElement {
  const isMobile = useIsMobile();

  return (
    <Stack
      direction="column"
      gap={2}
      alignItems="center"
      justifyContent="start"
      width="100%"
      paddingTop={2}
      paddingX={2}
      sx={{
        height: isMobile ? 'calc(100vh - 56px)' : 'calc(100vh - 64px)',
        msOverflowStyle: '-ms-autohiding-scrollbar',
        scrollBehavior: 'smooth',
      }}>
      {children}
    </Stack>
  );
}
