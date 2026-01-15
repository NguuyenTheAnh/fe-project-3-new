import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

/**
 * Get admin dashboard
 * GET /dashboard/admin?days=30&limit=10
 */
export async function getAdminDashboard({ days = 30, limit = 10 } = {}) {
  try {
    const response = await axiosInstance.get(`/dashboard/admin`, {
      params: { days, limit },
    });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get current instructor dashboard
 * GET /dashboard/instructor?limit=10
 */
export async function getInstructorDashboard({ limit = 10 } = {}) {
  try {
    const response = await axiosInstance.get(`/dashboard/instructor`, {
      params: { limit },
    });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get specific instructor dashboard (admin only)
 * GET /dashboard/instructor/:instructorId?limit=10
 */
export async function getInstructorDashboardById(instructorId, { limit = 10 } = {}) {
  if (!instructorId) return null;
  try {
    const response = await axiosInstance.get(`/dashboard/instructor/${instructorId}`, {
      params: { limit },
    });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
