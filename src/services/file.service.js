import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

const fileUrlCache = new Map();

export const getCachedFileUrl = (fileId) => fileUrlCache.get(fileId);

export const setCachedFileUrl = (fileId, url) => {
  if (!fileId || !url) return;
  fileUrlCache.set(fileId, url);
};

export async function getFileAccessUrl({ fileId, isPublic }) {
  if (!fileId) return null;
  const cached = getCachedFileUrl(fileId);
  if (cached) return cached;

  try {
    if (isPublic) {
      const response = await axiosInstance.get(
        `/files/meta/public/${fileId}`
      );
      const data = unwrapResponse(response);
      const url = data?.accessUrl || null;
      if (url) setCachedFileUrl(fileId, url);
      return url;
    }

    try {
      const response = await axiosInstance.get(`/files/${fileId}/url`);
      const data = unwrapResponse(response);
      const directUrl =
        typeof data === "string" ? data : data?.accessUrl || null;
      if (directUrl) {
        setCachedFileUrl(fileId, directUrl);
        return directUrl;
      }
    } catch (error) {
      // Fall back to meta when direct URL is unavailable.
    }

    const metaResponse = await axiosInstance.get(`/files/meta/${fileId}`);
    const meta = unwrapResponse(metaResponse);
    const metaUrl = meta?.accessUrl || null;
    if (metaUrl) {
      setCachedFileUrl(fileId, metaUrl);
      return metaUrl;
    }
  } catch (error) {
    handleApiError(error);
  }

  return null;
}
