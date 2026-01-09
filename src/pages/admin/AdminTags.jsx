import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTag,
  deleteTag,
  listTags,
  updateTag,
} from "@/services/tag.admin.service";

const EMPTY_FORM = {
  name: "",
  slug: "",
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

export default function AdminTags() {
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [permissionError, setPermissionError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadTags = async () => {
    setLoading(true);
    setNotice(null);
    setPermissionError(false);
    try {
      const data = await listTags();
      setTags(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setPermissionError(true);
      }
      setNotice({
        type: "error",
        message: error?.message || "Không thể tải thẻ.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const filteredTags = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = tags.filter((item) => {
      if (!term) return true;
      return (
        item.name?.toLowerCase().includes(term) ||
        item.slug?.toLowerCase().includes(term)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === "newest") return (b.id || 0) - (a.id || 0);
      if (sortOrder === "oldest") return (a.id || 0) - (b.id || 0);
      if (sortOrder === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortOrder === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      return 0;
    });

    return sorted;
  }, [searchTerm, sortOrder, tags]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setActiveId(null);
    setIsEdit(false);
    setSlugTouched(false);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || "",
      slug: item.slug || "",
    });
    setFormErrors({});
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

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errors.name = "Vui lòng nhập tên (tối thiểu 2 ký tự).";
    }
    if (!form.slug.trim() || form.slug.trim().length < 2) {
      errors.slug = "Vui lòng nhập slug (tối thiểu 2 ký tự).";
    } else if (!slugPattern.test(form.slug.trim())) {
      errors.slug = "Slug không đúng định dạng.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice(null);
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (isEdit && activeId) {
        await updateTag(activeId, {
          name: form.name.trim(),
          slug: form.slug.trim(),
        });
        setNotice({ type: "success", message: "Cập nhật thành công." });
      } else {
        await createTag({
          name: form.name.trim(),
          slug: form.slug.trim(),
        });
        setNotice({ type: "success", message: "Tạo thành công." });
      }
      setModalOpen(false);
      await loadTags();
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
    const ok = window.confirm("Bạn chắc chắn muốn xóa thẻ này?");
    if (!ok) return;
    setNotice(null);
    try {
      await deleteTag(item.id);
      setNotice({ type: "success", message: "Đã xóa thẻ." });
      await loadTags();
    } catch (error) {
      setNotice({
        type: "error",
        message: error?.message || "Không thể xóa thẻ.",
      });
    }
  };

  if (permissionError) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Bạn không có quyền truy cập.</p>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition"
          >
            Về trang quản trị
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Thẻ
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý thẻ để gắn cho khóa học.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
        >
          + Tạo thẻ
        </button>
      </div>

      {notice ? (
        <div
          className={`mt-4 rounded-lg border p-3 text-sm ${
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
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
        />
        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="name-asc">Tên A→Z</option>
          <option value="name-desc">Tên Z→A</option>
        </select>
        <span className="text-sm text-slate-500">
          {filteredTags.length} thẻ
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">ID</th>
              <th className="px-4 py-3 text-left font-semibold">Tên</th>
              <th className="px-4 py-3 text-left font-semibold">Slug</th>
              <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="px-4 py-6 text-center text-slate-500">
                  Đang tải...
                </td>
              </tr>
            ) : filteredTags.length ? (
              filteredTags.map((item) => (
                <tr key={item.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{item.id}</td>
                  <td className="px-4 py-3 text-slate-700">{item.name}</td>
                  <td className="px-4 py-3 text-slate-700">{item.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                    >
                      Sửa
                    </button>
                    <span className="mx-2 text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="text-red-600 hover:text-red-700 hover:underline underline-offset-4"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-6 text-center text-slate-500">
                  Chưa có thẻ nào. Hãy tạo thẻ đầu tiên.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setModalOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Sửa thẻ" : "Tạo thẻ"}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tên thẻ
                </label>
                <input
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                />
                {formErrors.name ? (
                  <p className="mt-1 text-xs text-red-600">
                    {formErrors.name}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Slug</label>
                <input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    handleChange("slug", event.target.value);
                  }}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Slug dùng cho URL, chỉ gồm chữ thường, số và dấu gạch ngang.
                </p>
                {formErrors.slug ? (
                  <p className="mt-1 text-xs text-red-600">
                    {formErrors.slug}
                  </p>
                ) : null}
              </div>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center justify-center"
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
        </>
      ) : null}
    </div>
  );
}
