import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function checkoutCart(cartId) {
  try {
    const response = await axiosInstance.post("/orders/checkout", { cartId });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function payOrderVnpay(orderId) {
  try {
    const response = await axiosInstance.post(`/orders/${orderId}/pay/vnpay`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function getOrderDetail(orderId) {
  try {
    const response = await axiosInstance.get(`/orders/${orderId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
