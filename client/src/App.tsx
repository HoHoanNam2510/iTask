/* client/src/App.tsx */
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { publicRoutes, privateRoutes, adminRoutes } from './routes';
import DefaultLayout from './layouts/DefaultLayout';
import React, { Fragment } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminRoute from './components/Routing/AdminRoute';
import GlobalBanner from '~/components/GlobalBanner/GlobalBanner';

// ProtectedRoute cho User (Giữ nguyên)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// 👇 [MỚI] Component điều hướng thông minh cho trang chủ
const HomeRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Đợi load user xong mới quyết định
  if (isLoading) return <div>Loading...</div>;

  // Nếu đã login và là Admin -> Buộc chuyển sang trang Admin Dashboard
  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Nếu là User hoặc Khách -> Hiển thị trang chủ bình thường
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES */}
      {publicRoutes.map((route, index) => {
        const Page = route.component;
        let Layout: React.FC<{ children: React.ReactNode }> = DefaultLayout;
        if (route.layout) Layout = route.layout;
        else if (route.layout === null) Layout = Fragment;

        // 👇 [FIX] Xử lý riêng cho route '/'
        if (route.path === '/') {
          return (
            <Route
              key={index}
              path={route.path}
              element={
                <HomeRoute>
                  <Layout>
                    <Page />
                  </Layout>
                </HomeRoute>
              }
            />
          );
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

      {/* 2. PRIVATE ROUTES (USER) */}
      {privateRoutes.map((route, index) => {
        const Page = route.component;
        let Layout: React.FC<{ children: React.ReactNode }> = DefaultLayout;
        if (route.layout) Layout = route.layout;
        else if (route.layout === null) Layout = Fragment;

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

      {/* 3. ADMIN ROUTES */}
      <Route element={<AdminRoute />}>
        {adminRoutes.map((route, index) => {
          const Page = route.component;

          // Ưu tiên lấy layout từ config route (AdminLayout)
          let Layout: React.FC<{ children: React.ReactNode }> = DefaultLayout;
          if (route.layout) Layout = route.layout;
          else if (route.layout === null) Layout = Fragment;

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
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <GlobalBanner />
          <div className="app">
            <AppRoutes />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
