import React, {useState} from 'react';
import NomineeTable from './components/NomineeTable';
import {Suspense} from 'react';
import UserControls from './components/UserControls';
import ErrorBoundary from './components/ErrorBoundary';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import OscarAppContextProvider from './contexts/AppContext';
import NotificationsContextProvider from './modules/notifications/NotificationContext';
import SiteHeader from './components/SiteHeader';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import SignUpModal from './components/userModal/SignUpModal';
import Countdown from './components/Countdown';

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
    <div className="App">
      <SiteHeader />
      <Container maxWidth="lg">
        <Box sx={{my: 4}}>
          <Suspense fallback={<LoadScreen />}>
            <NomineeTable />
            <div style={{display: 'flex', justifyContent: 'center'}}>
            <Countdown />
            </div>
          </Suspense>
        </Box>
      </Container>
    </div>
  );
}

export function LoadScreen(): React.ReactElement {
  return (
    <Backdrop
      sx={theme => ({color: '#fff', zIndex: theme.zIndex.drawer + 1})}
      open={true}
      onClick={() => {}}>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/playground',
    element: <SignUpModal />,
  },
]);

// Providers go here
export default function AppWrapper(): React.ReactElement {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadScreen />}>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools />
          <OscarAppContextProvider>
            <NotificationsContextProvider>
              {/*<RouterProvider router={router} />*/}
              <App />
            </NotificationsContextProvider>
          </OscarAppContextProvider>
        </QueryClientProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
