import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/services/category.service";

const EMPTY_FORM = {
  name: "",
  slug: "",
  parentId: "",
  description: "",
  position: 0,
};

const slugify = (value) => {
  if (!value) return "";
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [permissionError, setPermissionError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [parentFilter, setParentFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeId, setActiveId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    setNotice(null);
    setPermissionError(false);
    try {
      const data = await listCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setPermissionError(true);
      }
      setNotice({
        type: "error",
        message: error?.message || "Không thể tải danh mục.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const parentMap = useMemo(() => {
    const map = new Map();
    categories.forEach((item) => map.set(item.id, item));
    return map;
  }, [categories]);

  const parentOptions = useMemo(() => {
    return categories.map((item) => ({
      id: item.id,
      name: item.name,
    }));
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = categories.filter((item) => {
      const matchesTerm =
        !term ||
        item.name?.toLowerCase().includes(term) ||
        item.slug?.toLowerCase().includes(term);

      const matchesParent =
        parentFilter === "all" ||
        (parentFilter === "root" && !item.parentId) ||
        String(item.parentId) === parentFilter;

      return matchesTerm && matchesParent;
    });

    const sorted = [...filtered].sort((a, b) => {
      const posA = Number(a.position ?? 0);
      const posB = Number(b.position ?? 0);
      return sortOrder === "asc" ? posA - posB : posB - posA;
    });

    return sorted;
  }, [categories, parentFilter, searchTerm, sortOrder]);

  const openCreate = () => {
    const maxPosition = categories.reduce(
      (acc, item) => Math.max(acc, Number(item.position ?? 0)),
      0
    );
    setForm({
      ...EMPTY_FORM,
      position: maxPosition + 1,
    });
    setActiveId(null);
    setIsEdit(false);
    setSlugTouched(false);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || "",
      slug: item.slug || "",
      parentId: item.parentId ? String(item.parentId) : "",
      description: item.description || "",
      position: item.position ?? 0,
    });
    setActiveId(item.id);
    setIsEdit(true);
    setSlugTouched(true);
    setModalOpen(true);
  };

  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugTouched && !isEdit) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice(null);

    if (!form.name.trim() || !form.slug.trim()) {
      setNotice({
        type: "error",
        message: "Vui lòng nhập tên và slug.",
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit && activeId) {
        await updateCategory(activeId, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description?.trim() || "",
        });
        setNotice({ type: "success", message: "Cập nhật thành công." });
      } else {
        await createCategory({
          name: form.name.trim(),
          slug: form.slug.trim(),
          parentId: form.parentId ? Number(form.parentId) : null,
          description: form.description?.trim() || null,
          position: Number(form.position || 0),
        });
        setNotice({ type: "success", message: "Tạo thành công." });
      }
      setModalOpen(false);
      await loadCategories();
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.message || "Có lỗi xảy ra, vui lòng thử lại.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(`Xóa danh mục "${item.name}"?`);
    if (!ok) return;
    setNotice(null);
    try {
      await deleteCategory(item.id);
      setNotice({ type: "success", message: "Đã xóa." });
      await loadCategories();
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.message || "Không thể xóa danh mục.",
      });
    }
  };

  if (permissionError) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Bạn không có quyền truy cập.</p>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="mt-3 inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition"
          >
            Về trang quản trị
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Danh mục
          </h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
        >
          + Tạo danh mục
        </button>
      </div>

      {notice ? (
        <div
          className={`mt-4 rounded-xl border p-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm theo tên hoặc slug"
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
        />
        <select
          value={parentFilter}
          onChange={(event) => setParentFilter(event.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
        >
          <option value="all">Danh mục cha: Tất cả</option>
          <option value="root">Danh mục cha: Gốc</option>
          {parentOptions.map((item) => (
            <option key={item.id} value={String(item.id)}>
              Danh mục cha: {item.name}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
        >
          <option value="asc">Vị trí: tăng dần</option>
          <option value="desc">Vị trí: giảm dần</option>
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Tên</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Danh mục cha</th>
              <th className="px-4 py-3 text-left">Vị trí</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-slate-500">
                  Đang tải danh mục...
                </td>
              </tr>
            ) : filteredCategories.length ? (
              filteredCategories.map((item) => {
                const parentName = item.parentId
                  ? parentMap.get(item.parentId)?.name || "Không rõ"
                  : "Gốc";
                return (
                  <tr key={item.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">{item.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3">{item.slug}</td>
                    <td className="px-4 py-3">{parentName}</td>
                    <td className="px-4 py-3">{item.position ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline"
                      >
                        Sửa
                      </button>
                      <span className="mx-2 text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-700 underline-offset-2 hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-slate-500">
                  Không có danh mục nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Sửa danh mục" : "Tạo danh mục"}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tên danh mục
                </label>
                <input
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Slug</label>
                <input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    handleChange("slug", event.target.value);
                  }}
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Danh mục cha
                </label>
                <select
                  value={form.parentId}
                  onChange={(event) =>
                    handleChange("parentId", event.target.value)
                  }
                  disabled={isEdit}
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 disabled:bg-slate-100"
                >
                  <option value="">Gốc</option>
                  {parentOptions
                    .filter((item) => item.id !== activeId)
                    .map((item) => (
                      <option key={item.id} value={String(item.id)}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    handleChange("description", event.target.value)
                  }
                  rows="3"
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Vị trí</label>
                <input
                  type="number"
                  value={form.position}
                  onChange={(event) =>
                    handleChange("position", event.target.value)
                  }
                  disabled={isEdit}
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 disabled:bg-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 transition inline-flex items-center justify-center disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
