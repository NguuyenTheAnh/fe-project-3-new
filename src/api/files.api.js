import axiosInstance from "@/util/axios.customize";
import { handleApiError, unwrapResponse } from "@/util/api.response";

const fileUrlCache = new Map();

export const getCachedFileUrl = (fileId) => fileUrlCache.get(fileId);

export const setCachedFileUrl = (fileId, url) => {
  if (!fileId || !url) return;
  fileUrlCache.set(fileId, url);
};

export async function getFileMetaPublic(fileId) {
  try {
    const response = await axiosInstance.get(`/files/meta/public/${fileId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function getFileMeta(fileId) {
  try {
    const response = await axiosInstance.get(`/files/meta/${fileId}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function resolveFileAccessUrl(file, isAuthenticated) {
  if (!file) return null;
  if (typeof file === "string") return file;
  if (file.accessUrl) {
    setCachedFileUrl(file.id || file.fileId, file.accessUrl);
    return file.accessUrl;
  }

  const fileId = file.id || file.fileId;
  if (!fileId) return null;
  const cached = getCachedFileUrl(fileId);
  if (cached) return cached;

  try {
    const publicMeta = await getFileMetaPublic(fileId);
    if (publicMeta?.accessUrl) {
      setCachedFileUrl(fileId, publicMeta.accessUrl);
      return publicMeta.accessUrl;
    }
  } catch (error) {
    // Public access failed, fallback below if authenticated.
  }

  if (!isAuthenticated) return null;

  const meta = await getFileMeta(fileId);
  const url = meta?.accessUrl;
  if (url) {
    setCachedFileUrl(fileId, url);
  }
  return url || null;
}
