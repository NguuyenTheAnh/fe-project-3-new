import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function createQuizAttempt(quizId) {
  if (!quizId) return null;
  try {
    const response = await axiosInstance.post(`/quizzes/${quizId}/attempts`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function submitQuizAttempt(quizId, attemptId, answers = []) {
  if (!quizId || !attemptId) return null;
  try {
    const response = await axiosInstance.post(
      `/quizzes/${quizId}/attempts/${attemptId}/submit`,
      {
        quizId,
        answers,
      }
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function getQuizAttempt(quizId, attemptId) {
  if (!quizId || !attemptId) return null;
  try {
    const response = await axiosInstance.get(
      `/quizzes/${quizId}/attempts/${attemptId}`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function listQuizAttempts(quizId) {
  if (!quizId) return [];
  try {
    const response = await axiosInstance.get(`/quizzes/${quizId}/attempts`);
    return unwrapResponse(response) || [];
  } catch (error) {
    handleApiError(error);
  }
}
