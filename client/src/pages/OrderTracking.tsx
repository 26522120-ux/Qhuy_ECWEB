import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, PackageCheck, Truck, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getMyOrders } from "../api";
import type { DemoOrder } from "../context/StoreContext";
import { formatVndAmount } from "../localization";

const STEPS: Array<DemoOrder["status"]> = ["Chờ xử lý", "Đang giao", "Đã giao"];

const OrderTracking = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getMyOrders()
      .then((orders) => {
        if (!active) return;
        const found =
          orders.find((item) => item.id === id || item.orderCode === id) ?? null;
        setOrder(found);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <main className="min-h-[65vh] bg-[#0b0d0c] px-4 py-16 text-center text-sm text-zinc-400">
        Đang tải chi tiết tiến trình đơn hàng...
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-[65vh] bg-[#0b0d0c] text-white">
        <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-black text-white uppercase">
            Không tìm thấy đơn hàng
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Mã đơn hàng không tồn tại hoặc không thuộc tài khoản của bạn.
          </p>
          <Link
            to="/orders"
            className="mt-6 rounded-xs bg-[#b8f927] px-6 py-3 text-xs font-black tracking-wider text-black uppercase hover:bg-[#cbff4d]"
          >
            Quay lại Đơn hàng của tôi
          </Link>
        </div>
      </main>
    );
  }

  const currentStepIdx = STEPS.indexOf(order.status);

  return (
    <main className="min-h-screen bg-[#0b0d0c] text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/orders"
          className="mb-5 inline-flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-400 uppercase hover:text-[#b8f927]"
        >
          <ArrowLeft size={15} />
          Quay lại danh sách đơn hàng
        </Link>

        <div className="rounded-xs border border-white/10 bg-[#111513] p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
                // THEO DÕI ĐƠN HÀNG nutraGO
              </p>
              <h1 className="mt-1 font-display text-2xl font-black text-white uppercase sm:text-3xl">
                Mã đơn: {order.orderCode ?? order.id}
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Đặt lúc: {new Date(order.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <span className="rounded-xs border border-[#b8f927]/35 bg-[#b8f927]/10 px-3.5 py-1.5 text-xs font-extrabold text-[#b8f927] uppercase">
              {order.status}
            </span>
          </div>

          {order.status === "Đã hủy" ? (
            <div className="mt-6 flex items-center gap-3 rounded-xs border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              <XCircle size={20} className="shrink-0 text-red-400" />
              <span>Đơn hàng này đã bị hủy.</span>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-4">
              {STEPS.map((label, idx) => {
                const isCompleted = currentStepIdx >= idx;
                return (
                  <div
                    key={label}
                    className={`rounded-xs border p-3.5 text-center ${
                      isCompleted
                        ? "border-[#b8f927] bg-[#b8f927]/12 text-white"
                        : "border-white/10 bg-[#0b0d0c] text-zinc-500"
                    }`}
                  >
                    <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-black/40">
                      {idx === 0 && <Clock3 size={16} className={isCompleted ? "text-[#b8f927]" : ""} />}
                      {idx === 1 && <Truck size={16} className={isCompleted ? "text-[#b8f927]" : ""} />}
                      {idx === 2 && <CheckCircle2 size={16} className={isCompleted ? "text-[#b8f927]" : ""} />}
                    </div>
                    <p className="mt-2 text-xs font-extrabold uppercase">{label}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 border-t border-white/10 pt-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-black text-white uppercase">
              <PackageCheck size={18} className="text-[#b8f927]" />
              Chi tiết sản phẩm ({order.items.length})
            </h2>
            <div className="mt-3 space-y-2.5">
              {order.items.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="flex items-center justify-between gap-3 rounded-xs border border-white/10 bg-[#0b0d0c] px-4 py-3 text-sm"
                >
                  <span className="break-words text-zinc-200">
                    {item.name} × <strong className="text-white">{item.quantity}</strong>
                  </span>
                  <span className="shrink-0 font-bold text-[#b8f927]">
                    {formatVndAmount(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-baseline justify-between border-t border-white/10 pt-4">
              <span className="font-display text-lg font-bold text-white uppercase">
                Tổng thanh toán
              </span>
              <span className="font-display text-2xl font-black text-[#b8f927]">
                {formatVndAmount(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default OrderTracking;
