import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function getCart() {
  try {
    const response = await axiosInstance.get("/cart");
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function addCartItem(courseId) {
  try {
    const response = await axiosInstance.post("/cart/items", { courseId });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function removeCartItem(itemId) {
  try {
    const response = await axiosInstance.delete(`/cart/items/${itemId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
