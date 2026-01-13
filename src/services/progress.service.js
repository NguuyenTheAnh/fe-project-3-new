import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function getLessonProgress(courseId, lessonId) {
  if (!courseId || !lessonId) return null;
  try {
    const response = await axiosInstance.get(
      `/courses/${courseId}/lessons/${lessonId}/progress`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateLessonProgress(courseId, lessonId, payload = {}) {
  if (!courseId || !lessonId) return null;
  try {
    const response = await axiosInstance.patch(
      `/courses/${courseId}/lessons/${lessonId}/progress`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function getCourseProgress(courseId) {
  if (!courseId) return null;
  try {
    const response = await axiosInstance.get(`/courses/${courseId}/progress`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function listCompletedLessons(courseId) {
  if (!courseId) return [];
  try {
    const response = await axiosInstance.get(
      `/courses/${courseId}/lessons/completed`
    );
    return unwrapResponse(response) || [];
  } catch (error) {
    handleApiError(error);
  }
}
