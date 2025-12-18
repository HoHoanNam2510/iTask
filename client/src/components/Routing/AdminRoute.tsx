/* src/components/Routing/AdminRoute.tsx */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';

const AdminRoute = () => {
  const { user, isLoading } = useAuth();

  // 1. Nếu đang tải thông tin user thì hiển thị Loading
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#666',
        }}
      >
        Loading...
      </div>
    );
  }

  // 2. Kiểm tra quyền hạn:
  // - Phải có user (đã đăng nhập)
  // - Role phải là 'admin'
  if (user && user.role === 'admin') {
    // Cho phép truy cập vào các Route con (ví dụ /admin/dashboard)
    return <Outlet />;
  }

  // 3. Nếu không đủ quyền -> Đá về trang Dashboard của User thường
  // 'replace' giúp user không back lại được trang admin bằng nút Back của trình duyệt
  return <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
