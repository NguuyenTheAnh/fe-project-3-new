import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireRole({ allowedRoles = [], children }) {
  const { authUser, isAuthenticated, initializing, hasRole } = useAuth();

  if (initializing) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const permitted = allowedRoles.some((role) => hasRole(role));
  if (!permitted) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Không có quyền truy cập
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Bạn không được phép truy cập trang này.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Người dùng: {authUser?.email || authUser?.sub || "Ẩn danh"}
        </p>
      </div>
    );
  }

  return children;
}
