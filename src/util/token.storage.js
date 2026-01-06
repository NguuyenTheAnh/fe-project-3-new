const ACCESS_KEY = "lms_access_token";
const REFRESH_KEY = "lms_refresh_token";

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const setAccessToken = (token) => localStorage.setItem(ACCESS_KEY, token);
export const clearAccessToken = () => localStorage.removeItem(ACCESS_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const setRefreshToken = (token) => localStorage.setItem(REFRESH_KEY, token);
export const clearRefreshToken = () => localStorage.removeItem(REFRESH_KEY);

export const clearAllTokens = () => {
  clearAccessToken();
  clearRefreshToken();
};
