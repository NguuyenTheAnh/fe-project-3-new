import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getOrderDetail } from "@/services/order.service";

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const responseCode = searchParams.get("vnp_ResponseCode");
  const txnRef = searchParams.get("vnp_TxnRef");
  const orderId = txnRef ? Number(txnRef) : null;

  const statusMessage = useMemo(() => {
    if (!responseCode) return "Đang xử lý thanh toán.";
    if (responseCode === "00") {
      return "Thanh toán thành công (đang xác nhận).";
    }
    return "Thanh toán thất bại hoặc đã bị hủy.";
  }, [responseCode]);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await getOrderDetail(orderId);
        setOrder(data);
      } catch (err) {
        setError(err?.message || "Không thể kiểm tra trạng thái đơn hàng.");
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [orderId]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Kết quả thanh toán
        </h1>
        <p className="mt-2 text-sm text-slate-600">{statusMessage}</p>

        {loading ? (
          <div className="mt-6 text-sm text-slate-500">
            Đang kiểm tra đơn hàng...
          </div>
        ) : error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : order ? (
          <div className="mt-6 space-y-2 text-sm text-slate-700">
            <div>
              <span className="font-medium text-slate-900">Mã đơn hàng: </span>
              {order.id}
            </div>
            <div>
              <span className="font-medium text-slate-900">Trạng thái: </span>
              {order.status || "-"}
            </div>
            <div>
              <span className="font-medium text-slate-900">Tổng tiền: </span>
              {(order.totalAmountCents).toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6 text-sm text-slate-600">
            Không tìm thấy thông tin đơn hàng.
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/cart">Quay lại giỏ hàng</Link>
          </Button>
          <Button asChild>
            <Link to="/me/learning">Vào khóa học của tôi</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
