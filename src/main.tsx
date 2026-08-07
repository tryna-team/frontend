import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { queryClient } from './apis/queryClient';
import './index.css';
import RootRouter from './routes/RootRouter.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RootRouter />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
