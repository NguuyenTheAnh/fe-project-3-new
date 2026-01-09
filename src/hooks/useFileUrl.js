"use client";

import { useEffect, useState } from "react";
import {
  placeholderThumbnailUrl,
  resolveThumbnailUrl,
} from "@/util/fileUrl";
import { useAuth } from "@/contexts/AuthContext";

export default function useFileUrl(file) {
  const { isAuthenticated } = useAuth();
  const [url, setUrl] = useState(() => {
    if (typeof file === "string") return file;
    if (!file) return placeholderThumbnailUrl;
    return file?.accessUrl || null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadUrl = async () => {
      const directUrl =
        typeof file === "string" ? file : file?.accessUrl || null;
      if (directUrl) {
        setUrl(directUrl);
        return;
      }
      if (!file) {
        setUrl(placeholderThumbnailUrl);
        return;
      }

      setLoading(true);
      try {
        const resolved = await resolveThumbnailUrl(file, isAuthenticated);
        if (active) {
          setUrl(resolved);
        }
      } catch {
        if (active) {
          setUrl(placeholderThumbnailUrl);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUrl();

    return () => {
      active = false;
    };
  }, [file, isAuthenticated]);

  return { url, loading };
}
