import { resolveFileAccessUrl } from "@/api/files.api";
import { getAccessToken } from "@/util/token.storage";

const PLACEHOLDER_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#e5e7eb"/>' +
      '<stop offset="100%" stop-color="#d1d5db"/>' +
      "</linearGradient></defs>" +
      '<rect width="100%" height="100%" fill="url(#g)"/>' +
      '<text x="50%" y="50%" fill="#6b7280" font-size="20" text-anchor="middle" dominant-baseline="middle">' +
      "HUSTemy" +
      "</text>" +
      "</svg>"
  );

export async function resolveThumbnailUrl(thumbnail, isAuthenticatedOverride) {
  if (!thumbnail) return PLACEHOLDER_URL;
  const isAuthenticated =
    typeof isAuthenticatedOverride === "boolean"
      ? isAuthenticatedOverride
      : Boolean(getAccessToken());
  const url = await resolveFileAccessUrl(thumbnail, isAuthenticated);
  return url || PLACEHOLDER_URL;
}

export async function getFileUrl(fileId, isPublic, isAuthenticatedOverride) {
  if (!fileId) return null;
  const isAuthenticated =
    typeof isAuthenticatedOverride === "boolean"
      ? isAuthenticatedOverride
      : Boolean(getAccessToken());
  const file = { id: fileId, isPublic };
  return resolveFileAccessUrl(file, isAuthenticated);
}

export const placeholderThumbnailUrl = PLACEHOLDER_URL;
