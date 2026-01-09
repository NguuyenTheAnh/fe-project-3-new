import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

const courseCache = new Map();
const fileUrlCache = new Map();

export async function listMyEnrollments({ page = 0, size = 10 } = {}) {
  try {
    const response = await axiosInstance.get("/me/enrollments", {
      params: { page, size },
    });
    const payload = unwrapResponse(response) || {};
    const dataBlock = payload.data ?? payload;
    const items = Array.isArray(dataBlock)
      ? dataBlock
      : dataBlock.content || dataBlock.data || dataBlock.items || [];

    return {
      items,
      pageNumber: dataBlock.pageNumber ?? dataBlock.page ?? page,
      pageSize: dataBlock.pageSize ?? dataBlock.size ?? size,
      totalElements: dataBlock.totalElements ?? items.length,
      totalPages: dataBlock.totalPages ?? 1,
    };
  } catch (error) {
    handleApiError(error);
  }
}

export async function getCourseDetail(courseId) {
  if (!courseId) return null;
  const cached = courseCache.get(courseId);
  if (cached) return cached;

  try {
    const response = await axiosInstance.get(`/courses/${courseId}`);
    const course = unwrapResponse(response);
    if (course) {
      courseCache.set(courseId, course);
    }
    return course;
  } catch (error) {
    handleApiError(error);
  }
}

export async function getFileMetaSmart(fileId, isPublic) {
  if (!fileId) return null;
  const cached = fileUrlCache.get(fileId);
  if (cached) return cached;

  try {
    const url = isPublic
      ? `/files/meta/public/${fileId}`
      : `/files/meta/${fileId}`;
    const response = await axiosInstance.get(url);
    const meta = unwrapResponse(response);
    const accessUrl = meta?.accessUrl || null;
    if (accessUrl) {
      fileUrlCache.set(fileId, accessUrl);
    }
    return accessUrl;
  } catch (error) {
    handleApiError(error);
  }
}
