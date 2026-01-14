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

export async function listMyReports({ page = 0, size = 10 } = {}) {
  try {
    const response = await axiosInstance.get(`/reports/my`, {
      params: { page, size },
    });
    const payload = unwrapResponse(response);
    return normalizeReportPage(payload, page, size);
  } catch (error) {
    handleApiError(error);
  }
}

export async function createReport(payload) {
  try {
    const response = await axiosInstance.post(`/reports`, payload);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateReportReason(reportId, payload) {
  if (!reportId) return null;
  try {
    const response = await axiosInstance.put(`/reports/${reportId}`, payload);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
