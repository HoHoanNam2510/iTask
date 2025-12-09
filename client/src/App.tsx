import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { publicRoutes, privateRoutes } from './routes';
import DefaultLayout from './layouts/DefaultLayout';
import React, { Fragment } from 'react';

// Hàm giả lập kiểm tra đăng nhập
const checkAuth = () => {
  // Kiểm tra xem trong localStorage có flag 'isLoggedIn' không
  return localStorage.getItem('isLoggedIn') === 'true';
};

// Component bảo vệ: Nếu chưa login thì chuyển hướng về /login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = checkAuth();
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* 1. XỬ LÝ PUBLIC ROUTES (Login, Register...) */}
          {publicRoutes.map((route, index) => {
            const Page = route.component;

            let Layout: React.FC<{ children: React.ReactNode }> = DefaultLayout;
            if (route.layout) {
              Layout = route.layout;
            } else if (route.layout === null) {
              Layout = Fragment;
            }

            return (
              <Route
                key={index}
                path={route.path}
                element={
                  <Layout>
                    <Page />
                  </Layout>
                }
              />
            );
          })}

          {/* 2. XỬ LÝ PRIVATE ROUTES (Dashboard, Calendar...) - Cần bọc ProtectedRoute */}
          {privateRoutes.map((route, index) => {
            const Page = route.component;

            let Layout: React.FC<{ children: React.ReactNode }> = DefaultLayout;
            if (route.layout) {
              Layout = route.layout;
            } else if (route.layout === null) {
              Layout = Fragment;
            }

            return (
              <Route
                key={index}
                path={route.path}
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Page />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            );
          })}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
