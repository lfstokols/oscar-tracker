/// <reference types="vite/client" />
import {CssBaseline} from '@mui/material';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import QueryClientConfig from '../config/QueryClientConfig';
import ThemeConfig from '../config/ThemeConfig';
import AppContextProvider from '../providers/AppContextProvider';
import NotificationsContextProvider from '../providers/NotificationContextProvider';

const theme = createTheme(ThemeConfig);
const queryClient = new QueryClient(QueryClientConfig);

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
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
  );
}
