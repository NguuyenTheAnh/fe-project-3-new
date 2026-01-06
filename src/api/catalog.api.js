import axiosInstance from "@/util/axios.customize";

const unwrap = (response) => {
  const body = response?.data;
  if (!body) {
    throw new Error("Không có dữ liệu từ máy chủ.");
  }
  if (body.data !== undefined) {
    return body.data;
  }
  throw new Error(body.message || "Có lỗi xảy ra, vui lòng thử lại.");
};

const handleError = (error) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Có lỗi xảy ra, vui lòng thử lại.";
  throw new Error(message);
};

export async function fetchCategories() {
  try {
    const response = await axiosInstance.get("/categories");
    return unwrap(response) ?? [];
  } catch (error) {
    handleError(error);
  }
}

export async function fetchTags() {
  try {
    const response = await axiosInstance.get("/tags");
    return unwrap(response) ?? [];
  } catch (error) {
    handleError(error);
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
    return unwrap(response);
  } catch (error) {
    handleError(error);
  }
}

export async function fetchCourseDetail(courseId) {
  try {
    const response = await axiosInstance.get(`/courses/${courseId}`);
    return unwrap(response);
  } catch (error) {
    handleError(error);
  }
}
