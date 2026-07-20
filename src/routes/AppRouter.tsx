import {
  Navigate,
  Route,
  Routes,
} from 'react-router';

import DailyPage from '@/pages/Daily/DailyPage';
import EventViewPage from '@/pages/EventView/EventViewPage';
import HomePage from '@/pages/Home/HomePage';
import SplashPage from '@/pages/Splash/SplashPage';

import { PATH } from './paths';

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path={PATH.SPLASH}
        element={<SplashPage />}
      />
      <Route
        path={PATH.HOME}
        element={<HomePage />}
      />
      <Route
        path={PATH.DAILY}
        element={<DailyPage />}
      />
      <Route
        path={PATH.EVENT_VIEW}
        element={<EventViewPage />}
      />
      <Route
        path="*"
        element={
          <Navigate
            to={PATH.HOME}
            replace
          />
        }
      />
    </Routes>
  );
}
