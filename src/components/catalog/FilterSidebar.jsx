import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const LEVEL_OPTIONS = [
  { value: "BEGINNER", label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED", label: "Nâng cao" },
];

const LANGUAGE_OPTIONS = [
  { value: "VI", label: "Tiếng Việt" },
  { value: "EN", label: "Tiếng Anh" },
];

export default function FilterSidebar({
  categories = [],
  tags = [],
  values,
  onChange,
  onClear,
}) {
  const handleChange = (key, value) => {
    onChange?.(key, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bộ lọc</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">Danh mục</p>
          <Select
            value={values.categoryId || ""}
            onValueChange={(val) => handleChange("categoryId", val || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              {categories.map((cat) => (
                <SelectItem
                  key={cat.id || cat.code}
                  value={String(cat.id || cat.code)}
                >
                  {cat.name || cat.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">Thẻ</p>
          <Select
            value={values.tagId || ""}
            onValueChange={(val) => handleChange("tagId", val || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn thẻ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              {tags.map((tag) => (
                <SelectItem
                  key={tag.id || tag.code}
                  value={String(tag.id || tag.code)}
                >
                  {tag.name || tag.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">Trình độ</p>
          <Select
            value={values.level || ""}
            onValueChange={(val) => handleChange("level", val || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              {LEVEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">Ngôn ngữ</p>
          <Select
            value={values.language || ""}
            onValueChange={(val) => handleChange("language", val || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              {LANGUAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={onClear} className="w-full">
          Xóa bộ lọc
        </Button>
      </CardContent>
    </Card>
  );
}
