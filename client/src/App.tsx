import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { publicRoutes, privateRoutes } from './routes';
import DefaultLayout from './layouts/DefaultLayout';
import React, { Fragment } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import mới
import { ThemeProvider } from './context/ThemeContext';

// Component bảo vệ Routes dùng Context
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Tách Routes ra component con để dùng được useAuth
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

      {/* PRIVATE ROUTES */}
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
    </Routes>
  );
};

const App = () => {
  return (
    // Bọc AuthProvider ở ngoài cùng
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
