import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";

export default function Header() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultQuery = searchParams.get("q") ?? "";

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("q")?.toString().trim() ?? "";
    const next = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
    navigate(next);
  };

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
        <Link to="/login" className="text-sm">
          Đăng nhập
        </Link>
      </div>
    </header>
  );
}
