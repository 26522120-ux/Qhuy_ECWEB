import { useEffect, useState } from "react";
import { PackageCheck, ShoppingBag } from "lucide-react";
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
          toast.error(error instanceof Error ? error.message : "Không thể tải danh sách đơn hàng.");
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
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-app-text-light">
        Đang tải đơn hàng của bạn từ CSDL Neon...
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-app-green/10 text-app-green">
          <ShoppingBag size={28} />
        </span>
        <h1 className="mt-5 font-serif text-3xl text-app-green">Bạn chưa có đơn hàng nào</h1>
        <p className="mt-2 text-sm text-app-text-light">
          Các đơn hàng sau khi xác thực thanh toán OTP sẽ tự động lưu tại đây.
        </p>
        <Link
          to="/products"
          className="mt-6 rounded-full bg-app-green px-6 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
        >
          Mua sắm ngay
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-app-green/10 text-app-green">
          <PackageCheck size={20} />
        </span>
        <div>
          <h1 className="font-serif text-3xl text-app-green">Đơn hàng của tôi</h1>
          <p className="text-sm text-app-text-light">
            Đồng bộ trực tiếp từ CSDL Neon ({orders.length} đơn hàng)
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-2xl border border-app-border bg-white p-5 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border pb-3">
              <div>
                <p className="font-mono text-sm font-bold text-app-green">Mã đơn: {order.id}</p>
                <p className="text-xs text-app-text-light">
                  Ngày đặt: {new Date(order.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-app-cream px-3 py-1 text-xs font-semibold text-app-green">
                  {order.status}
                </span>
                <span className="text-base font-bold text-app-green">
                  {formatVndAmount(order.total)}
                </span>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {order.items.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="flex items-center justify-between text-sm">
                  <span className="text-app-text">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-app-green">
                    {formatVndAmount(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
};

export default MyOrder;
