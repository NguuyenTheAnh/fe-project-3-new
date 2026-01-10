import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function createSection(courseId, payload) {
  try {
    const response = await axiosInstance.post(
      `/instructor/courses/${courseId}/sections`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateSection(courseId, sectionId, payload) {
  try {
    const response = await axiosInstance.put(
      `/instructor/courses/${courseId}/sections/${sectionId}`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteSection(courseId, sectionId) {
  try {
    const response = await axiosInstance.delete(
      `/instructor/courses/${courseId}/sections/${sectionId}`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function createLesson(courseId, payload) {
  try {
    const response = await axiosInstance.post(
      `/instructor/courses/${courseId}/lessons`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateLesson(courseId, lessonId, payload) {
  try {
    const response = await axiosInstance.put(
      `/instructor/courses/${courseId}/lessons/${lessonId}`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteLesson(courseId, lessonId) {
  try {
    const response = await axiosInstance.delete(
      `/instructor/courses/${courseId}/lessons/${lessonId}`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function getLessonDetail(courseId, lessonId) {
  try {
    const response = await axiosInstance.get(
      `/instructor/courses/${courseId}/lessons/${lessonId}`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function createCourseDocument(courseId, payload) {
  try {
    const response = await axiosInstance.post(
      `/instructor/courses/${courseId}/documents`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateCourseDocument(courseId, documentId, payload) {
  try {
    const response = await axiosInstance.put(
      `/instructor/courses/${courseId}/documents/${documentId}`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteCourseDocument(courseId, documentId) {
  try {
    const response = await axiosInstance.delete(
      `/instructor/courses/${courseId}/documents/${documentId}`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function createLessonDocument(courseId, lessonId, payload) {
  try {
    const response = await axiosInstance.post(
      `/instructor/courses/${courseId}/lessons/${lessonId}/documents`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateLessonDocument(
  courseId,
  lessonId,
  documentId,
  payload
) {
  try {
    const response = await axiosInstance.put(
      `/instructor/courses/${courseId}/lessons/${lessonId}/documents/${documentId}`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteLessonDocument(courseId, lessonId, documentId) {
  try {
    const response = await axiosInstance.delete(
      `/instructor/courses/${courseId}/lessons/${lessonId}/documents/${documentId}`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
