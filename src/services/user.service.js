import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

/**
 * Get current user profile
 * GET /users/me/profile
 */
export async function getMyProfile() {
  try {
    const response = await axiosInstance.get(`/users/me/profile`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Update current user profile
 * PUT /users/me/profile
 */
export async function updateMyProfile(payload) {
  try {
    const response = await axiosInstance.put(`/users/me/profile`, payload);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
