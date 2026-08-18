import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { queryClient } from './apis/queryClient';
import { registerDevConsole } from './utils/devConsole';
import './index.css';
import App from './App.tsx';

// 아직 화면이 없는 API를 콘솔에서 확인하기 위한 개발 전용 헬퍼 (프로덕션에서는 등록되지 않음)
registerDevConsole();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
