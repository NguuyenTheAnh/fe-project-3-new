const DEFAULT_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại.";

export const unwrapResponse = (response) => {
  const payload = response?.data;
  if (!payload) {
    throw new Error(DEFAULT_MESSAGE);
  }
  if (payload.code && payload.code !== "00") {
    throw new Error(payload.message || DEFAULT_MESSAGE);
  }
  return payload.data;
};

export const handleApiError = (error) => {
  const payload = error?.response?.data;
  const message = payload?.message || error?.message || DEFAULT_MESSAGE;
  const wrapped = new Error(message);
  wrapped.status = error?.response?.status;
  wrapped.payload = payload;
  throw wrapped;
};
