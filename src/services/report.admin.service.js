import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

const normalizeReportPage = (payload, fallbackPage, fallbackSize) => {
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

/**
 * Admin list all reports (paged)
 * GET /admin/reports?page=0&size=10
 */
export async function listAdminReports({ page = 0, size = 10 } = {}) {
  try {
    const response = await axiosInstance.get(`/admin/reports`, {
      params: { page, size },
    });
    const payload = unwrapResponse(response);
    return normalizeReportPage(payload, page, size);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Admin update report status
 * PATCH /admin/reports/:reportId/status?status=IN_REVIEW
 * Status: OPEN, IN_REVIEW, RESOLVED
 */
export async function updateReportStatus(reportId, status) {
  if (!reportId || !status) return null;
  try {
    const response = await axiosInstance.patch(
      `/admin/reports/${reportId}/status`,
      null,
      {
        params: { status },
      }
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Admin add moderation action
 * POST /admin/reports/:reportId/actions
 * Action: APPROVE, REJECT, HIDE, BLOCK_USER
 */
export async function addModerationAction(reportId, payload) {
  if (!reportId) return null;
  try {
    const response = await axiosInstance.post(
      `/admin/reports/${reportId}/actions`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
