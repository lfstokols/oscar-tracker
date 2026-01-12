import CloseIcon from '@mui/icons-material/Close';
import {Box, IconButton, SwipeableDrawer, Typography} from '@mui/material';
import * as React from 'react';
import {useIsMobile} from '../hooks/useIsMobile';

type Props = {
  title: string;
  open: boolean;
  setOpen: (isOpen: boolean) => void;
  children: React.ReactNode;
};

export function PopupPage({title, open, setOpen, children}: Props) {
  const isMobile = useIsMobile();
  const anchor = isMobile ? 'bottom' : 'right';

  return (
    <SwipeableDrawer
      ModalProps={{keepMounted: true}} // helps performance on mobile
      PaperProps={{
        sx: {
          height: isMobile
            ? 'calc(100vh - var(--app-header-height, 64px))'
            : '100vh',
          width: isMobile ? '100%' : {xs: '100%', sm: 600, md: 700},
          borderTopLeftRadius: isMobile ? 16 : 0,
          borderTopRightRadius: isMobile ? 16 : 0,
          borderBottomLeftRadius: isMobile ? 0 : 16,
          overflow: 'hidden',
        },
      }}
      anchor={anchor}
      disableDiscovery={!isMobile}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      swipeAreaWidth={isMobile ? 24 : 0} // allows the user to grab from bottom edge when closed on mobile
    >
      {/* Top "tab/handle" area */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          bgcolor: 'background.paper',
          pt: 1,
          pb: 1,
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}>
        {isMobile ? (
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 999,
              bgcolor: 'text.disabled',
              mx: 'auto',
              mb: 1,
            }}
          />
        ) : null}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
          <Typography
            sx={{flex: 1, textAlign: isMobile ? 'center' : 'left'}}
            variant="subtitle1">
            {title}
          </Typography>
          <IconButton onClick={() => setOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{p: 2, overflow: 'auto', height: '100%'}}>{children}</Box>
    </SwipeableDrawer>
  );
}
