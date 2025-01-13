
import OscarAppContextProvider, { useOscarAppContext } from '../globalProviders/AppContext';
import NotificationsContextProvider from '../globalProviders/NotificationContext';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import ThemeConfig from '../config/ThemeConfig';
import QueryClientConfig from '../config/QueryClientConfig';
// import {createBrowserRouter, RouterProvider} from 'react-router-dom';

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

const queryClient = new QueryClient(QueryClientConfig);
const theme = createTheme(ThemeConfig);

export default function AppProvider({children}: {children: React.ReactNode}): React.ReactElement {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
                <OscarAppContextProvider>
                    <NotificationsContextProvider>
                        {/*<RouterProvider router={router} />*/}
                        {children}
                    </NotificationsContextProvider>
                </OscarAppContextProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
  }