import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

const normalizeUserPage = (payload, fallbackPage, fallbackSize) => {
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
 * List users with optional role filter
 * GET /users?role=STUDENT or ?role=INSTRUCTOR
 */
export async function listUsers({ role, page = 0, size = 20 } = {}) {
  try {
    const params = { page, size };
    if (role) params.role = role;
    const response = await axiosInstance.get(`/users`, { params });
    const payload = unwrapResponse(response);
    return normalizeUserPage(payload, page, size);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get user by ID
 * GET /users/:userId
 */
export async function getUserById(userId) {
  if (!userId) return null;
  try {
    const response = await axiosInstance.get(`/users/${userId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create new user
 * POST /users
 */
export async function createUser(payload) {
  try {
    const response = await axiosInstance.post(`/users`, payload);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Delete user
 * DELETE /users/:id
 */
export async function deleteUser(userId) {
  if (!userId) return null;
  try {
    const response = await axiosInstance.delete(`/users/${userId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
