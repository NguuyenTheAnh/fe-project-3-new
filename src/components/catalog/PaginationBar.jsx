import { Button } from "@/components/ui/button";

export default function PaginationBar({ page = 0, totalPages = 1, onChange }) {
  const current = Number(page) || 0;
  const total = Math.max(totalPages || 0, 1);

  const prevDisabled = current <= 0;
  const nextDisabled = current >= total - 1;

  const goTo = (target) => {
    if (target < 0 || target >= total) return;
    onChange?.(target);
  };

  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <Button
        variant="outline"
        onClick={() => goTo(current - 1)}
        disabled={prevDisabled}
      >
        Trang trước
      </Button>
      <div className="text-muted-foreground">
        Trang {current + 1} / {total}
      </div>
      <Button
        variant="outline"
        onClick={() => goTo(current + 1)}
        disabled={nextDisabled}
      >
        Trang sau
      </Button>
    </div>
  );
}
