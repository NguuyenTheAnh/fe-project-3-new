import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  className,
}) {
  const handleChange = (key, value) => {
    onChange?.(key, value);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Accordion
        type="multiple"
        defaultValue={["category", "tag", "level", "language"]}
        className="space-y-2"
      >
        <AccordionItem value="category">
          <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:no-underline">
            Danh mục
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            <div className="space-y-2">
              <Select
                value={values.categoryId || "all"}
                onValueChange={(val) =>
                  handleChange("categoryId", val === "all" ? null : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tag">
          <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:no-underline">
            Thẻ
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            <div className="space-y-2">
              <Select
                value={values.tagId || "all"}
                onValueChange={(val) =>
                  handleChange("tagId", val === "all" ? null : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thẻ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="level">
          <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:no-underline">
            Trình độ
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            <div className="space-y-2">
              <Select
                value={values.level || "all"}
                onValueChange={(val) =>
                  handleChange("level", val === "all" ? null : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="language">
          <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:no-underline">
            Ngôn ngữ
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            <div className="space-y-2">
              <Select
                value={values.language || "all"}
                onValueChange={(val) =>
                  handleChange("language", val === "all" ? null : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
