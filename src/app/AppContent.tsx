import React from 'react';
import Box from '@mui/material/Box';
import {Routes, Route, Navigate} from 'react-router-dom';
import HomeTab from './routes/HomeTab';
import UserTab from './routes/UserTab';
import CategoryTab from './routes/CategoryTab';
import {DRAWER_WIDTH} from './AppNavDrawer';

type Props = {isDrawerOpen: boolean; isDrawerPersistent: boolean};

export default function AppContent({
  isDrawerOpen,
  isDrawerPersistent,
}: Props): React.ReactElement {
  return (
    <Box
      sx={theme => ({
        ...(isDrawerPersistent
          ? {
              width: isDrawerOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
              marginLeft: isDrawerOpen ? `${DRAWER_WIDTH}px` : 0,
              transition: isDrawerOpen
                ? theme.transitions.create(['margin', 'width'], {
                    easing: theme.transitions.easing.easeOut,
                    duration: theme.transitions.duration.enteringScreen,
                  })
                : theme.transitions.create(['margin', 'width'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                  }),
            }
          : {}),
        flexGrow: 1,
        display: 'flex',
      })}>
      <Routes>
        <Route path="/" element={<Navigate to="/legacy" replace />} />
        <Route path="/legacy" element={<HomeTab />} />
        <Route path="/users" element={<UserTab />} />
        <Route path="/categories" element={<CategoryTab />} />
      </Routes>
    </Box>
  );
}
