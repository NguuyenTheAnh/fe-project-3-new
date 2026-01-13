import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

const fileUrlCache = new Map();

export const getCachedFileUrl = (fileId) => fileUrlCache.get(fileId);

export const setCachedFileUrl = (fileId, url) => {
  if (!fileId || !url) return;
  fileUrlCache.set(fileId, url);
};

export async function getFileAccessUrl({ fileId, isPublic }) {
  if (!fileId) return null;
  const cached = getCachedFileUrl(fileId);
  if (cached) return cached;

  try {
    const publicResponse = await axiosInstance.get(
      `/files/meta/public/${fileId}`
    );
    const publicData = unwrapResponse(publicResponse);
    const publicUrl = publicData?.accessUrl || null;
    if (publicUrl) {
      setCachedFileUrl(fileId, publicUrl);
      return publicUrl;
    }

    try {
      const response = await axiosInstance.get(`/files/${fileId}/url`);
      const data = unwrapResponse(response);
      const directUrl =
        typeof data === "string" ? data : data?.accessUrl || null;
      if (directUrl) {
        setCachedFileUrl(fileId, directUrl);
        return directUrl;
      }
    } catch (error) {
      // Fall back to meta when direct URL is unavailable.
    }

    const metaResponse = await axiosInstance.get(`/files/meta/${fileId}`);
    const meta = unwrapResponse(metaResponse);
    const metaUrl = meta?.accessUrl || null;
    if (metaUrl) {
      setCachedFileUrl(fileId, metaUrl);
      return metaUrl;
    }
  } catch (error) {
    handleApiError(error);
  }

  return null;
}

export async function getFileAccessUrlPrivate(fileId) {
  if (!fileId) return null;
  const cached = getCachedFileUrl(fileId);
  if (cached) return cached;
  try {
    const metaResponse = await axiosInstance.get(`/files/meta/${fileId}`);
    const meta = unwrapResponse(metaResponse);
    const metaUrl = meta?.accessUrl || null;
    if (metaUrl) {
      setCachedFileUrl(fileId, metaUrl);
      return metaUrl;
    }
  } catch (error) {
    handleApiError(error);
  }
  return null;
}

export async function uploadFileDirect({
  file,
  isPublic = false,
  purpose = "LESSON_VIDEO",
  courseId,
  lessonId,
} = {}) {
  if (!file) {
    throw new Error("Vui lòng chọn tệp để tải lên.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("public", String(isPublic));
  if (purpose) formData.append("purpose", purpose);
  if (courseId) formData.append("courseId", String(courseId));
  if (lessonId) formData.append("lessonId", String(lessonId));

  try {
    const response = await axiosInstance.post("/files", formData);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function requestPresignPut(payload) {
  if (!payload) {
    throw new Error("Thiếu thông tin tệp để tải lên.");
  }
  try {
    const response = await axiosInstance.post("/files/presign/put", payload);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function uploadToPresignedUrl({ url, file, headers }) {
  if (!url || !file) {
    throw new Error("Thiếu dữ liệu để tải lên.");
  }

  const uploadHeaders = {};
  if (headers?.["content-type"]) {
    uploadHeaders["Content-Type"] = headers["content-type"];
  } else if (file.type) {
    uploadHeaders["Content-Type"] = file.type;
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: uploadHeaders,
    body: file,
  });

  if (!response.ok) {
    throw new Error("Tải lên thất bại.");
  }
}

export async function completeFileUpload(fileId) {
  if (!fileId) {
    throw new Error("Không tìm thấy File ID.");
  }
  try {
    const response = await axiosInstance.post("/files/complete", { fileId });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function uploadFileWithPresign({
  file,
  isPublic = false,
  purpose = "LESSON_VIDEO",
  courseId,
  lessonId,
} = {}) {
  if (!file) {
    throw new Error("Vui lòng chọn tệp để tải lên.");
  }

  const presignPayload = {
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    size: file.size,
    purpose,
    courseId: courseId ? Number(courseId) : null,
    lessonId: lessonId ? Number(lessonId) : null,
    isPublic: Boolean(isPublic),
  };

  const presign = await requestPresignPut(presignPayload);
  await uploadToPresignedUrl({
    url: presign?.url,
    file,
    headers: presign?.headers,
  });
  const completed = await completeFileUpload(presign?.fileId);
  return completed || presign;
}
