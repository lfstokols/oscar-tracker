import Box from '@mui/material/Box';
import * as React from 'react';
import {Outlet} from 'react-router-dom';
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
      <Outlet />
    </Box>
  );
}

// function YearlessRedirect(): React.ReactElement {
//   const params = useParams();
//   return <Navigate to={`/${params.tab}/${DEFAULT_YEAR}`} replace />;
// }
// function TablessRedirect(): React.ReactElement {
//   const params = useParams();
//   return <Navigate to={`/${LEGACY_URL}/${params.year}`} replace />;
// }
