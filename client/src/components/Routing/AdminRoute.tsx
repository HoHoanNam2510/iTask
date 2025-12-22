/* src/components/Routing/AdminRoute.tsx */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';

const AdminRoute = () => {
  const { user, isLoading } = useAuth();

  // 1. Nếu đang tải thì hiện Loading
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

  // 2. LOGIC PHÂN QUYỀN MỚI

  // TRƯỜNG HỢP A: Chưa đăng nhập (User là null)
  // -> Đá thẳng về trang Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // TRƯỜNG HỢP B: Đã đăng nhập nhưng KHÔNG PHẢI Admin
  // -> Đá về trang chủ của User (đường dẫn là '/')
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // TRƯỜNG HỢP C: Là Admin xịn
  // -> Cho phép đi tiếp
  return <Outlet />;
};

export default AdminRoute;
