/* client/src/App.tsx */
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { publicRoutes, privateRoutes } from './routes';
import DefaultLayout from './layouts/DefaultLayout';
import React, { Fragment } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Import AdminRoute đã tách ra file riêng
import AdminRoute from './components/Routing/AdminRoute';

// 1. ProtectedRoute (Cho User thường & Admin đều vào được)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// [ĐÃ XÓA] const AdminRoute... (Vì đã import ở trên)

const AppRoutes = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
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

      {/* PRIVATE ROUTES (User logged in) */}
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

      {/* [MỚI] ADMIN ROUTES */}
      {/* Route này được bảo vệ bởi component AdminRoute import từ bên ngoài */}
      <Route path="/admin" element={<AdminRoute />}>
        <Route
          index
          element={
            <div style={{ padding: 50 }}>
              <h1>Admin Dashboard</h1>
              <p>Welcome, Admin!</p>
              {/* Sau này bạn sẽ import component AdminDashboard thật vào đây */}
            </div>
          }
        />
        {/* Thêm các route admin con khác: /admin/users, /admin/analytics... */}
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
