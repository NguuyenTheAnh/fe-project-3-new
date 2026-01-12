import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function getLessonQuiz(lessonId) {
  try {
    const response = await axiosInstance.get(
      `/instructor/lessons/${lessonId}/quiz`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function createLessonQuiz(lessonId, payload) {
  try {
    const response = await axiosInstance.post(
      `/instructor/lessons/${lessonId}/quiz`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateQuiz(quizId, payload) {
  try {
    const response = await axiosInstance.put(
      `/instructor/quizzes/${quizId}`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteQuiz(quizId) {
  try {
    const response = await axiosInstance.delete(
      `/instructor/quizzes/${quizId}`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function createQuestion(quizId, payload) {
  try {
    const response = await axiosInstance.post(
      `/instructor/quizzes/${quizId}/questions`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateQuestion(questionId, payload) {
  try {
    const response = await axiosInstance.put(
      `/instructor/questions/${questionId}`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteQuestion(questionId) {
  try {
    const response = await axiosInstance.delete(
      `/instructor/questions/${questionId}`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function createAnswer(questionId, payload) {
  try {
    const response = await axiosInstance.post(
      `/instructor/questions/${questionId}/answers`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateAnswer(answerId, payload) {
  try {
    const response = await axiosInstance.put(
      `/instructor/answers/${answerId}`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteAnswer(answerId) {
  try {
    const response = await axiosInstance.delete(
      `/instructor/answers/${answerId}`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
