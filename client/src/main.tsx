/* client/src/main.tsx */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';

import App from './App.tsx';
import GlobalStyles from '~/components/GlobalStyles';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalStyles>
      {/* 👇 [MỚI] Bọc SocketProvider ở đây để toàn bộ App có thể dùng socket */}
      <App />
    </GlobalStyles>
  </StrictMode>
);
