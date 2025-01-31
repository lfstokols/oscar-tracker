import Stack from '@mui/material/Stack';
import * as React from 'react';
import {useIsMobile} from '../hooks/useIsMobile';

type Props = {children: React.ReactNode};

export default function DefaultTabContainer({
  children,
}: Props): React.ReactElement {
  const isMobile = useIsMobile();

  return (
    <Stack
      alignItems="center"
      direction="column"
      gap={2}
      justifyContent="start"
      paddingTop={2}
      paddingX={2}
      sx={{
        height: isMobile ? 'calc(100vh - 56px)' : 'calc(100vh - 64px)',
        msOverflowStyle: '-ms-autohiding-scrollbar',
        scrollBehavior: 'smooth',
      }}
      width="100%">
      {children}
    </Stack>
  );
}
