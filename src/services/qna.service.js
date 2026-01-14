import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

const normalizeQuestionList = (payload, fallbackPage, fallbackSize) => {
  const dataBlock = payload?.content ? payload : payload?.data ?? payload;
  const items = Array.isArray(dataBlock)
    ? dataBlock
    : dataBlock?.content || dataBlock?.items || [];
  return {
    items,
    pageNumber: dataBlock?.pageNumber ?? dataBlock?.number ?? fallbackPage,
    pageSize: dataBlock?.pageSize ?? dataBlock?.size ?? fallbackSize,
    totalElements: dataBlock?.totalElements ?? items.length,
    totalPages: dataBlock?.totalPages ?? 1,
  };
};

export async function listCourseQuestions({
  courseId,
  lessonId,
  page = 0,
  size = 10,
} = {}) {
  if (!courseId) return normalizeQuestionList(null, page, size);
  try {
    const response = await axiosInstance.get(`/courses/${courseId}/questions`, {
      params: {
        page,
        size,
        ...(lessonId ? { lessonId } : {}),
      },
    });
    const payload = unwrapResponse(response);
    return normalizeQuestionList(payload, page, size);
  } catch (error) {
    handleApiError(error);
  }
}

export async function createCourseQuestion(courseId, payload) {
  if (!courseId) return null;
  try {
    const response = await axiosInstance.post(
      `/courses/${courseId}/questions`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function listQuestionAnswers(questionId) {
  if (!questionId) return [];
  try {
    const response = await axiosInstance.get(
      `/questions/${questionId}/answers`
    );
    return unwrapResponse(response) || [];
  } catch (error) {
    handleApiError(error);
  }
}

export async function createQuestionAnswer(questionId, payload) {
  if (!questionId) return null;
  try {
    const response = await axiosInstance.post(
      `/questions/${questionId}/answers`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function getQuestionDetail(questionId) {
  if (!questionId) return null;
  try {
    const response = await axiosInstance.get(`/questions/${questionId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateQuestion(questionId, payload) {
  if (!questionId) return null;
  try {
    const response = await axiosInstance.put(
      `/questions/${questionId}`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function voteQuestion(questionId, voteType) {
  if (!questionId || !voteType) return null;
  try {
    const response = await axiosInstance.post(`/questions/${questionId}/vote`, {
      voteType,
    });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function acceptQuestionAnswer(questionId, answerId) {
  if (!questionId || !answerId) return null;
  try {
    const response = await axiosInstance.patch(
      `/questions/${questionId}/answers/${answerId}/accept`
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
