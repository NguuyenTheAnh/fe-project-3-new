import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import Logo from "@/components/app/Logo";

export default function Header() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultQuery = searchParams.get("q") ?? "";
  const { isAuthenticated, authUser, logout, hasRole } = useAuth();
  const { itemCount } = useCart();

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("q")?.toString().trim() ?? "";
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", "0");
    navigate(`/search?${params.toString()}`);
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
    authUser?.fullName || authUser?.email || authUser?.sub || "";
  const displayLetter = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : "U";
  const isStudent = isAuthenticated && hasRole("ROLE_STUDENT");
  const isAdmin = isAuthenticated && hasRole("ROLE_ADMIN");

  const handleCartClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { returnTo: "/cart" } });
      return;
    }
    navigate("/cart");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="relative w-full px-4 sm:px-6 lg:px-10 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            {isStudent ? (
              <Link
                to="/me/learning"
                className="hidden md:inline-flex items-center text-sm font-medium text-slate-700 hover:text-[#E11D48] transition"
              >
                Khóa học của tôi
              </Link>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            {!isAdmin ? (
              <button
                type="button"
                onClick={handleCartClick}
                className="relative h-9 w-9 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
                aria-label="Giỏ hàng"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 7H6"
                  />
                  <circle cx="10" cy="20" r="1.5" />
                  <circle cx="17" cy="20" r="1.5" />
                </svg>
                {itemCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E11D48] px-1 text-[11px] font-semibold text-white">
                    {itemCount}
                  </span>
                ) : null}
              </button>
            ) : null}
            {!isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  className="h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 leading-none hover:bg-slate-50 transition"
                >
                  Đăng ký
                </Link>
                <Link
                  to="/login"
                  className="h-9 inline-flex items-center justify-center rounded-lg bg-[#E11D48] px-4 text-sm font-medium text-white leading-none hover:bg-[#BE123C] transition shadow-sm"
                >
                  Đăng nhập
                </Link>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title={displayName || "Tài khoản"}
                    className="h-9 w-9 rounded-full bg-[#E11D48] text-white flex items-center justify-center text-sm font-semibold shadow-sm hover:bg-[#BE123C] transition"
                  >
                    {displayLetter}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigate(primaryDestination)}
                  >
                    Hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 hidden w-[560px] max-w-[50vw] -translate-x-1/2 -translate-y-1/2 sm:block">
          <form onSubmit={handleSubmit}>
            <Input
              name="q"
              defaultValue={defaultQuery}
              placeholder="Tìm kiếm khóa học"
              className="h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/25 focus:border-[#F43F5E]"
            />
          </form>
        </div>
      </div>
    </header>
  );
}
