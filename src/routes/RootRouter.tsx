import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import { PATH } from './paths';

const LandingPage = lazy(() => import('@/pages/Landing/LandingPage'));
const App = lazy(() => import('@/App'));

function LandingFallback() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#f4f1e9]" aria-label="랜딩페이지를 불러오는 중" />
  );
}

export default function RootRouter() {
  return (
    <Routes>
      <Route
        path={PATH.LANDING}
        element={
          <Suspense fallback={<LandingFallback />}>
            <LandingPage />
          </Suspense>
        }
      />
      <Route path="/landing" element={<Navigate to={PATH.LANDING} replace />} />
      <Route
        path="*"
        element={
          <Suspense fallback={<div className="min-h-[100dvh] w-full bg-grey-100" />}>
            <App />
          </Suspense>
        }
      />
    </Routes>
  );
}
