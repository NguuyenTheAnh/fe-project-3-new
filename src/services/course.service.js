import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function getCourseDetail(courseId) {
  try {
    const response = await axiosInstance.get(`/courses/${courseId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
