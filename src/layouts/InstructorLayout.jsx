import { NavLink } from "react-router-dom";
import Header from "@/components/app/Header";
import DashboardLayout from "@/layouts/DashboardLayout";

function InstructorSidebar() {
  const linkClasses = ({ isActive }) =>
    [
      "block rounded-lg px-3 py-2 text-sm hover:bg-muted",
      isActive ? "bg-muted font-medium" : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="space-y-2">
      <div className="px-3 text-sm font-semibold">Giảng viên</div>
      <nav className="space-y-1">
        <NavLink to="/instructor" end className={linkClasses}>
          Tổng quan
        </NavLink>
        <NavLink to="/instructor/courses" className={linkClasses}>
          Khóa học
        </NavLink>
      </nav>
    </div>
  );
}

export default function InstructorLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <DashboardLayout sidebar={<InstructorSidebar />} />
    </div>
  );
}
