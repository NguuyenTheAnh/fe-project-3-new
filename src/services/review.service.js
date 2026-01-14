import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

const normalizeReviewPage = (payload, fallbackPage, fallbackSize) => {
  const dataBlock = payload?.content ? payload : payload?.data ?? payload;
  const items = Array.isArray(dataBlock)
    ? dataBlock
    : dataBlock?.content || dataBlock?.items || [];
  return {
    items,
    pageNumber: dataBlock?.pageNumber ?? dataBlock?.number ?? fallbackPage,
    pageSize: dataBlock?.pageSize ?? dataBlock?.size ?? fallbackSize,
    totalElements: dataBlock?.totalElements ?? items.length,
    totalPages: dataBlock?.totalPages ?? 1,
  };
};

export async function getMyReview(courseId) {
  if (!courseId) return null;
  try {
    const response = await axiosInstance.get(
      `/courses/${courseId}/reviews/me`
    );
    return unwrapResponse(response);
  } catch (error) {
    if (error?.response?.status === 404) return null;
    handleApiError(error);
  }
}

export async function upsertReview(courseId, payload) {
  if (!courseId) return null;
  try {
    const response = await axiosInstance.post(
      `/courses/${courseId}/reviews`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteReview(courseId, reviewId) {
  if (!courseId || !reviewId) return null;
  try {
    const response = await axiosInstance.delete(
      `/courses/${courseId}/reviews/${reviewId}`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function listApprovedReviews(
  courseId,
  { page = 0, size = 10 } = {}
) {
  if (!courseId) return normalizeReviewPage(null, page, size);
  try {
    const response = await axiosInstance.get(
      `/courses/${courseId}/reviews`,
      {
        params: { page, size },
      }
    );
    const payload = unwrapResponse(response);
    return normalizeReviewPage(payload, page, size);
  } catch (error) {
    handleApiError(error);
  }
}
