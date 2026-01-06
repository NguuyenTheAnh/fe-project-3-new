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
    navigate("/login");
  };

  const primaryDestination = hasRole("ROLE_ADMIN")
    ? { to: "/admin", label: "Bảng điều khiển" }
    : hasRole("ROLE_INSTRUCTOR")
    ? { to: "/instructor", label: "Bảng điều khiển" }
    : { to: "/me/learning", label: "Trang của tôi" };

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link to="/" className="font-semibold text-lg">
          UdemyClone
        </Link>
        <form onSubmit={handleSubmit} className="flex-1">
          <Input
            name="q"
            defaultValue={defaultQuery}
            placeholder="Tìm kiếm khóa học"
          />
        </form>
        {!isAuthenticated ? (
          <div className="flex items-center gap-3">
            <Link to="/register" className="text-sm">
              Đăng ký
            </Link>
            <Link to="/login" className="text-sm">
              Đăng nhập
            </Link>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm">
                Xin chào, {authUser?.email || authUser?.sub || "bạn"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(primaryDestination.to)}>
                {primaryDestination.label}
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
