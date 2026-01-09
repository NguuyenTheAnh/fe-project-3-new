import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function listTags() {
  try {
    const response = await axiosInstance.get("/tags");
    return unwrapResponse(response) || [];
  } catch (error) {
    handleApiError(error);
  }
}

export async function createTag(payload) {
  try {
    const response = await axiosInstance.post("/tags", payload);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateTag(tagId, payload) {
  try {
    const response = await axiosInstance.put(`/tags/${tagId}`, payload);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteTag(tagId) {
  try {
    const response = await axiosInstance.delete(`/tags/${tagId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
