import { useCallback, useEffect, useState } from "react";
import { listMyEnrollments } from "@/services/enrollment.service";

export default function useMyEnrollments({ page = 0, size = 10 } = {}) {
  const [items, setItems] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    pageNumber: page,
    pageSize: size,
    totalElements: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(
    async (targetPage, replace = false) => {
      setLoading(true);
      setError("");
      try {
        const data = await listMyEnrollments({
          page: targetPage,
          size,
        });
        setPageInfo({
          pageNumber: data.pageNumber ?? targetPage,
          pageSize: data.pageSize ?? size,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 1,
        });
        setItems((prev) =>
          replace ? data.items || [] : [...prev, ...(data.items || [])]
        );
      } catch (err) {
        setError(err?.message || "Có lỗi xảy ra, vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    },
    [size]
  );

  useEffect(() => {
    loadPage(page, true);
  }, [page, loadPage]);

  const loadMore = useCallback(() => {
    const nextPage = (pageInfo.pageNumber ?? page) + 1;
    if (nextPage >= (pageInfo.totalPages ?? 1)) return;
    loadPage(nextPage, false);
  }, [loadPage, pageInfo, page]);

  const refetch = useCallback(() => {
    loadPage(page, true);
  }, [loadPage, page]);

  return { items, pageInfo, loading, error, loadMore, refetch };
}
