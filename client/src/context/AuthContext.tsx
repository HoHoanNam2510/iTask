import React, { createContext, useContext, useState, useEffect } from 'react';

// [CẬP NHẬT] Định nghĩa lại kiểu dữ liệu User
interface User {
  _id: string;
  username: string; // Sửa name -> username cho khớp backend
  email: string;
  avatar?: string;
  role: 'user' | 'admin'; // [QUAN TRỌNG] Thêm role
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Khi F5 trang, kiểm tra localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Kiểm tra sơ bộ xem dữ liệu có hợp lệ không
        if (parsedUser && parsedUser._id) {
          setIsAuthenticated(true);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Lỗi parse user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  // 2. Hàm Login
  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    // Lưu toàn bộ object user (bao gồm role) vào localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');

    setIsAuthenticated(true);
    setUser(userData);
  };

  // 3. Hàm Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');

    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
