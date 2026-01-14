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

export async function listAdminReviews({
  courseId,
  status,
  page = 0,
  size = 10,
} = {}) {
  try {
    const response = await axiosInstance.get(`/admin/reviews`, {
      params: {
        page,
        size,
        ...(courseId ? { courseId } : {}),
        ...(status ? { status } : {}),
      },
    });
    const payload = unwrapResponse(response);
    return normalizeReviewPage(payload, page, size);
  } catch (error) {
    handleApiError(error);
  }
}

export async function moderateReview(reviewId, status) {
  if (!reviewId || !status) return null;
  try {
    const response = await axiosInstance.patch(
      `/admin/reviews/${reviewId}/moderate`,
      { status }
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
