import axiosInstance from "@/util/axios.customize";

const unwrap = (response) => {
  const body = response?.data;
  if (body?.code === "00" && body?.data) {
    return body.data;
  }
  const message = body?.message || "Có lỗi xảy ra, vui lòng thử lại.";
  throw new Error(message);
};

const handleError = (error) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Có lỗi xảy ra, vui lòng thử lại.";
  throw new Error(message);
};

const register = async (payload) => {
  try {
    const response = await axiosInstance.post("/auth/register", payload, {
      _skipAuthRefresh: true,
    });
    return unwrap(response);
  } catch (error) {
    handleError(error);
  }
};

const login = async (payload) => {
  try {
    const response = await axiosInstance.post("/auth/login", payload, {
      _skipAuthRefresh: true,
    });
    return unwrap(response);
  } catch (error) {
    handleError(error);
  }
};

const refresh = async (payload) => {
  try {
    const response = await axiosInstance.post("/auth/refresh", payload, {
      _skipAuthRefresh: true,
    });
    return unwrap(response);
  } catch (error) {
    handleError(error);
  }
};

const logout = async (payload) => {
  try {
    const response = await axiosInstance.post("/auth/logout", payload, {
      _skipAuthRefresh: true,
    });
    return unwrap(response);
  } catch (error) {
    handleError(error);
  }
};

const authApi = { register, login, refresh, logout };

export default authApi;
