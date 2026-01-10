import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCourseDetail } from "@/services/course.service";
import {
  createCourseDocument,
  createLesson,
  createLessonDocument,
  createSection,
  deleteCourseDocument,
  deleteLesson,
  deleteLessonDocument,
  deleteSection,
  getLessonDetail,
  reorderLessons,
  updateCourseDocument,
  updateLesson,
  updateLessonDocument,
  updateSection,
} from "@/services/curriculum.service";
import { getFileAccessUrl, uploadFileWithPresign } from "@/services/file.service";

const SECTION_FORM_DEFAULT = {
  title: "",
  position: 1,
};

const LESSON_FORM_DEFAULT = {
  title: "",
  lessonType: "VIDEO",
  durationSeconds: 0,
  position: 1,
  isPreview: false,
  isFreePreview: false,
  contentText: "",
  videoFileId: "",
  courseSectionId: "",
};

const DOCUMENT_FORM_DEFAULT = {
  title: "",
  position: 1,
  uploadedFileId: "",
  lessonId: "",
};

const LESSON_TYPE_OPTIONS = [
  { value: "VIDEO", label: "Video" },
  { value: "ARTICLE", label: "Bài viết" },
];

const formatDuration = (seconds) => {
  if (!seconds) return "-";
  const minutes = Math.round(Number(seconds) / 60);
  return `${minutes} phút`;
};

export default function CourseCurriculum({ backTo, title }) {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState(SECTION_FORM_DEFAULT);
  const [sectionMode, setSectionMode] = useState("create");
  const [activeSection, setActiveSection] = useState(null);
  const [savingSection, setSavingSection] = useState(false);

  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState(LESSON_FORM_DEFAULT);
  const [lessonMode, setLessonMode] = useState("create");
  const [activeLesson, setActiveLesson] = useState(null);
  const [savingLesson, setSavingLesson] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState(DOCUMENT_FORM_DEFAULT);
  const [documentMode, setDocumentMode] = useState("create");
  const [documentScope, setDocumentScope] = useState("course");
  const [activeDocument, setActiveDocument] = useState(null);
  const [activeDocumentLesson, setActiveDocumentLesson] = useState(null);
  const [savingDocument, setSavingDocument] = useState(false);
  const [selectedDocumentFile, setSelectedDocumentFile] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentUploadMessage, setDocumentUploadMessage] = useState("");
  const [openingDocumentId, setOpeningDocumentId] = useState(null);
  const [openDocumentLessonIds, setOpenDocumentLessonIds] = useState([]);
  const [lessonDetailOpen, setLessonDetailOpen] = useState(false);
  const [lessonDetailLoading, setLessonDetailLoading] = useState(false);
  const [lessonDetailError, setLessonDetailError] = useState("");
  const [lessonDetail, setLessonDetail] = useState(null);
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [reorderSection, setReorderSection] = useState(null);
  const [reorderItems, setReorderItems] = useState([]);
  const [reorderError, setReorderError] = useState("");
  const [reorderSaving, setReorderSaving] = useState(false);

  const loadCourse = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getCourseDetail(courseId);
      setCourse(data);
    } catch (err) {
      setError(err?.message || "Không thể tải nội dung khóa học.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const sections = useMemo(() => {
    const list = Array.isArray(course?.sections) ? course.sections : [];
    return [...list].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [course]);

  const courseDocuments = useMemo(() => {
    const list = Array.isArray(course?.courseDocuments)
      ? course.courseDocuments
      : [];
    return [...list].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [course]);

  const openCreateSection = () => {
    setSectionMode("create");
    setActiveSection(null);
    setSectionForm({
      title: "",
      position: sections.length + 1,
    });
    setSectionModalOpen(true);
  };

  const openEditSection = (section) => {
    setSectionMode("edit");
    setActiveSection(section);
    setSectionForm({
      title: section?.title || "",
      position: section?.position ?? 1,
    });
    setSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    setSectionModalOpen(false);
    setSectionForm(SECTION_FORM_DEFAULT);
    setActiveSection(null);
  };

  const handleSectionSubmit = async (event) => {
    event.preventDefault();
    if (!courseId) return;
    if (!sectionForm.title.trim()) {
      setNotice({ type: "error", message: "Vui lòng nhập tiêu đề chương." });
      return;
    }

    setSavingSection(true);
    setNotice(null);
    try {
      if (sectionMode === "edit" && activeSection?.id) {
        await updateSection(courseId, activeSection.id, {
          title: sectionForm.title.trim(),
          position: Number(sectionForm.position) || 1,
        });
        setNotice({ type: "success", message: "Cập nhật chương thành công." });
      } else {
        await createSection(courseId, {
          title: sectionForm.title.trim(),
          position: Number(sectionForm.position) || 1,
        });
        setNotice({ type: "success", message: "Tạo chương thành công." });
      }
      closeSectionModal();
      await loadCourse();
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.message || "Không thể lưu chương học.",
      });
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async (section) => {
    if (!courseId || !section?.id) return;
    const ok = window.confirm("Bạn chắc chắn muốn xóa chương này?");
    if (!ok) return;
    setNotice(null);
    try {
      await deleteSection(courseId, section.id);
      setNotice({ type: "success", message: "Đã xóa chương." });
      await loadCourse();
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.message || "Không thể xóa chương.",
      });
    }
  };

  const openCreateLesson = (section) => {
    setLessonMode("create");
    setActiveLesson(null);
    setLessonForm({
      ...LESSON_FORM_DEFAULT,
      courseSectionId: section?.id ? String(section.id) : "",
      position: (section?.lessons?.length || 0) + 1,
    });
    setSelectedVideoFile(null);
    setUploadMessage("");
    setLessonModalOpen(true);
  };

  const openEditLesson = (section, lesson) => {
    setLessonMode("edit");
    setActiveLesson(lesson);
    setLessonForm({
      title: lesson?.title || "",
      lessonType: lesson?.lessonType || "VIDEO",
      durationSeconds: lesson?.durationSeconds ?? 0,
      position: lesson?.position ?? 1,
      isPreview: Boolean(lesson?.isPreview),
      isFreePreview: Boolean(lesson?.isFreePreview),
      contentText: lesson?.contentText || "",
      videoFileId: lesson?.videoFileId ? String(lesson.videoFileId) : "",
      courseSectionId: section?.id ? String(section.id) : "",
    });
    setSelectedVideoFile(null);
    setUploadMessage("");
    setLessonModalOpen(true);
  };

  const closeLessonModal = () => {
    setLessonModalOpen(false);
    setLessonForm(LESSON_FORM_DEFAULT);
    setActiveLesson(null);
    setSelectedVideoFile(null);
    setUploadingVideo(false);
    setUploadMessage("");
  };

  const handleLessonSubmit = async (event) => {
    event.preventDefault();
    if (!courseId) return;
    if (!lessonForm.title.trim()) {
      setNotice({ type: "error", message: "Vui lòng nhập tiêu đề bài học." });
      return;
    }
    if (!lessonForm.courseSectionId) {
      setNotice({ type: "error", message: "Vui lòng chọn chương." });
      return;
    }

    const payload = {
      courseSectionId: Number(lessonForm.courseSectionId),
      title: lessonForm.title.trim(),
      lessonType: lessonForm.lessonType,
      contentText:
        lessonForm.lessonType === "ARTICLE"
          ? lessonForm.contentText?.trim() || null
          : null,
      videoFileId: lessonForm.videoFileId
        ? Number(lessonForm.videoFileId)
        : null,
      durationSeconds: Number(lessonForm.durationSeconds) || 0,
      isFreePreview: Boolean(lessonForm.isFreePreview),
      isPreview: Boolean(lessonForm.isPreview),
      position: Number(lessonForm.position) || 1,
    };

    setSavingLesson(true);
    setNotice(null);
    try {
      if (lessonMode === "edit" && activeLesson?.id) {
        await updateLesson(courseId, activeLesson.id, payload);
        setNotice({ type: "success", message: "Cập nhật bài học thành công." });
      } else {
        await createLesson(courseId, payload);
        setNotice({ type: "success", message: "Tạo bài học thành công." });
      }
      closeLessonModal();
      await loadCourse();
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.message || "Không thể lưu bài học.",
      });
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lesson) => {
    if (!courseId || !lesson?.id) return;
    const ok = window.confirm("Bạn chắc chắn muốn xóa bài học này?");
    if (!ok) return;
    setNotice(null);
    try {
      await deleteLesson(courseId, lesson.id);
      setNotice({ type: "success", message: "Đã xóa bài học." });
      await loadCourse();
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.message || "Không thể xóa bài học.",
      });
    }
  };

  const handleVideoFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedVideoFile(file);
    if (file) {
      setUploadMessage("");
    }
  };

  const handleUploadVideoFile = async () => {
    if (!selectedVideoFile) {
      setUploadMessage("Vui lòng chọn tệp video.");
      return;
    }

    setUploadingVideo(true);
    setUploadMessage("");
    try {
      const uploaded = await uploadFileWithPresign({
        file: selectedVideoFile,
        isPublic: false,
        purpose: "LESSON_VIDEO",
        courseId,
        lessonId: activeLesson?.id || null,
      });
      const fileId = uploaded?.id || uploaded?.fileId;
      if (!fileId) {
        throw new Error("Không nhận được File ID.");
      }
      setLessonForm((prev) => ({
        ...prev,
        videoFileId: String(fileId),
      }));
      setUploadMessage("Tải video thành công.");
      setSelectedVideoFile(null);
    } catch (err) {
      setUploadMessage(err?.message || "Không thể tải video.");
    } finally {
      setUploadingVideo(false);
    }
  };

  const openCreateCourseDocument = () => {
    setDocumentScope("course");
    setDocumentMode("create");
    setActiveDocument(null);
    setActiveDocumentLesson(null);
    setDocumentForm({
      title: "",
      position: courseDocuments.length + 1,
      uploadedFileId: "",
      lessonId: "",
    });
    setSelectedDocumentFile(null);
    setDocumentUploadMessage("");
    setDocumentModalOpen(true);
  };

  const openEditCourseDocument = (document) => {
    setDocumentScope("course");
    setDocumentMode("edit");
    setActiveDocument(document);
    setActiveDocumentLesson(null);
    setDocumentForm({
      title: document?.title || "",
      position: document?.position ?? 1,
      uploadedFileId: document?.file?.id ? String(document.file.id) : "",
      lessonId: "",
    });
    setSelectedDocumentFile(null);
    setDocumentUploadMessage("");
    setDocumentModalOpen(true);
  };

  const openCreateLessonDocument = (lesson) => {
    setDocumentScope("lesson");
    setDocumentMode("create");
    setActiveDocument(null);
    setActiveDocumentLesson(lesson);
    setDocumentForm({
      title: "",
      position: (lesson?.documents?.length || 0) + 1,
      uploadedFileId: "",
      lessonId: lesson?.id ? String(lesson.id) : "",
    });
    setSelectedDocumentFile(null);
    setDocumentUploadMessage("");
    setDocumentModalOpen(true);
  };

  const openEditLessonDocument = (lesson, document) => {
    setDocumentScope("lesson");
    setDocumentMode("edit");
    setActiveDocument(document);
    setActiveDocumentLesson(lesson);
    setDocumentForm({
      title: document?.title || "",
      position: document?.position ?? 1,
      uploadedFileId: document?.file?.id ? String(document.file.id) : "",
      lessonId: lesson?.id ? String(lesson.id) : "",
    });
    setSelectedDocumentFile(null);
    setDocumentUploadMessage("");
    setDocumentModalOpen(true);
  };

  const closeDocumentModal = () => {
    setDocumentModalOpen(false);
    setDocumentForm(DOCUMENT_FORM_DEFAULT);
    setDocumentMode("create");
    setDocumentScope("course");
    setActiveDocument(null);
    setActiveDocumentLesson(null);
    setSelectedDocumentFile(null);
    setUploadingDocument(false);
    setDocumentUploadMessage("");
  };

  const handleDocumentFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedDocumentFile(file);
    if (file) {
      setDocumentUploadMessage("");
    }
  };

  const handleUploadDocumentFile = async () => {
    if (!selectedDocumentFile) {
      setDocumentUploadMessage("Vui lòng chọn tệp tài liệu.");
      return;
    }

    setUploadingDocument(true);
    setDocumentUploadMessage("");
    try {
      const uploaded = await uploadFileWithPresign({
        file: selectedDocumentFile,
        isPublic: false,
        purpose: "DOCUMENT",
        courseId,
        lessonId:
          documentScope === "lesson" && activeDocumentLesson?.id
            ? activeDocumentLesson.id
            : null,
      });
      const fileId = uploaded?.id || uploaded?.fileId;
      if (!fileId) {
        throw new Error("Không nhận được File ID.");
      }
      setDocumentForm((prev) => ({
        ...prev,
        uploadedFileId: String(fileId),
      }));
      setDocumentUploadMessage("Tải tài liệu thành công.");
      setSelectedDocumentFile(null);
    } catch (err) {
      setDocumentUploadMessage(err?.message || "Không thể tải tài liệu.");
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDocumentSubmit = async (event) => {
    event.preventDefault();
    if (!courseId) return;
    if (!documentForm.title.trim()) {
      setNotice({ type: "error", message: "Vui lòng nhập tiêu đề tài liệu." });
      return;
    }
    if (!documentForm.uploadedFileId) {
      setNotice({ type: "error", message: "Vui lòng tải lên tài liệu." });
      return;
    }

    const payload = {
      uploadedFileId: Number(documentForm.uploadedFileId),
      title: documentForm.title.trim(),
      position: Number(documentForm.position) || 1,
    };

    setSavingDocument(true);
    setNotice(null);
    try {
      if (documentScope === "course") {
        if (documentMode === "edit" && activeDocument?.id) {
          await updateCourseDocument(courseId, activeDocument.id, payload);
          setNotice({ type: "success", message: "Cập nhật tài liệu khóa học thành công." });
        } else {
          await createCourseDocument(courseId, payload);
          setNotice({ type: "success", message: "Tạo tài liệu khóa học thành công." });
        }
      } else {
        const lessonId = activeDocumentLesson?.id || Number(documentForm.lessonId);
        if (!lessonId) {
          throw new Error("Không tìm thấy bài học để gắn tài liệu.");
        }
        if (documentMode === "edit" && activeDocument?.id) {
          await updateLessonDocument(courseId, lessonId, activeDocument.id, payload);
          setNotice({ type: "success", message: "Cập nhật tài liệu bài học thành công." });
        } else {
          await createLessonDocument(courseId, lessonId, payload);
          setNotice({ type: "success", message: "Tạo tài liệu bài học thành công." });
        }
      }
      closeDocumentModal();
      await loadCourse();
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.message || "Không thể lưu tài liệu.",
      });
    } finally {
      setSavingDocument(false);
    }
  };

  const handleDeleteCourseDocument = async (document) => {
    if (!courseId || !document?.id) return;
    const ok = window.confirm("Bạn chắc chắn muốn xóa tài liệu này?");
    if (!ok) return;
    setNotice(null);
    try {
      await deleteCourseDocument(courseId, document.id);
      setNotice({ type: "success", message: "Đã xóa tài liệu khóa học." });
      await loadCourse();
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.message || "Không thể xóa tài liệu.",
      });
    }
  };

  const handleDeleteLessonDocument = async (lesson, document) => {
    if (!courseId || !lesson?.id || !document?.id) return;
    const ok = window.confirm("Bạn chắc chắn muốn xóa tài liệu này?");
    if (!ok) return;
    setNotice(null);
    try {
      await deleteLessonDocument(courseId, lesson.id, document.id);
      setNotice({ type: "success", message: "Đã xóa tài liệu bài học." });
      await loadCourse();
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.message || "Không thể xóa tài liệu.",
      });
    }
  };

  const handleOpenDocumentFile = async (document) => {
    const file = document?.file;
    const fileId = file?.id;
    if (!fileId) {
      setNotice({ type: "error", message: "Không tìm thấy tệp đính kèm." });
      return;
    }

    setOpeningDocumentId(document.id);
    try {
      const url = file?.accessUrl || (await getFileAccessUrl({
        fileId,
        isPublic: file?.isPublic,
      }));
      if (!url) {
        throw new Error("Không thể mở tệp tài liệu.");
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setNotice({ type: "error", message: err?.message || "Không thể mở tệp tài liệu." });
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const toggleLessonDocuments = (lessonId) => {
    if (!lessonId) return;
    setOpenDocumentLessonIds((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const handleOpenLessonDetail = async (lesson) => {
    if (!courseId || !lesson?.id) return;
    setLessonDetailOpen(true);
    setLessonDetailLoading(true);
    setLessonDetailError("");
    setLessonDetail(null);
    setLessonVideoUrl("");
    try {
      const detail = await getLessonDetail(courseId, lesson.id);
      setLessonDetail(detail);
      const videoFile = detail?.videoFile;
      if (videoFile?.accessUrl) {
        setLessonVideoUrl(videoFile.accessUrl);
      } else if (videoFile?.id) {
        const url = await getFileAccessUrl({
          fileId: videoFile.id,
          isPublic: videoFile.isPublic,
        });
        setLessonVideoUrl(url || "");
      }
    } catch (err) {
      setLessonDetailError(err?.message || "Không thể tải chi tiết bài học.");
    } finally {
      setLessonDetailLoading(false);
    }
  };

  const handleCloseLessonDetail = () => {
    setLessonDetailOpen(false);
    setLessonDetail(null);
    setLessonDetailError("");
    setLessonVideoUrl("");
  };

  const openReorderLessons = (section) => {
    const lessons = Array.isArray(section?.lessons)
      ? [...section.lessons].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      : [];
    setReorderSection(section || null);
    setReorderItems(
      lessons.map((lesson, index) => ({
        id: lesson.id,
        title: lesson.title || `Bài học ${index + 1}`,
        position: lesson.position ?? index + 1,
      }))
    );
    setReorderError("");
    setReorderModalOpen(true);
  };

  const closeReorderModal = () => {
    setReorderModalOpen(false);
    setReorderSection(null);
    setReorderItems([]);
    setReorderError("");
    setReorderSaving(false);
  };

  const handleReorderChange = (lessonId, value) => {
    setReorderItems((prev) =>
      prev.map((item) =>
        item.id === lessonId ? { ...item, position: value } : item
      )
    );
  };

  const handleReorderSubmit = async (event) => {
    event.preventDefault();
    if (!courseId || !reorderItems.length) {
      closeReorderModal();
      return;
    }

    const normalized = reorderItems.map((item) => ({
      id: item.id,
      position: Number(item.position),
    }));

    if (normalized.some((item) => !item.id || !Number.isFinite(item.position))) {
      setReorderError("Vui lòng nhập vị trí hợp lệ.");
      return;
    }

    const positions = normalized.map((item) => item.position);
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== positions.length) {
      setReorderError("Vị trí bị trùng, vui lòng kiểm tra lại.");
      return;
    }

    setReorderSaving(true);
    setReorderError("");
    try {
      await reorderLessons(courseId, normalized);
      setNotice({ type: "success", message: "Cập nhật thứ tự bài học thành công." });
      closeReorderModal();
      await loadCourse();
    } catch (err) {
      setReorderError(err?.message || "Không thể cập nhật thứ tự bài học.");
    } finally {
      setReorderSaving(false);
    }
  };


  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to={backTo}
            className="text-sm text-slate-600 hover:text-[#E11D48] transition"
          >
            ← Quay lại danh sách
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {course?.title ? `Khóa học: ${course.title}` : "Đang tải khóa học..."}
          </p>
        </div>
        <Button onClick={openCreateSection}>+ Thêm chương</Button>
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

      {!loading ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Tài liệu khóa học
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Quản lý tài liệu dùng chung cho khóa học.
              </p>
            </div>
            <Button size="sm" onClick={openCreateCourseDocument}>
              + Thêm tài liệu
            </Button>
          </div>

          {courseDocuments.length ? (
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-[600px] w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Tiêu đề</th>
                    <th className="px-4 py-3 text-left font-semibold">Tệp</th>
                    <th className="px-4 py-3 text-left font-semibold">Vị trí</th>
                    <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {courseDocuments.map((document) => (
                    <tr key={document.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 truncate">
                          {document.title || "(Chưa có tiêu đề)"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="truncate">
                          {document.file?.originalName || "Chưa có tệp"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {document.position ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDocumentFile(document)}
                          disabled={openingDocumentId === document.id}
                          className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 disabled:opacity-60"
                        >
                          {openingDocumentId === document.id ? "Đang mở..." : "Mở"}
                        </button>
                        <span className="mx-2 text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => openEditCourseDocument(document)}
                          className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                        >
                          Sửa
                        </button>
                        <span className="mx-2 text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourseDocument(document)}
                          className="text-red-600 hover:text-red-700 hover:underline underline-offset-4"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-3 text-sm text-slate-500">
              Chưa có tài liệu khóa học.
            </div>
          )}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 text-sm text-slate-500">Đang tải nội dung...</div>
      ) : sections.length ? (
        <div className="mt-6 space-y-4">
          {sections.map((section, index) => {
            const lessons = Array.isArray(section.lessons)
              ? [...section.lessons].sort(
                  (a, b) => (a.position ?? 0) - (b.position ?? 0)
                )
              : [];

            return (
              <div
                key={section.id || index}
                className="rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {section.title || `Chương ${index + 1}`}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Vị trí: {section.position ?? index + 1} · {lessons.length} bài học
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openCreateLesson(section)}
                    >
                      + Thêm bài
                    </Button>
                    <button
                      type="button"
                      onClick={() => openReorderLessons(section)}
                      className="text-sm text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                    >
                      Chỉnh thứ tự
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditSection(section)}
                      className="text-sm text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(section)}
                      className="text-sm text-red-600 hover:text-red-700 hover:underline underline-offset-4"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">ID</th>
                        <th className="px-4 py-3 text-left font-semibold">Bài học</th>
                        <th className="px-4 py-3 text-left font-semibold">Loại</th>
                        <th className="px-4 py-3 text-left font-semibold">Thời lượng</th>
                        <th className="px-4 py-3 text-left font-semibold">Preview</th>
                        <th className="px-4 py-3 text-left font-semibold">Vị trí</th>
                        <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lessons.length ? (
                        lessons.map((lesson) => {
                          const documents = Array.isArray(lesson.documents)
                            ? lesson.documents
                            : [];
                          const isDocumentsOpen = openDocumentLessonIds.includes(
                            lesson.id
                          );

                          return (
                            <Fragment key={lesson.id}>
                              <tr
                                className="border-t hover:bg-slate-50 cursor-pointer"
                                onDoubleClick={() => handleOpenLessonDetail(lesson)}
                              >
                                <td className="px-4 py-3 text-slate-700">
                                  {lesson.id}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-slate-900 line-clamp-2">
                                    {lesson.title || "(Chưa có tiêu đề)"}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                  {lesson.lessonType || "-"}
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                  {formatDuration(lesson.durationSeconds)}
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                  {lesson.isPreview || lesson.isFreePreview
                                    ? "Có"
                                    : "Không"}
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                  {lesson.position ?? "-"}
                                </td>
                                <td
                                  className="px-4 py-3 text-right"
                                  onDoubleClick={(event) => event.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleLessonDocuments(lesson.id)}
                                    className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                                  >
                                    Tài liệu
                                  </button>
                                  <span className="mx-2 text-slate-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() => openEditLesson(section, lesson)}
                                    className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                                  >
                                    Sửa
                                  </button>
                                  <span className="mx-2 text-slate-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLesson(lesson)}
                                    className="text-red-600 hover:text-red-700 hover:underline underline-offset-4"
                                  >
                                    Xóa
                                  </button>
                                </td>
                              </tr>
                              {isDocumentsOpen ? (
                                <tr className="border-t bg-slate-50/60">
                                  <td colSpan="7" className="px-4 py-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="text-xs font-semibold text-slate-700">
                                        Tài liệu bài học ({documents.length})
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          openCreateLessonDocument(lesson)
                                        }
                                      >
                                        + Thêm tài liệu
                                      </Button>
                                    </div>
                                    {documents.length ? (
                                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                                        {documents.map((document) => (
                                          <div
                                            key={document.id}
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                                          >
                                            <div className="font-medium text-slate-900 truncate">
                                              {document.title || "Tài liệu"}
                                            </div>
                                            <div className="mt-1 text-slate-500 truncate">
                                              {document.file?.originalName ||
                                                "Chưa có tệp"}
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleOpenDocumentFile(document)
                                                }
                                                disabled={
                                                  openingDocumentId === document.id
                                                }
                                                className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 disabled:opacity-60"
                                              >
                                                {openingDocumentId === document.id
                                                  ? "Đang mở..."
                                                  : "Mở"}
                                              </button>
                                              <span className="text-slate-300">|</span>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  openEditLessonDocument(
                                                    lesson,
                                                    document
                                                  )
                                                }
                                                className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                                              >
                                                Sửa
                                              </button>
                                              <span className="text-slate-300">|</span>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleDeleteLessonDocument(
                                                    lesson,
                                                    document
                                                  )
                                                }
                                                className="text-red-600 hover:text-red-700 hover:underline underline-offset-4"
                                              >
                                                Xóa
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="mt-2 text-xs text-slate-500">
                                        Chưa có tài liệu cho bài học này.
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ) : null}
                            </Fragment>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-4 py-6 text-center text-slate-500"
                          >
                            Chưa có bài học nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Chưa có chương nào. Hãy tạo chương đầu tiên.
        </div>
      )}

      {sectionModalOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeSectionModal}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              {sectionMode === "edit" ? "Sửa chương" : "Tạo chương"}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={handleSectionSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tiêu đề chương
                </label>
                <Input
                  value={sectionForm.title}
                  onChange={(event) =>
                    setSectionForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className="mt-1 rounded-lg px-3"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Vị trí</label>
                <Input
                  type="number"
                  value={sectionForm.position}
                  onChange={(event) =>
                    setSectionForm((prev) => ({
                      ...prev,
                      position: event.target.value,
                    }))
                  }
                  className="mt-1 rounded-lg px-3"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeSectionModal}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center justify-center"
                >
                  Hủy
                </button>
                <Button type="submit" disabled={savingSection}>
                  {savingSection ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          </div>
        </>
      ) : null}

      {lessonModalOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeLessonModal}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              {lessonMode === "edit" ? "Sửa bài học" : "Tạo bài học"}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={handleLessonSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tiêu đề bài học
                </label>
                <Input
                  value={lessonForm.title}
                  onChange={(event) =>
                    setLessonForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className="mt-1 rounded-lg px-3"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Loại bài</label>
                  <select
                    value={lessonForm.lessonType}
                    onChange={(event) => {
                      const nextType = event.target.value;
                      setLessonForm((prev) => ({
                        ...prev,
                        lessonType: nextType,
                        videoFileId: nextType === "VIDEO" ? prev.videoFileId : "",
                        contentText: nextType === "ARTICLE" ? prev.contentText : "",
                      }));
                      if (nextType !== "VIDEO") {
                        setSelectedVideoFile(null);
                        setUploadMessage("");
                      }
                    }}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  >
                    {LESSON_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Thời lượng (giây)
                  </label>
                  <Input
                    type="number"
                    value={lessonForm.durationSeconds}
                    onChange={(event) =>
                      setLessonForm((prev) => ({
                        ...prev,
                        durationSeconds: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg px-3"
                  />
                </div>
              </div>

              {lessonForm.lessonType === "VIDEO" ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      Tải video bài học
                    </span>
                    {lessonForm.videoFileId ? (
                      <span className="text-xs text-slate-500">
                        File ID:{" "}
                        <span className="font-semibold text-slate-700">
                          {lessonForm.videoFileId}
                        </span>
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUploadVideoFile}
                      disabled={uploadingVideo || !selectedVideoFile}
                    >
                      {uploadingVideo ? "Đang tải..." : "Tải lên"}
                    </Button>
                  </div>
                  {uploadMessage ? (
                    <div className="mt-2 text-xs text-slate-600">{uploadMessage}</div>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">
                    Chọn tệp MP4 để hệ thống tải lên và tạo File ID.
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Vị trí
                  </label>
                  <Input
                    type="number"
                    value={lessonForm.position}
                    onChange={(event) =>
                      setLessonForm((prev) => ({
                        ...prev,
                        position: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg px-3"
                  />
                </div>
                {lessonForm.lessonType === "VIDEO" ? (
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Video File ID (nếu có)
                    </label>
                    <Input
                      type="number"
                      value={lessonForm.videoFileId}
                      onChange={(event) =>
                        setLessonForm((prev) => ({
                          ...prev,
                          videoFileId: event.target.value,
                        }))
                      }
                      className="mt-1 rounded-lg px-3"
                    />
                  </div>
                ) : null}
              </div>

              {lessonForm.lessonType === "ARTICLE" ? (
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Nội dung bài viết
                  </label>
                  <textarea
                    value={lessonForm.contentText}
                    onChange={(event) =>
                      setLessonForm((prev) => ({
                        ...prev,
                        contentText: event.target.value,
                      }))
                    }
                    rows="4"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500/20"
                    checked={lessonForm.isPreview}
                    onChange={(event) =>
                      setLessonForm((prev) => ({
                        ...prev,
                        isPreview: event.target.checked,
                      }))
                    }
                  />
                  Cho xem trước
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500/20"
                    checked={lessonForm.isFreePreview}
                    onChange={(event) =>
                      setLessonForm((prev) => ({
                        ...prev,
                        isFreePreview: event.target.checked,
                      }))
                    }
                  />
                  Miễn phí xem trước
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeLessonModal}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center justify-center"
                >
                  Hủy
                </button>
                <Button type="submit" disabled={savingLesson}>
                  {savingLesson ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          </div>
        </>
      ) : null}

      {documentModalOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeDocumentModal}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              {documentMode === "edit"
                ? documentScope === "course"
                  ? "Sửa tài liệu khóa học"
                  : "Sửa tài liệu bài học"
                : documentScope === "course"
                  ? "Tạo tài liệu khóa học"
                  : "Tạo tài liệu bài học"}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={handleDocumentSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Tiêu đề tài liệu
                  </label>
                  <Input
                    value={documentForm.title}
                    onChange={(event) =>
                      setDocumentForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg px-3"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Vị trí
                  </label>
                  <Input
                    type="number"
                    value={documentForm.position}
                    onChange={(event) =>
                      setDocumentForm((prev) => ({
                        ...prev,
                        position: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg px-3"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Tải lên tài liệu
                  </span>
                  {documentForm.uploadedFileId ? (
                    <span className="text-xs text-slate-500">
                      File ID:{" "}
                      <span className="font-semibold text-slate-700">
                        {documentForm.uploadedFileId}
                      </span>
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf"
                    onChange={handleDocumentFileChange}
                    className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUploadDocumentFile}
                    disabled={uploadingDocument || !selectedDocumentFile}
                  >
                    {uploadingDocument ? "Đang tải..." : "Tải lên"}
                  </Button>
                </div>
                {documentUploadMessage ? (
                  <div className="mt-2 text-xs text-slate-600">
                    {documentUploadMessage}
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  Hỗ trợ PDF, Word, Excel, PowerPoint.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  File ID đã tải lên
                </label>
                <Input
                  type="number"
                  value={documentForm.uploadedFileId}
                  onChange={(event) =>
                    setDocumentForm((prev) => ({
                      ...prev,
                      uploadedFileId: event.target.value,
                    }))
                  }
                  className="mt-1 rounded-lg px-3"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDocumentModal}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center justify-center"
                >
                  Hủy
                </button>
                <Button type="submit" disabled={savingDocument}>
                  {savingDocument ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          </div>
        </>
      ) : null}

      {lessonDetailOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={handleCloseLessonDetail}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Chi tiết bài học
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Xem nhanh nội dung và tài nguyên bài học.
            </p>

            {lessonDetailLoading ? (
              <div className="mt-6 text-sm text-slate-500">Đang tải...</div>
            ) : lessonDetailError ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {lessonDetailError}
              </div>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr,1fr]">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500">Tiêu đề</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {lessonDetail?.title || "-"}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-slate-500">Loại bài</div>
                      <div className="mt-1 text-sm text-slate-900">
                        {lessonDetail?.lessonType || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Thời lượng</div>
                      <div className="mt-1 text-sm text-slate-900">
                        {formatDuration(lessonDetail?.durationSeconds)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Preview</div>
                      <div className="mt-1 text-sm text-slate-900">
                        {lessonDetail?.isPreview ? "Có" : "Không"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Miễn phí xem trước</div>
                      <div className="mt-1 text-sm text-slate-900">
                        {lessonDetail?.isFreePreview ? "Có" : "Không"}
                      </div>
                    </div>
                  </div>

                  {lessonDetail?.contentText ? (
                    <div>
                      <div className="text-xs text-slate-500">Nội dung bài viết</div>
                      <div className="mt-1 text-sm text-slate-700 whitespace-pre-line">
                        {lessonDetail.contentText}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      Video bài học
                    </div>
                    <div className="mt-2 h-36 overflow-hidden rounded-lg bg-slate-100 md:h-40">
                      {lessonVideoUrl ? (
                        <video
                          controls
                          className="h-full w-full rounded-lg bg-black object-cover"
                        >
                          <source src={lessonVideoUrl} type="video/mp4" />
                        </video>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                          Chưa có video bài học
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      Tài liệu đính kèm
                    </div>
                    {lessonDetail?.documents?.length ? (
                      <div className="mt-2 space-y-2">
                        {lessonDetail.documents.map((document) => (
                          <div
                            key={document.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 truncate">
                                {document.title || "Tài liệu"}
                              </div>
                              <div className="mt-1 text-slate-500 truncate">
                                {document.file?.originalName || "-"}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenDocumentFile(document)}
                              className="text-slate-700 hover:text-slate-900 hover:underline underline-offset-4"
                            >
                              Mở
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-500">
                        Chưa có tài liệu đính kèm.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseLessonDetail}
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center justify-center"
              >
                Đóng
              </button>
            </div>
          </div>
        </>
      ) : null}

      {reorderModalOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeReorderModal}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Chỉnh thứ tự bài học
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {reorderSection?.title
                ? `Chương: ${reorderSection.title}`
                : "Cập nhật thứ tự bài học trong chương."}
            </p>

            <form className="mt-4 space-y-4" onSubmit={handleReorderSubmit}>
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                {reorderItems.length ? (
                  <div className="space-y-2">
                    {reorderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <div className="flex-1 text-sm text-slate-700 line-clamp-1">
                          {item.title}
                        </div>
                        <Input
                          type="number"
                          value={item.position}
                          onChange={(event) =>
                            handleReorderChange(item.id, event.target.value)
                          }
                          className="h-9 w-20 rounded-lg px-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    Chưa có bài học để sắp xếp.
                  </div>
                )}
              </div>

              {reorderError ? (
                <div className="text-sm text-red-600">{reorderError}</div>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReorderModal}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center justify-center"
                >
                  Hủy
                </button>
                <Button type="submit" disabled={reorderSaving}>
                  {reorderSaving ? "Đang lưu..." : "Lưu thứ tự"}
                </Button>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
