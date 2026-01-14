import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

const resolveUpdatePath = (questionId, scope) =>
  scope === "instructor"
    ? `/instructor/questions/${questionId}`
    : `/questions/${questionId}`;

const resolveDeletePath = (questionId, scope) =>
  scope === "instructor"
    ? `/instructor/questions/${questionId}`
    : `/admin/questions/${questionId}`;

export async function listManagementQuestions({
  page = 0,
  size = 10,
} = {}) {
  try {
    const response = await axiosInstance.get("/admin/questions", {
      params: { page, size },
    });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateManagementQuestion(
  questionId,
  payload,
  scope = "admin"
) {
  if (!questionId) return null;
  try {
    const response = await axiosInstance.put(
      resolveUpdatePath(questionId, scope),
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteManagementQuestion(questionId, scope = "admin") {
  if (!questionId) return null;
  try {
    const response = await axiosInstance.delete(
      resolveDeletePath(questionId, scope)
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteQuestionAnswer(answerId) {
  if (!answerId) return null;
  try {
    const response = await axiosInstance.delete(`/admin/answers/${answerId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
