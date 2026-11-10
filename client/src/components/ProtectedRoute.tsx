import { Navigate, Outlet } from "react-router-dom";
import { useStore } from "../context/StoreContext";

const ProtectedRoute = ({ requireAdmin = false }: { requireAdmin?: boolean }) => {
  const { currentUser, isAuthLoading } = useStore();

  if (isAuthLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-app-text-light">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !currentUser.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
