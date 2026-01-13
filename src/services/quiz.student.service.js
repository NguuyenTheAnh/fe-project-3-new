import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function getQuizByLesson(lessonId) {
  if (!lessonId) return null;
  try {
    const response = await axiosInstance.get(`/lessons/${lessonId}/quiz`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
