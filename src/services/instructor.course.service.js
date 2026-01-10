import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function listInstructorCourses({ page = 0, size = 10 } = {}) {
  try {
    const response = await axiosInstance.get("/instructor/courses", {
      params: { page, size },
    });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function createInstructorCourse(payload) {
  try {
    const response = await axiosInstance.post("/instructor/courses", payload);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateInstructorCourse(courseId, payload) {
  try {
    const response = await axiosInstance.put(
      `/instructor/courses/${courseId}`,
      payload
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateCourseTags(courseId, tagIds = []) {
  try {
    const response = await axiosInstance.put(
      `/instructor/courses/${courseId}/tags`,
      { tagIds }
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateCourseStatus(courseId, status) {
  try {
    const response = await axiosInstance.patch(
      `/instructor/courses/${courseId}/status`,
      { status }
    );
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
