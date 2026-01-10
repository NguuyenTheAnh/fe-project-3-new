import { NavLink, Outlet } from "react-router-dom";
import Header from "@/components/app/Header";

export default function StudentLayout() {
  const linkClasses = ({ isActive }) =>
    [
      "rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition",
      isActive
        ? "bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6] font-medium"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <nav className="mb-4 flex items-center gap-2">
          <NavLink to="/me/learning" className={linkClasses}>
            Khóa học của tôi
          </NavLink>
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
