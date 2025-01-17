import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import {useOscarAppContext} from '../providers/AppContext';
import {AppTabType} from '../types/Enums';
import HomeTab from './routes/HomeTab';
import UserTab from './routes/UserTab';
import CategoryTab from './routes/CategoryTab';

export function AppContent(): React.ReactElement {
  const {selectedTab} = useOscarAppContext();
  let currentTab = null;
  switch (selectedTab) {
    case AppTabType.legacy:
      currentTab = <HomeTab />;
      break;
    case AppTabType.byUser:
      currentTab = <UserTab />;
      break;
    case AppTabType.byCategory:
      currentTab = <CategoryTab />;
      break;
  }

  return mainPageContainer({currentTab});
}

export default function mainPageContainer({
  currentTab,
}: {
  currentTab: React.ReactElement;
}): React.ReactElement {
  return (
    <Container
      sx={{
        flexGrow: 1,
        overflow: 'auto',
        scrollBehavior: 'smooth',
        height: 0, // This forces the container to respect the flex layout
        display: 'flex',
      }}>
      <Box sx={{my: 4, borderRadius: 2, width: '90vw'}}>{currentTab}</Box>
    </Container>
  );
}
