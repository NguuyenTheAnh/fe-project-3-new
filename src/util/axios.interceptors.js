let interceptorsSetup = false;

export function setupInterceptors(axiosInstance, helpers) {
  if (interceptorsSetup) return;
  interceptorsSetup = true;

  axiosInstance.interceptors.request.use((config) => {
    const token = helpers?.getAccessToken?.();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { response, config } = error || {};
      if (!response || !config) {
        return Promise.reject(error);
      }

      if (config._skipAuthRefresh) {
        return Promise.reject(error);
      }

      if (response.status === 401 && !config._retry) {
        config._retry = true;
        try {
          const newToken = await helpers?.refreshSession?.();
          if (newToken) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(config);
          }
        } catch (refreshError) {
          await helpers?.logout?.();
          return Promise.reject(refreshError);
        }
      }

      if (response.status === 401) {
        await helpers?.logout?.();
      }

      return Promise.reject(error);
    }
  );
}
