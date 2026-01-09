import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function listCategories() {
  try {
    const response = await axiosInstance.get("/categories");
    return unwrapResponse(response) || [];
  } catch (error) {
    handleApiError(error);
  }
}

export async function createCategory(payload) {
  try {
    const response = await axiosInstance.post("/categories", payload);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateCategory(categoryId, payload) {
  try {
    const response = await axiosInstance.put(
      `/categories/${categoryId}`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteCategory(categoryId) {
  try {
    const response = await axiosInstance.delete(`/categories/${categoryId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
