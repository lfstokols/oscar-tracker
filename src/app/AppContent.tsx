import React from 'react';
import Box from '@mui/material/Box';
import {Routes, Route, Navigate, useParams} from 'react-router-dom';
import HomeTab from './routes/HomeTab';
import UserTab from './routes/UserTab';
import CategoryTab from './routes/CategoryTab';
import {DRAWER_WIDTH} from './AppNavDrawer';
import {
  LEGACY_URL,
  BY_USER_URL,
  BY_CATEGORY_URL,
  DEFAULT_YEAR,
} from '../config/GlobalConstants';
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
        {/* <Route
          path="/"
          element={<Navigate to={`/${LEGACY_URL}/${DEFAULT_YEAR}`} replace />}
        /> */}
        {/* Redirect for year with no tab */}
        {/* <Route path="/:year" element={<TablessRedirect />} /> */}
        {/* Redirect for tab with no year */}
        {/* <Route
          path={`/:tab(${LEGACY_URL}|${BY_USER_URL}|${BY_CATEGORY_URL})`}
          element={<YearlessRedirect />}
        /> */}
        {/* Actual paths */}
        <Route path={`/${LEGACY_URL}/:year`} element={<HomeTab />} />
        <Route path={`/${BY_USER_URL}/:year`} element={<UserTab />} />
        <Route path={`/${BY_CATEGORY_URL}/:year`} element={<CategoryTab />} />
      </Routes>
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
