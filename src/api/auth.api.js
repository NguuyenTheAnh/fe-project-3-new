import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

const register = async (payload) => {
  try {
    const response = await axiosInstance.post("/auth/register", payload, {
      _skipAuthRefresh: true,
    });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

const login = async (payload) => {
  try {
    const response = await axiosInstance.post("/auth/login", payload, {
      _skipAuthRefresh: true,
    });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

const refresh = async (payload) => {
  try {
    const response = await axiosInstance.post("/auth/refresh", payload, {
      _skipAuthRefresh: true,
    });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

const logout = async (payload) => {
  try {
    const response = await axiosInstance.post("/auth/logout", payload, {
      _skipAuthRefresh: true,
    });
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

const authApi = { register, login, refresh, logout };

export default authApi;
