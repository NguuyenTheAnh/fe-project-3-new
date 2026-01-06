import { useSearchParams } from "react-router-dom";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  return (
    <div>
      <h1 className="text-2xl font-semibold">Tìm kiếm</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {query
          ? `Kết quả cho "${query}"`
          : "Tìm khóa học tiếp theo của bạn."}
      </p>
    </div>
  );
}
