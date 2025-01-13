
import OscarAppContextProvider, { useOscarAppContext } from '../globalProviders/AppContext';
import NotificationsContextProvider from '../globalProviders/NotificationContext';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
// import {createBrowserRouter, RouterProvider} from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      experimental_prefetchInRender: true,
    },
  },
});

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

export default function AppProvider({children}: {children: React.ReactNode}): React.ReactElement {
    return (
      <QueryClientProvider client={queryClient}>
        <OscarAppContextProvider>
          <NotificationsContextProvider>
          {/*<RouterProvider router={router} />*/}
            {children}
          </NotificationsContextProvider>
        </OscarAppContextProvider>
      </QueryClientProvider>
    );
  }