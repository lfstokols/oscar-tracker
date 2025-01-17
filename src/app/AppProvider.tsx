import OscarAppContextProvider from '../providers/AppContext';
import NotificationsContextProvider from '../providers/NotificationContext';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import {CssBaseline} from '@mui/material';
import ThemeConfig from '../config/ThemeConfig';
import QueryClientConfig from '../config/QueryClientConfig';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import App from './App';

const theme = createTheme(ThemeConfig);
const queryClient = new QueryClient(QueryClientConfig);

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <BrowserRouter basename="/oscars">
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
    </BrowserRouter>
  );
}
