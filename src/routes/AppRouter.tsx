import { lazy, Suspense } from 'react';
import {
  Navigate,
  Route,
  Routes,
} from 'react-router';

import DailyPage from '@/pages/Daily/DailyPage';
import EventViewPage from '@/pages/EventView/EventViewPage';
import HomePage from '@/pages/Home/HomePage';
import SplashPage from '@/pages/Splash/SplashPage';
import YearCalendarPage from '@/pages/YearCalendar/YearCalendarPage';

import { PATH } from './paths';

const LegalPage = lazy(() => import('@/pages/Legal/LegalPage'));

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
        path={PATH.YEAR_CALENDAR}
        element={<YearCalendarPage />}
      />
      <Route
        path={PATH.TERMS}
        element={
          <Suspense fallback={<div className="min-h-[100dvh] bg-background-white" />}>
            <LegalPage document="terms" />
          </Suspense>
        }
      />
      <Route
        path={PATH.PRIVACY}
        element={
          <Suspense fallback={<div className="min-h-[100dvh] bg-background-white" />}>
            <LegalPage document="privacy" />
          </Suspense>
        }
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
