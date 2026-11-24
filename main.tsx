import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import OkiDemo from './OkiDemo';
import './global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OkiDemo />
  </StrictMode>,
);
