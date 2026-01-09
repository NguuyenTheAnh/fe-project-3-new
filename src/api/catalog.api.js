import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

export async function fetchCategories() {
  try {
    const response = await axiosInstance.get("/categories");
    return unwrapResponse(response) ?? [];
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchTags() {
  try {
    const response = await axiosInstance.get("/tags");
    return unwrapResponse(response) ?? [];
  } catch (error) {
    handleApiError(error);
  }
}

export async function searchCourses(params = {}) {
  try {
    const {
      q,
      page,
      size,
      categoryId,
      tagId,
      level,
      language,
      sort,
    } = params;

    const query = {};
    if (q) query.q = q;
    if (page !== undefined) query.page = page;
    if (size !== undefined) query.size = size;
    if (categoryId) query.categoryId = categoryId;
    if (tagId) query.tagId = tagId;
    if (level) query.level = level;
    if (language) query.language = language;
    if (sort) query.sort = sort;

    const response = await axiosInstance.get("/courses", { params: query });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchCourseDetail(courseId) {
  try {
    const response = await axiosInstance.get(`/courses/${courseId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}
