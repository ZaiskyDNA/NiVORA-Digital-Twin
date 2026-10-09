import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { UI } from './config/i18n';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { Fallback } from './ui/Fallback';

const root = document.getElementById('root');
if (!root) throw new Error('#root tidak ditemukan');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary fallback={(e) => <Fallback title={UI.fallback.appTitle} error={e} />}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
