import { NavLink } from "react-router-dom";
import Header from "@/components/app/Header";
import DashboardLayout from "@/layouts/DashboardLayout";

function AdminSidebar() {
  const linkClasses = ({ isActive }) =>
    [
      "block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition",
      isActive
        ? "bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6] font-medium"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="space-y-2">
      <div className="px-3 text-sm font-semibold text-slate-900">Quản trị</div>
      <nav className="space-y-1">
        <NavLink to="/admin" end className={linkClasses}>
          Tổng quan
        </NavLink>
        <NavLink to="/admin/users" className={linkClasses}>
          Người dùng
        </NavLink>
        <NavLink to="/admin/courses" className={linkClasses}>
          Khóa học
        </NavLink>
        <NavLink to="/admin/categories" className={linkClasses}>
          Danh mục
        </NavLink>
        <NavLink to="/admin/tags" className={linkClasses}>
          Thẻ
        </NavLink>
        <NavLink to="/admin/questions" className={linkClasses}>
          Hỏi đáp
        </NavLink>
      </nav>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <DashboardLayout sidebar={<AdminSidebar />} />
    </div>
  );
}
