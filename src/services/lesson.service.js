import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function getLessonDetail(lessonId) {
  if (!lessonId) return null;
  try {
    const response = await axiosInstance.get(`/lessons/${lessonId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
