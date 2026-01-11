import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PaginationBar from "@/components/catalog/PaginationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCategories, fetchTags } from "@/api/catalog.api";
import { useAuth } from "@/contexts/AuthContext";
import { getCourseDetail } from "@/services/course.service";
import {
  getFileAccessUrl,
  uploadFileDirect,
  uploadFileWithPresign,
} from "@/services/file.service";
import {
  createInstructorCourse,
  listInstructorCourses,
  updateCourseStatus,
  updateCourseTags,
  updateInstructorCourse,
} from "@/services/instructor.course.service";

const PAGE_SIZE = 10;

const LEVEL_LABELS = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};

const LANGUAGE_LABELS = {
  VI: "Tiếng Việt",
  EN: "Tiếng Anh",
};

const STATUS_LABELS = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Đã lưu trữ",
};

const STATUS_STYLES = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-700",
  PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ARCHIVED: "border-amber-200 bg-amber-50 text-amber-700",
};

const LEVEL_OPTIONS = [
  { value: "", label: "Chưa chọn" },
  { value: "BEGINNER", label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED", label: "Nâng cao" },
];

const LANGUAGE_OPTIONS = [
  { value: "", label: "Chưa chọn" },
  { value: "VI", label: "Tiếng Việt" },
  { value: "EN", label: "Tiếng Anh" },
];

const EMPTY_FORM = {
  title: "",
  slug: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  level: "",
  language: "",
  priceCents: "",
  thumbnailFileId: "",
  introVideoFileId: "",
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

const normalizeList = (payload) => {
  if (!payload) {
    return { items: [], pageNumber: 0, totalPages: 1, totalElements: 0 };
  }

  const items = Array.isArray(payload)
    ? payload
    : payload.content || payload.items || payload.data || [];
  const pageNumber =
    payload.pageable?.pageNumber ??
    payload.pageNumber ??
    payload.number ??
    payload.page ??
    0;
  const totalPages =
    payload.totalPages ??
    payload.pageable?.totalPages ??
    payload.page?.totalPages ??
    1;
  const totalElements =
    payload.totalElements ?? payload.page?.totalElements ?? items.length;

  return { items, pageNumber, totalPages, totalElements };
};

const formatPrice = (priceCents, isFree) => {
  if (isFree || priceCents === 0) return "Miễn phí";
  if (typeof priceCents === "number") {
    return (priceCents / 100).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  }
  return "-";
};

export default function AdminCourses() {
  const { authUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    pageNumber: 0,
    totalPages: 1,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [initialTagIds, setInitialTagIds] = useState([]);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailMessage, setThumbnailMessage] = useState("");
  const [selectedIntroFile, setSelectedIntroFile] = useState(null);
  const [introUploading, setIntroUploading] = useState(false);
  const [introMessage, setIntroMessage] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailCourse, setDetailCourse] = useState(null);
  const [detailThumbnailUrl, setDetailThumbnailUrl] = useState("");
  const [detailIntroUrl, setDetailIntroUrl] = useState("");

  const loadCourses = useCallback(async (pageNumber = 0) => {
    setLoading(true);
    setError("");
    try {
      const data = await listInstructorCourses({
        page: pageNumber,
        size: PAGE_SIZE,
      });
      const normalized = normalizeList(data);
      setCourses(Array.isArray(normalized.items) ? normalized.items : []);
      setPageInfo({
        pageNumber: normalized.pageNumber ?? 0,
        totalPages: normalized.totalPages ?? 1,
        totalElements: normalized.totalElements ?? 0,
      });
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách khóa học.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const [cats, tagList] = await Promise.all([
        fetchCategories(),
        fetchTags(),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setTags(Array.isArray(tagList) ? tagList : []);
    } catch (err) {
      // Best effort; ignore.
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses(0);
    loadOptions();
  }, [loadCourses, loadOptions]);

  const filteredCourses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesTerm =
        !term ||
        course.title?.toLowerCase().includes(term) ||
        course.slug?.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" || course.status === statusFilter;
      return matchesTerm && matchesStatus;
    });
  }, [courses, searchTerm, statusFilter]);

  const handlePageChange = (page) => {
    loadCourses(page);
  };

  const handleOpenCreate = () => {
    setModalOpen(true);
    setIsEdit(false);
    setSlugTouched(false);
    setActiveCourse(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setSelectedTagIds([]);
    setInitialTagIds([]);
    setSelectedThumbnailFile(null);
    setThumbnailUploading(false);
    setThumbnailMessage("");
    setSelectedIntroFile(null);
    setIntroUploading(false);
    setIntroMessage("");
  };

  const handleOpenEdit = async (course) => {
    setModalOpen(true);
    setIsEdit(true);
    setSlugTouched(true);
    setActiveCourse(course);
    setFormError("");
    setForm({
      title: course?.title || "",
      slug: course?.slug || "",
      categoryId: course?.category?.id ? String(course.category.id) : "",
      shortDescription: course?.shortDescription || "",
      description: course?.description || "",
      level: course?.level || "",
      language: course?.language || "",
      priceCents:
        typeof course?.priceCents === "number" ? String(course.priceCents) : "",
      thumbnailFileId: course?.thumbnail?.id ? String(course.thumbnail.id) : "",
      introVideoFileId: course?.introVideo?.id
        ? String(course.introVideo.id)
        : "",
    });

    const presetTags = (course?.tags || []).map((tag) => tag.id).filter(Boolean);
    setSelectedTagIds(presetTags);
    setInitialTagIds(presetTags);
    setSelectedThumbnailFile(null);
    setThumbnailUploading(false);
    setThumbnailMessage("");
    setSelectedIntroFile(null);
    setIntroUploading(false);
    setIntroMessage("");

    setEditLoading(true);
    try {
      const detail = await getCourseDetail(course.id);
      setForm({
        title: detail?.title || "",
        slug: detail?.slug || course?.slug || "",
        categoryId: detail?.category?.id
          ? String(detail.category.id)
          : form.categoryId,
        shortDescription: detail?.shortDescription || "",
        description: detail?.description || "",
        level: detail?.level || "",
        language: detail?.language || "",
        priceCents:
          typeof detail?.priceCents === "number"
            ? String(detail.priceCents)
            : "",
        thumbnailFileId: detail?.thumbnail?.id
          ? String(detail.thumbnail.id)
          : "",
        introVideoFileId: detail?.introVideo?.id
          ? String(detail.introVideo.id)
          : "",
      });
      const tagIds = (detail?.tags || []).map((tag) => tag.id).filter(Boolean);
      setSelectedTagIds(tagIds);
      setInitialTagIds(tagIds);
    } catch (err) {
      setFormError(err?.message || "Không thể tải dữ liệu khóa học.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEdit = () => {
    setModalOpen(false);
    setActiveCourse(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setSelectedTagIds([]);
    setInitialTagIds([]);
    setSelectedThumbnailFile(null);
    setThumbnailUploading(false);
    setThumbnailMessage("");
    setSelectedIntroFile(null);
    setIntroUploading(false);
    setIntroMessage("");
  };

  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugTouched && !isEdit) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleThumbnailFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedThumbnailFile(file);
    if (file) {
      setThumbnailMessage("");
    }
  };

  const handleUploadThumbnail = async () => {
    if (!selectedThumbnailFile) {
      setThumbnailMessage("Vui lòng chọn ảnh bìa.");
      return;
    }
    setThumbnailUploading(true);
    setThumbnailMessage("");
    try {
      const uploaded = await uploadFileDirect({
        file: selectedThumbnailFile,
        isPublic: true,
        purpose: "THUMBNAIL",
        courseId: activeCourse?.id || null,
      });
      const fileId = uploaded?.id || uploaded?.fileId;
      if (!fileId) {
        throw new Error("Không nhận được File ID.");
      }
      setForm((prev) => ({
        ...prev,
        thumbnailFileId: String(fileId),
      }));
      setThumbnailMessage("Tải ảnh bìa thành công.");
      setSelectedThumbnailFile(null);
    } catch (err) {
      setThumbnailMessage(err?.message || "Không thể tải ảnh bìa.");
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleIntroFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedIntroFile(file);
    if (file) {
      setIntroMessage("");
    }
  };

  const handleUploadIntro = async () => {
    if (!selectedIntroFile) {
      setIntroMessage("Vui lòng chọn video giới thiệu.");
      return;
    }
    setIntroUploading(true);
    setIntroMessage("");
    try {
      const uploaded = await uploadFileWithPresign({
        file: selectedIntroFile,
        isPublic: true,
        purpose: "INTRO_VIDEO",
        courseId: activeCourse?.id || null,
      });
      const fileId = uploaded?.id || uploaded?.fileId;
      if (!fileId) {
        throw new Error("Không nhận được File ID.");
      }
      setForm((prev) => ({
        ...prev,
        introVideoFileId: String(fileId),
      }));
      setIntroMessage("Tải video giới thiệu thành công.");
      setSelectedIntroFile(null);
    } catch (err) {
      setIntroMessage(err?.message || "Không thể tải video giới thiệu.");
    } finally {
      setIntroUploading(false);
    }
  };

  const handleOpenDetail = async (course) => {
    if (!course?.id) return;
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailCourse(null);
    setDetailThumbnailUrl("");
    setDetailIntroUrl("");
    try {
      const detail = await getCourseDetail(course.id);
      setDetailCourse(detail);
      const thumbnailFile = detail?.thumbnail;
      const introFile = detail?.introVideo;
      const [thumbUrl, introUrl] = await Promise.all([
        thumbnailFile?.accessUrl
          ? Promise.resolve(thumbnailFile.accessUrl)
          : thumbnailFile?.id
          ? getFileAccessUrl({
              fileId: thumbnailFile.id,
              isPublic: thumbnailFile.isPublic,
            })
          : Promise.resolve(""),
        introFile?.accessUrl
          ? Promise.resolve(introFile.accessUrl)
          : introFile?.id
          ? getFileAccessUrl({
              fileId: introFile.id,
              isPublic: introFile.isPublic,
            })
          : Promise.resolve(""),
      ]);
      setDetailThumbnailUrl(thumbUrl || "");
      setDetailIntroUrl(introUrl || "");
    } catch (err) {
      setDetailError(err?.message || "Không thể tải chi tiết khóa học.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setDetailCourse(null);
    setDetailError("");
    setDetailThumbnailUrl("");
    setDetailIntroUrl("");
  };

  const toggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setNotice(null);

    if (!form.title.trim()) {
      setFormError("Vui lòng nhập tiêu đề khóa học.");
      return;
    }

    if (!isEdit) {
      if (!form.slug.trim()) {
        setFormError("Vui lòng nhập slug.");
        return;
      }
      if (!form.categoryId) {
        setFormError("Vui lòng chọn danh mục.");
        return;
      }
    }

    const creatorId = authUser?.id || authUser?.userId || authUser?.sub;
    if (!isEdit && !creatorId) {
      setFormError("Không thể xác định giảng viên.");
      return;
    }
    const rawPrice = Number(form.priceCents);
    const priceValue = Number.isFinite(rawPrice) ? rawPrice : 0;
    const instructorsPayload = creatorId
      ? [
          {
            userId: Number(creatorId),
            instructorRole: "OWNER",
            revenueShare: 100,
          },
        ]
      : [];

    setSaving(true);
    try {
      if (isEdit && activeCourse?.id) {
        await updateInstructorCourse(activeCourse.id, {
          title: form.title.trim(),
          shortDescription: form.shortDescription.trim(),
          description: form.description.trim(),
          level: form.level || null,
          language: form.language || null,
          priceCents: priceValue,
          thumbnailFileId: form.thumbnailFileId
            ? Number(form.thumbnailFileId)
            : null,
          introVideoFileId: form.introVideoFileId
            ? Number(form.introVideoFileId)
            : null,
        });

        const changedTags =
          selectedTagIds.length !== initialTagIds.length ||
          selectedTagIds.some((id) => !initialTagIds.includes(id));
        if (changedTags) {
          await updateCourseTags(activeCourse.id, selectedTagIds);
        }

        setNotice({ type: "success", message: "Cập nhật khóa học thành công." });
      } else {
        await createInstructorCourse({
          title: form.title.trim(),
          slug: form.slug.trim(),
          categoryId: Number(form.categoryId),
          shortDescription: form.shortDescription.trim(),
          description: form.description.trim(),
          level: form.level || null,
          language: form.language || null,
          priceCents: priceValue,
          thumbnailFileId: form.thumbnailFileId
            ? Number(form.thumbnailFileId)
            : null,
          introVideoFileId: form.introVideoFileId
            ? Number(form.introVideoFileId)
            : null,
          tagIds: selectedTagIds,
          instructors: instructorsPayload,
        });
        setNotice({ type: "success", message: "Tạo khóa học thành công." });
      }

      handleCloseEdit();
      await loadCourses(pageInfo.pageNumber || 0);
    } catch (err) {
      setFormError(err?.message || "Không thể lưu khóa học.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (course) => {
    if (!course?.id) return;
    const current = course.status || "DRAFT";
    const nextStatus = current === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setStatusLoadingId(course.id);
    setNotice(null);
    try {
      await updateCourseStatus(course.id, nextStatus);
      setNotice({ type: "success", message: "Cập nhật trạng thái thành công." });
      await loadCourses(pageInfo.pageNumber || 0);
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.message || "Không thể cập nhật trạng thái.",
      });
    } finally {
      setStatusLoadingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Quản trị khóa học
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi, chỉnh sửa nội dung và trạng thái khóa học.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>+ Tạo khóa học</Button>
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

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm theo tên hoặc slug"
          className="h-10 max-w-sm rounded-lg px-3"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
        >
          <option value="all">Trạng thái: Tất cả</option>
          <option value="DRAFT">Trạng thái: Bản nháp</option>
          <option value="PUBLISHED">Trạng thái: Đã xuất bản</option>
        </select>
        <span className="text-sm text-slate-500">
          {filteredCourses.length} khóa học
        </span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="sticky left-0 z-20 w-20 bg-slate-50 px-4 py-3 text-left font-semibold whitespace-nowrap">ID</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Tên khóa học</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Trạng thái</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Trình độ</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Ngôn ngữ</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Giá</th>
              <th className="sticky right-0 z-20 bg-slate-50 px-4 py-3 text-right font-semibold whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-slate-500">
                  Đang tải...
                </td>
              </tr>
            ) : filteredCourses.length ? (
              filteredCourses.map((course) => {
                const statusLabel = STATUS_LABELS[course.status] || course.status || "Không rõ";
                const statusClass = STATUS_STYLES[course.status] || "border-slate-200 bg-slate-50 text-slate-700";
                const levelLabel = course.level ? LEVEL_LABELS[course.level] || course.level : "-";
                const languageLabel = course.language
                  ? LANGUAGE_LABELS[course.language] || course.language
                  : "-";
                const priceLabel = formatPrice(course.priceCents, course.isFree);

                return (
                  <tr
                    key={course.id}
                    onDoubleClick={() => handleOpenDetail(course)}
                    className="group border-t hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="sticky left-0 z-10 w-20 bg-white px-4 py-3 text-slate-700 whitespace-nowrap group-hover:bg-slate-50">{course.id}</td>
                    <td className="px-4 py-3 min-w-[280px]">
                      <div className="font-medium text-slate-900 truncate">
                        {course.title || "(Chưa có tiêu đề)"}
                      </div>
                      {course.shortDescription ? (
                        <div className="mt-1 text-xs text-slate-500 truncate">
                          {course.shortDescription}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{levelLabel}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{languageLabel}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{priceLabel}</td>
                    <td
                      className="sticky right-0 z-10 bg-white px-4 py-3 text-right whitespace-nowrap group-hover:bg-slate-50"
                      onDoubleClick={(event) => event.stopPropagation()}
                    >
                      <Link
                        to={`/admin/courses/${course.id}/curriculum`}
                        className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                      >
                        Giáo trình
                      </Link>
                      <span className="mx-2 text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(course)}
                        className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                      >
                        Sửa
                      </button>
                      <span className="mx-2 text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(course)}
                        disabled={statusLoadingId === course.id}
                        className="text-red-600 hover:text-red-700 hover:underline underline-offset-4 disabled:opacity-60"
                      >
                        {course.status === "PUBLISHED" ? "Gỡ xuất bản" : "Xuất bản"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-slate-500">
                  Chưa có khóa học nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && filteredCourses.length ? (
        <div className="mt-6">
          <PaginationBar
            page={pageInfo.pageNumber}
            totalPages={pageInfo.totalPages}
            onChange={handlePageChange}
          />
        </div>
      ) : null}

      {modalOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={handleCloseEdit}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Sửa khóa học" : "Tạo khóa học"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Nhập thông tin cơ bản để khởi tạo khóa học.
            </p>

            {editLoading ? (
              <div className="mt-4 text-sm text-slate-500">Đang tải dữ liệu...</div>
            ) : (
              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Tiêu đề khóa học
                    </label>
                    <Input
                      value={form.title}
                      onChange={(event) => handleChange("title", event.target.value)}
                      className="mt-1 rounded-lg px-3"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Slug</label>
                    <Input
                      value={form.slug}
                      onChange={(event) => {
                        setSlugTouched(true);
                        handleChange("slug", event.target.value);
                      }}
                      disabled={isEdit}
                      className="mt-1 rounded-lg px-3"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Danh mục
                    </label>
                    <select
                      value={form.categoryId}
                      onChange={(event) => handleChange("categoryId", event.target.value)}
                      disabled={isEdit}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 disabled:bg-slate-100"
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat.id || cat.code} value={String(cat.id || cat.code)}>
                          {cat.name || cat.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Trình độ
                    </label>
                    <select
                      value={form.level}
                      onChange={(event) => handleChange("level", event.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                    >
                      {LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Ngôn ngữ
                    </label>
                    <select
                      value={form.language}
                      onChange={(event) => handleChange("language", event.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                    >
                      {LANGUAGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Thẻ</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {tags.length ? (
                        tags.map((tag) => {
                          const active = selectedTagIds.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                                active
                                  ? "border-[#FFE4E6] bg-[#FFF1F2] text-[#BE123C]"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {tag.name}
                            </button>
                          );
                        })
                      ) : (
                        <span className="text-sm text-slate-500">
                          {optionsLoading ? "Đang tải thẻ..." : "Chưa có thẻ."}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Giá (VND)</label>
                  <Input
                    type="number"
                    value={form.priceCents}
                    onChange={(event) => handleChange("priceCents", event.target.value)}
                    className="mt-1 rounded-lg px-3"
                    placeholder="0 = Miễn phí"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Nhập 0 nếu khóa học miễn phí.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        Ảnh bìa khóa học
                      </span>
                      {form.thumbnailFileId ? (
                        <span className="text-xs text-slate-500">
                          File ID:{" "}
                          <span className="font-semibold text-slate-700">
                            {form.thumbnailFileId}
                          </span>
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailFileChange}
                        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUploadThumbnail}
                        disabled={thumbnailUploading || !selectedThumbnailFile}
                      >
                        {thumbnailUploading ? "Đang tải..." : "Tải lên"}
                      </Button>
                    </div>
                    {thumbnailMessage ? (
                      <div className="mt-2 text-xs text-slate-600">
                        {thumbnailMessage}
                      </div>
                    ) : null}
                    <div className="mt-3">
                      <label className="text-xs font-medium text-slate-700">
                        File ID ảnh bìa
                      </label>
                      <Input
                        type="number"
                        value={form.thumbnailFileId}
                        onChange={(event) =>
                          handleChange("thumbnailFileId", event.target.value)
                        }
                        className="mt-1 rounded-lg px-3"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        Video giới thiệu
                      </span>
                      {form.introVideoFileId ? (
                        <span className="text-xs text-slate-500">
                          File ID:{" "}
                          <span className="font-semibold text-slate-700">
                            {form.introVideoFileId}
                          </span>
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleIntroFileChange}
                        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUploadIntro}
                        disabled={introUploading || !selectedIntroFile}
                      >
                        {introUploading ? "Đang tải..." : "Tải lên"}
                      </Button>
                    </div>
                    {introMessage ? (
                      <div className="mt-2 text-xs text-slate-600">
                        {introMessage}
                      </div>
                    ) : null}
                    <div className="mt-3">
                      <label className="text-xs font-medium text-slate-700">
                        File ID video giới thiệu
                      </label>
                      <Input
                        type="number"
                        value={form.introVideoFileId}
                        onChange={(event) =>
                          handleChange("introVideoFileId", event.target.value)
                        }
                        className="mt-1 rounded-lg px-3"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Mô tả ngắn
                  </label>
                  <Input
                    value={form.shortDescription}
                    onChange={(event) => handleChange("shortDescription", event.target.value)}
                    className="mt-1 rounded-lg px-3"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) => handleChange("description", event.target.value)}
                    rows="4"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  />
                </div>

                {formError ? (
                  <p className="text-sm text-red-600">{formError}</p>
                ) : null}

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center justify-center"
                  >
                    Hủy
                  </button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </>
      ) : null}

      {detailModalOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={handleCloseDetail}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900">
              Chi tiết khóa học
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Xem nhanh thông tin và media của khóa học.
            </p>

            {detailLoading ? (
              <div className="mt-6 text-sm text-slate-500">Đang tải...</div>
            ) : detailError ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {detailError}
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      Ảnh bìa
                    </div>
                    <div className="mt-2 h-36 overflow-hidden rounded-lg bg-slate-100 md:h-40">
                      {detailThumbnailUrl ? (
                        <img
                          src={detailThumbnailUrl}
                          alt={detailCourse?.title || "Ảnh bìa khóa học"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                          Chưa có ảnh bìa
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      Video giới thiệu
                    </div>
                    <div className="mt-2 h-36 overflow-hidden rounded-lg bg-slate-100 md:h-40">
                      {detailIntroUrl ? (
                        <video
                          controls
                          className="h-full w-full rounded-lg bg-black object-cover"
                        >
                          <source src={detailIntroUrl} type="video/mp4" />
                        </video>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                          Chưa có video giới thiệu
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-xs text-slate-500">Tiêu đề</div>
                      <div className="text-sm font-medium text-slate-900">
                        {detailCourse?.title || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Slug</div>
                      <div className="text-sm text-slate-900">
                        {detailCourse?.slug || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Danh mục</div>
                      <div className="text-sm text-slate-900">
                        {detailCourse?.category?.name || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Trạng thái</div>
                      <div className="text-sm text-slate-900">
                        {STATUS_LABELS[detailCourse?.status] ||
                          detailCourse?.status ||
                          "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Trình độ</div>
                      <div className="text-sm text-slate-900">
                        {detailCourse?.level
                          ? LEVEL_LABELS[detailCourse.level] ||
                            detailCourse.level
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Ngôn ngữ</div>
                      <div className="text-sm text-slate-900">
                        {detailCourse?.language
                          ? LANGUAGE_LABELS[detailCourse.language] ||
                            detailCourse.language
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Giá</div>
                      <div className="text-sm text-slate-900">
                        {formatPrice(
                          detailCourse?.priceCents,
                          detailCourse?.isFree
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Giảng viên</div>
                      <div className="text-sm text-slate-900">
                        {detailCourse?.instructors?.length
                          ? detailCourse.instructors
                              .map((ins) => ins.fullName || ins.email)
                              .filter(Boolean)
                              .join(", ")
                          : "-"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Thẻ</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {detailCourse?.tags?.length ? (
                        detailCourse.tags.map((tag) => (
                          <span
                            key={tag.id || tag.slug}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Mô tả ngắn</div>
                    <div className="mt-1 text-sm text-slate-700">
                      {detailCourse?.shortDescription || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Mô tả chi tiết</div>
                    <div className="mt-1 text-sm text-slate-700 whitespace-pre-line">
                      {detailCourse?.description || "-"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center justify-center"
              >
                Đóng
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
