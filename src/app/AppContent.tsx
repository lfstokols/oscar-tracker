import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import {useOscarAppContext} from '../providers/AppContext';
import {AppTabType} from '../types/Enums';
import HomeTab from './routes/HomeTab';
import UserTab from './routes/UserTab';
import CategoryTab from './routes/CategoryTab';

// export function AppContent(): React.ReactElement {
//   const {selectedTab} = useOscarAppContext();
//   let currentTab = null;
//   switch (selectedTab) {
//     case AppTabType.legacy:
//       currentTab = <HomeTab />;
//       break;
//     case AppTabType.byUser:
//       currentTab = <UserTab />;
//       break;
//     case AppTabType.byCategory:
//       currentTab = <CategoryTab />;
//       break;
//   }

//   return mainPageContainer({currentTab});
// }

export default function mainPageContainer({
  currentTab,
}: {
  currentTab: React.ReactElement;
}): React.ReactElement {
  return (
    <Box
      sx={{
        width: '100vw',
        height: 0,
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        overflow: 'auto',
      }}>
      <Container
        maxWidth={false}
        sx={{
          overflowY: 'auto',
          msOverflowStyle: '-ms-autohiding-scrollbar',
          maxWidth: '100vw',
          scrollBehavior: 'smooth',
          height: '100%', // This forces the container to respect the flex layout
          display: 'flex',
          flexDirection: 'column',
          alignContent: 'fill',
          justifyContent: 'start',
          // backgroundColor: 'secondary.light',
        }}>
        {/* <Box sx={{my: 4, borderRadius: 2, width: '90vw'}}>{currentTab}</Box> */}
        {currentTab}
      </Container>
    </Box>
  );
}
