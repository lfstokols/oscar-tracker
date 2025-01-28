/// <reference types="vite/client" />
import OscarAppContextProvider from '../providers/AppContext';
import NotificationsContextProvider from '../providers/NotificationContext';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import {CssBaseline} from '@mui/material';
import ThemeConfig from '../config/ThemeConfig';
import QueryClientConfig from '../config/QueryClientConfig';
import {BrowserRouter} from 'react-router-dom';
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
            <OscarAppContextProvider>
              <NotificationsContextProvider>
                {children}
              </NotificationsContextProvider>
            </OscarAppContextProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </RouteParser>
    </BrowserRouter>
  );
}
