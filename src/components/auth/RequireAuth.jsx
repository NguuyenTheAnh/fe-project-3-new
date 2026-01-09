import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireAuth({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Đang tải phiên đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo =
      location.pathname + location.search + (location.hash || "");
    return <Navigate to="/login" replace state={{ returnTo }} />;
  }

  return children;
}
