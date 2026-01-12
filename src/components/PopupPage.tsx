import CloseIcon from '@mui/icons-material/Close';
import {Box, IconButton, SwipeableDrawer, Typography} from '@mui/material';
import * as React from 'react';

type Props = {
  title: string;
  open: boolean;
  setOpen: (isOpen: boolean) => void;
  children: React.ReactNode;
};

export function PopupPage({title, open, setOpen, children}: Props) {
  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Open sheet
      </button>

      <SwipeableDrawer
        ModalProps={{keepMounted: true}} // helps performance on mobile
        PaperProps={{
          sx: {
            height: 'calc(100vh - var(--app-header-height, 64px))', // 100vh minus AppBar height from CSS variable
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
          },
        }}
        anchor="bottom"
        disableDiscovery={false}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        swipeAreaWidth={24} // allows the user to grab from bottom edge when closed (tweak as desired)
      >
        {/* Top “tab/handle” area */}
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

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}>
            <Typography sx={{flex: 1, textAlign: 'center'}} variant="subtitle1">
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
    </>
  );
}
