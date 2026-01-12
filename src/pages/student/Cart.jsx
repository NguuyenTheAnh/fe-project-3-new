import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import useFileUrl from "@/hooks/useFileUrl";
import { checkoutCart, payOrderVnpay } from "@/services/order.service";

const formatMoney = (amountCents) => {
  if (typeof amountCents !== "number") return "-";
  return (amountCents).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
};

const CartItemRow = ({ item, onRemove }) => {
  const { url } = useFileUrl(item.thumbnail);
  const price =
    typeof item.finalPriceCents === "number"
      ? item.finalPriceCents
      : item.priceCents;

  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="h-20 w-32 overflow-hidden rounded-lg bg-slate-100">
        {url ? (
          <img
            src={url}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
            Không có ảnh
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
            {item.title || "Khóa học"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Mã khóa học: {item.courseId}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">
            {typeof price === "number" ? formatMoney(price) : "Miễn phí"}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-600 hover:text-red-700 hover:underline underline-offset-4"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Cart() {
  const navigate = useNavigate();
  const { cart, loading, error, removeItem, refreshCart } = useCart();
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const items = useMemo(() => cart?.items || [], [cart]);
  const totalAmount = cart?.totalAmountCents ?? 0;

  const handleRemove = async (item) => {
    setActionError("");
    try {
      const itemId = item.id || item.itemId || item.courseId;
      await removeItem(itemId);
    } catch (err) {
      setActionError(err?.message || "Không thể xóa khỏi giỏ hàng.");
    }
  };

  const handleCheckout = async () => {
    if (!cart?.id) return;
    setPayLoading(true);
    setActionError("");
    setActionMessage("");
    try {
      const order = await checkoutCart(cart.id);
      if (!order?.id) {
        throw new Error("Không tạo được đơn hàng.");
      }
      if (order.status === "PAID" || order.totalAmountCents === 0) {
        setActionMessage("Thanh toán thành công. Đang cập nhật khóa học.");
        await refreshCart();
        navigate("/me/learning");
        return;
      }
      const payment = await payOrderVnpay(order.id);
      const paymentUrl =
        payment?.paymentUrl || payment?.url || payment?.paymentURL;
      if (!paymentUrl) {
        throw new Error("Không lấy được đường dẫn thanh toán.");
      }
      window.location.href = paymentUrl;
    } catch (err) {
      setActionError(err?.message || "Không thể thanh toán.");
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Giỏ hàng
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {items.length} khóa học trong giỏ
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/search")}>
          Tiếp tục tìm khóa học
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {actionMessage ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Đang tải giỏ hàng...
        </div>
      ) : items.length ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="h-fit rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Tạm tính</span>
              <span className="font-medium text-slate-900">
                {formatMoney(totalAmount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Tổng cộng</span>
              <span>{formatMoney(totalAmount)}</span>
            </div>
            <Button
              className="mt-4 w-full"
              onClick={handleCheckout}
              disabled={payLoading}
            >
              {payLoading ? "Đang xử lý..." : "Thanh toán"}
            </Button>
          </div>

          <div className="space-y-4 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-2">
            {items.map((item, index) => (
              <CartItemRow
                key={`${item.courseId}-${index}`}
                item={item}
                onRemove={() => handleRemove(item)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-600">
            Giỏ hàng của bạn đang trống.
          </p>
          <Button className="mt-4" onClick={() => navigate("/search")}>
            Tìm khóa học
          </Button>
        </div>
      )}
    </div>
  );
}
