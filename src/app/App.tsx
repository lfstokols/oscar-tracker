import React, {Suspense} from 'react';
import {LoadScreen} from '../components/LoadScreen';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {Container} from '@mui/material';
import SiteHeader from '../features/siteHeader/SiteHeader';
import {Routes, Route, Navigate} from 'react-router-dom';
import HomeTab from './routes/HomeTab';
import UserTab from './routes/UserTab';
import CategoryTab from './routes/CategoryTab';
import AppProvider from './AppProvider';
import PageContainer from './AppContent';
import {ErrorBoundary} from 'react-error-boundary';
import ErrorPage from '../assets/ErrorPage.png';

export default function App(): React.ReactElement {
  return (
    <ErrorBoundary
      fallback={
        <Container
          sx={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <img
            src={ErrorPage}
            alt="Error"
            height={Math.min(window.innerHeight, window.innerWidth) * 0.8}
            width={Math.min(window.innerHeight, window.innerWidth) * 0.8}
          />
        </Container>
      }>
      <Suspense fallback={<LoadScreen />}>
        <AppProvider>
          <ReactQueryDevtools />
          <div
            className="App"
            style={{
              height: '100vh',
              width: '100vw',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: '12px',
            }}>
            <SiteHeader />
            <Routes>
              <Route path="/" element={<Navigate to="/legacy" replace />} />
              <Route
                path="/legacy"
                element={<PageContainer currentTab={<HomeTab />} />}
              />
              <Route
                path="/users"
                element={<PageContainer currentTab={<UserTab />} />}
              />
              <Route
                path="/categories"
                element={<PageContainer currentTab={<CategoryTab />} />}
              />
            </Routes>
          </div>
        </AppProvider>
      </Suspense>
    </ErrorBoundary>
  );
}

// const scrollbarStyle = `
//   /* For WebKit browsers */
// ::-webkit-scrollbar {
//   width: 8px; /* Width of the scrollbar */
//   height: 8px; /* Height of the horizontal scrollbar */
// }

// ::-webkit-scrollbar-thumb {
//   background-color: #888; /* Scrollbar color */
//   border-radius: 10px; /* Rounded edges */
//   border: 2px solid transparent; /* Optional space around thumb */
// }

// ::-webkit-scrollbar-thumb:hover {
//   background-color: #555; /* Darker shade when hovered */
// }

// ::-webkit-scrollbar-track {
//   background-color: #f0f0f0; /* Background of the scrollbar track */
//   border-radius: 10px; /* Match the thumb */
// }

// /* For Firefox */
// * {
//   scrollbar-width: thin; /* Makes the scrollbar thinner */
//   scrollbar-color: #888 #f0f0f0; /* Thumb and track colors */
// }
// `;
