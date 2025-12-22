/* client/src/App.tsx */
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { publicRoutes, privateRoutes, adminRoutes } from './routes'; // [QUAN TRỌNG] Import adminRoutes
import DefaultLayout from './layouts/DefaultLayout';
import React, { Fragment } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminRoute from './components/Routing/AdminRoute';

// ProtectedRoute cho User
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
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

      {/* 3. ADMIN ROUTES [SỬA ĐOẠN NÀY] */}
      {/* Thay vì hardcode div, ta map qua mảng adminRoutes */}
      <Route element={<AdminRoute />}>
        {adminRoutes.map((route, index) => {
          const Page = route.component;

          // Lấy Layout được định nghĩa trong routes/index.tsx (AdminLayout)
          // Nếu không có thì dùng Default, nhưng adminRoutes mình đã gán AdminLayout rồi
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
          <div className="app">
            <AppRoutes />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
