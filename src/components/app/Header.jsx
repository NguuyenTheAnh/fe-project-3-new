import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/app/Logo";

export default function Header() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultQuery = searchParams.get("q") ?? "";
  const { isAuthenticated, authUser, logout, hasRole } = useAuth();

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("q")?.toString().trim() ?? "";
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", "0");
    const next = `/search?${params.toString()}`;
    navigate(next);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const primaryDestination = hasRole("ROLE_ADMIN")
    ? "/admin"
    : hasRole("ROLE_INSTRUCTOR")
    ? "/instructor"
    : "/me/learning";

  const displayName =
    authUser?.fullName || authUser?.email || authUser?.sub || "bạn";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4 text-slate-900">
        <Logo />
        <form onSubmit={handleSubmit} className="flex-1">
          <Input
            name="q"
            defaultValue={defaultQuery}
            placeholder="Tìm kiếm khóa học"
          />
        </form>
        {!isAuthenticated ? (
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48]/20 focus-visible:ring-offset-2"
            >
              Đăng ký
            </Link>
            <Link
              to="/login"
              className="bg-[#E11D48] text-white hover:bg-[#BE123C] shadow-sm hover:shadow-md rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48]/30 focus-visible:ring-offset-2"
            >
              Đăng nhập
            </Link>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm">
                Xin chào, {displayName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(primaryDestination)}>
                Hồ sơ
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
