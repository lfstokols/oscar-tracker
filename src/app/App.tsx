import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import * as React from 'react';
import {Suspense, useEffect, useRef, useState} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import AppErrorScreen from '../components/AppErrorScreen';
import {InvisibleFallback} from '../components/LoadScreen';
import AppHeader from '../features/app_header/AppHeader';
import {useIsMobile} from '../hooks/useIsMobile';
import AppContent from './AppContent';
import AppNavDrawer from './AppNavDrawer';
import AppProvider from './AppProvider';

export default function App(): React.ReactElement {
  const isMobile = useIsMobile();
  const isDrawerPersistent = !isMobile;
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(isDrawerPersistent);
  const prevIsMobile = useRef(isMobile);
  useEffect(() => {
    if (isMobile && !prevIsMobile.current && isDrawerOpen) {
      setIsDrawerOpen(false);
    }
    prevIsMobile.current = isMobile;
  }, [isMobile, isDrawerOpen]);

  return (
    <ErrorBoundary fallback={<AppErrorScreen isFullScreen />}>
      <Suspense fallback={<InvisibleFallback />}>
        <AppProvider>
          <ReactQueryDevtools />
          <div
            className="App"
            style={{
              height: '100vh',
              width: '100vw',
              display: 'flex',
              flexDirection: 'column',
            }}>
            <AppHeader
              isDrawerOpen={isDrawerOpen}
              isDrawerPersistent={isDrawerPersistent}
              setIsDrawerOpen={setIsDrawerOpen}
            />
            <AppNavDrawer
              isDrawerPersistent={isDrawerPersistent}
              onClose={() => setIsDrawerOpen(false)}
              open={isDrawerOpen}
            />
            <AppContent
              isDrawerOpen={isDrawerOpen}
              isDrawerPersistent={isDrawerPersistent}
            />
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
