import { useEffect, useState } from "react";
import { ArrowRight, PackageCheck, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getMyOrders } from "../api";
import type { DemoOrder } from "../context/StoreContext";
import { formatVndAmount } from "../localization";

const MyOrder = () => {
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getMyOrders()
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Không thể tải danh sách đơn hàng.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-[65vh] bg-[#0b0d0c] px-4 py-16 text-center text-sm text-zinc-400">
        Đang tải đơn hàng của bạn từ CSDL Neon...
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="min-h-[65vh] bg-[#0b0d0c] text-white">
        <div className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-xs border border-[#b8f927]/30 bg-[#b8f927]/10 text-[#b8f927]">
            <ShoppingBag size={28} />
          </span>
          <p className="mt-5 text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
            // ĐƠN HÀNG nutraGO
          </p>
          <h1 className="mt-2 font-display text-3xl font-black text-white uppercase sm:text-4xl">
            Bạn chưa có đơn hàng nào
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Các đơn hàng sau khi xác thực thanh toán OTP sẽ tự động lưu tại đây.
          </p>
          <Link
            to="/products"
            className="mt-6 rounded-xs bg-[#b8f927] px-6 py-3 text-xs font-black tracking-wider text-[#08100a] uppercase hover:bg-[#cbff4d]"
          >
            Mua sắm ngay
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0d0c] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3.5 border-b border-white/10 pb-6">
          <span className="flex size-11 items-center justify-center rounded-xs border border-[#b8f927]/35 bg-[#b8f927]/10 text-[#b8f927]">
            <PackageCheck size={22} />
          </span>
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
              // LỊCH SỬ MUA SẮM
            </p>
            <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-white uppercase sm:text-4xl">
              Đơn hàng của tôi
            </h1>
            <p className="text-xs text-zinc-400">
              Đồng bộ trực tiếp từ CSDL Neon ({orders.length} đơn hàng)
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-xs border border-white/10 bg-[#111513] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
                <div>
                  <p className="font-mono text-sm font-bold text-[#b8f927]">
                    Mã đơn: {order.orderCode ?? order.id}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Ngày đặt: {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-xs border border-[#b8f927]/30 bg-[#b8f927]/10 px-3 py-1 text-xs font-bold text-[#b8f927]">
                    {order.status}
                  </span>
                  <span className="font-display text-lg font-black text-white">
                    {formatVndAmount(order.total)}
                  </span>
                </div>
              </div>

              <div className="mt-3.5 space-y-2">
                {order.items.map((item, idx) => (
                  <div
                    key={`${item.productId}-${idx}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="break-words text-zinc-200">
                      {item.name} × <strong className="text-white">{item.quantity}</strong>
                    </span>
                    <span className="shrink-0 font-semibold text-[#b8f927]">
                      {formatVndAmount(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end border-t border-white/10 pt-3">
                <Link
                  to={`/orders/${encodeURIComponent(order.id)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#b8f927] uppercase hover:underline"
                >
                  Theo dõi tiến trình đơn hàng
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};

export default MyOrder;
