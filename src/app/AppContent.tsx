import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import  { useOscarAppContext } from '../globalProviders/AppContext';
import {AppTabType} from '../types/Enums';
import HomeTab from './routes/HomeTab';

export default function AppContent(): React.ReactElement {
  const {selectedTab} = useOscarAppContext();
  let currentTab = null;
  switch(selectedTab) {
    case AppTabType.legacy:
      currentTab = <HomeTab />;
  }

  return (
    <Container sx={{
      flexGrow: 1,
      overflow: 'auto',
      scrollBehavior: 'smooth',
      height: 0, // This forces the container to respect the flex layout
      display: 'flex',
    }}>
      <Box sx={{my: 4,  borderRadius: 2, width: '90vw'}}>
        {currentTab}
      </Box>
    </Container>
  );
}