import React from 'react';
import DefaultCatcher from '../components/LoadScreen';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import SiteHeader from '../features/SiteHeader/SiteHeader';
import AppProvider from './AppProvider';
import AppContent from './AppContent';

export default function App(): React.ReactElement {
  return (
    <DefaultCatcher>
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
            paddingBottom: '10px',
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
          <AppContent />
        </div>
      </AppProvider>
    </DefaultCatcher>
  );
}
