import { useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import Header from "@/components/app/Header";
import DashboardLayout from "@/layouts/DashboardLayout";

function AdminSidebar() {
  const location = useLocation();
  const [usersOpen, setUsersOpen] = useState(
    location.pathname.startsWith("/admin/users")
  );

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
        <div>
          <button
            type="button"
            onClick={() => setUsersOpen(!usersOpen)}
            className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition ${
              location.pathname.startsWith("/admin/users")
                ? "bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6] font-medium"
                : ""
            }`}
          >
            <span>Người dùng</span>
            <svg
              className={`w-4 h-4 transition-transform ${
                usersOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {usersOpen ? (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
              <Link
                to="/admin/users?role=STUDENT"
                className={`block rounded-lg px-3 py-1.5 text-sm transition ${
                  location.pathname === "/admin/users" && location.search.includes("role=STUDENT")
                    ? "text-[#BE123C] font-medium"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Học viên
              </Link>
              <Link
                to="/admin/users?role=INSTRUCTOR"
                className={`block rounded-lg px-3 py-1.5 text-sm transition ${
                  location.pathname === "/admin/users" && location.search.includes("role=INSTRUCTOR")
                    ? "text-[#BE123C] font-medium"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Giáo viên
              </Link>
            </div>
          ) : null}
        </div>
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
        <NavLink to="/admin/reviews" className={linkClasses}>
          Đánh giá
        </NavLink>
        <NavLink to="/admin/reports" className={linkClasses}>
          Phản hồi
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
