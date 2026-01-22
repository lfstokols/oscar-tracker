import {Navigate, Route, Routes} from 'react-router-dom';
import AppErrorScreen from '../components/AppErrorScreen';
import {
  BY_CATEGORY_URL,
  BY_USER_URL,
  HOME_URL,
  LEGACY_URL,
  MOVIES_URL,
} from '../config/GlobalConstants';
import App from './App';
import CategoryTab from './routes/CategoryTab';
import HomeTab from './routes/HomeTab';
import LegacyTab from './routes/LegacyTab';
import UserTab from './routes/UserTab';

const TAB_MAPS = {
  [MOVIES_URL]: HomeTab,
  [LEGACY_URL]: LegacyTab,
  [BY_USER_URL]: UserTab,
  [BY_CATEGORY_URL]: CategoryTab,
};

function routeFills(
  url: string,
  Tab: () => React.ReactElement,
): React.ReactElement[] {
  return [
    <Route key={url + '_year'} element={<Tab />} path={`/${url}/:year`} />,
    <Route key={url + '_no_year'} element={<Tab />} path={`/${url}`} />,
  ];
}

export default function Routing() {
  return (
    <Routes>
      <Route element={<Navigate to={`/${HOME_URL}`} />} path="/" />
      <Route element={<App />}>
        {Object.entries(TAB_MAPS).map(([url, tab]) => routeFills(url, tab))}
        <Route element={<AppErrorScreen isFullScreen />} path="*" />
      </Route>
    </Routes>
  );
}
