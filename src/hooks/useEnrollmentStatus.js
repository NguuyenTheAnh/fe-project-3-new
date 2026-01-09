import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getEnrollmentStatus } from "@/services/enrollment.service";

export default function useEnrollmentStatus(courseId) {
  const { isAuthenticated, hasRole } = useAuth();
  const isStudent = isAuthenticated && hasRole("ROLE_STUDENT");
  const [enrolled, setEnrolled] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    if (!courseId || !isStudent) {
      setEnrolled(null);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const status = await getEnrollmentStatus(courseId);
      setEnrolled(Boolean(status));
    } catch (err) {
      setError(err?.message || "Không thể kiểm tra trạng thái ghi danh.");
    } finally {
      setLoading(false);
    }
  }, [courseId, isStudent]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { enrolled, loading, error, refetch: fetchStatus };
}
