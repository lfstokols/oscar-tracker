import React from 'react';
import LegacyTable from './features/LegacyTable';
import {Suspense} from 'react';
import DefaultCatcher from './components/LoadScreen';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import OscarAppContextProvider from './globalProviders/AppContext';
import NotificationsContextProvider from './globalProviders/NotificationContext';
import SiteHeader from './features/SiteHeader/SiteHeader';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import Countdown from './components/Countdown';
import {LoadScreen} from './components/LoadScreen';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      experimental_prefetchInRender: true,
    },
  },
});

export type WatchFilter = 'all' | 'watched' | 'unwatched';

function App(): React.ReactElement {
  return (
    <div className="App" style={{
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
        <style>{`
          ::-webkit-scrollbar {
            display: none;
          }
          * {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `}</style>
      <SiteHeader />
      <Container sx={{
        flexGrow: 1,
        overflow: 'auto',
        scrollBehavior: 'smooth',
        height: 0, // This forces the container to respect the flex layout
        display: 'flex',
      }} >
        <Box sx={{my: 4,  borderRadius: 2, width: '90vw'}}>
          <Suspense fallback={<LoadScreen />}>
            <LegacyTable />
            <div style={{display: 'flex', justifyContent: 'center'}}>
            {/* <Countdown /> */}
            </div>
          </Suspense>
        </Box>
      </Container>
    </div>
  );
}



// const router = createBrowserRouter([
//   {
//     path: '/',
//     element: <App />,
//   },
//   {
//     path: '/playground',
//     element: <SignUpModal />,
//   },
// ]);

// Providers go here
export default function AppWrapper(): React.ReactElement {
  return (
    <DefaultCatcher>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools />
          <OscarAppContextProvider>
            <NotificationsContextProvider>
              {/*<RouterProvider router={router} />*/}
              <App />
            </NotificationsContextProvider>
          </OscarAppContextProvider>
        </QueryClientProvider>
    </DefaultCatcher>
  );
}
