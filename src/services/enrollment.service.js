import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function enrollCourse(courseId) {
  try {
    const response = await axiosInstance.post(`/courses/${courseId}/enroll`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function getEnrollmentStatus(courseId) {
  try {
    const response = await axiosInstance.get(
      `/courses/${courseId}/enrollment-status`
    );
    return Boolean(unwrapResponse(response));
  } catch (error) {
    handleApiError(error);
  }
}

export async function listMyEnrollments({ page = 0, size = 10 } = {}) {
  try {
    const response = await axiosInstance.get("/me/enrollments", {
      params: { page, size },
    });
    const payload = unwrapResponse(response) || {};
    const items = Array.isArray(payload)
      ? payload
      : payload.data || payload.content || payload.items || [];
    const pageNumber =
      payload.pageNumber ??
      payload.page?.number ??
      payload.number ??
      payload.page ??
      page;
    const pageSize =
      payload.pageSize ?? payload.size ?? payload.page?.size ?? size;
    const totalElements =
      payload.totalElements ??
      payload.total ??
      payload.page?.totalElements ??
      items.length;
    const totalPages =
      payload.totalPages ??
      payload.totalPage ??
      payload.page?.totalPages ??
      1;

    return {
      items,
      pageNumber,
      pageSize,
      totalElements,
      totalPages,
    };
  } catch (error) {
    handleApiError(error);
  }
}

export const getMyEnrollments = listMyEnrollments;
