import {Navigate, Route, Routes} from 'react-router-dom';
import { BY_CATEGORY_URL, BY_USER_URL, DEFAULT_YEAR,LEGACY_URL} from '../config/GlobalConstants';
import App from './App';
import CategoryTab from './routes/CategoryTab';
import HomeTab from './routes/HomeTab';
import UserTab from './routes/UserTab';

export default function Routing() {
  return (
    <Routes>
      <Route element={<Navigate to={`/${LEGACY_URL}/${DEFAULT_YEAR}`} />} path="/" />
      <Route element={<App />} >
        <Route element={<HomeTab />} path={`/${LEGACY_URL}/:year`} />
        <Route element={<Navigate to={`/${LEGACY_URL}/${DEFAULT_YEAR}`} />} path={`/${LEGACY_URL}`} />
        <Route element={<UserTab />} path={`/${BY_USER_URL}/:year`} />
        <Route element={<Navigate to={`/${BY_USER_URL}/${DEFAULT_YEAR}`} />} path={`/${BY_USER_URL}`} />
        <Route element={<CategoryTab />} path={`/${BY_CATEGORY_URL}/:year`} />
        <Route element={<Navigate to={`/${BY_CATEGORY_URL}/${DEFAULT_YEAR}`} />} path={`/${BY_CATEGORY_URL}`} />
      </Route>
    </Routes>
  );
}



