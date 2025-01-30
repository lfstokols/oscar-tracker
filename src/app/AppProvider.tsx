/// <reference types="vite/client" />
import {CssBaseline} from '@mui/material';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter} from 'react-router-dom';
import QueryClientConfig from '../config/QueryClientConfig';
import ThemeConfig from '../config/ThemeConfig';
import AppContextProvider from '../providers/AppContextProvider';
import NotificationsContextProvider from '../providers/NotificationContextProvider';
import RouteParser from '../providers/RouteParser';

const ROUTE_BASENAME = import.meta.env.VITE_ROUTE_BASENAME;

const theme = createTheme(ThemeConfig);
const queryClient = new QueryClient(QueryClientConfig);

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <BrowserRouter basename={ROUTE_BASENAME}>
      <RouteParser>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <QueryClientProvider client={queryClient}>
            <AppContextProvider>
              <NotificationsContextProvider>
                {children}
              </NotificationsContextProvider>
            </AppContextProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </RouteParser>
    </BrowserRouter>
  );
}
