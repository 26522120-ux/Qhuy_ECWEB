import type { DemoOrder } from "../../context/StoreContext";
import { formatVndAmount } from "../../localization";

export const ORDER_STATUS_OPTIONS: Array<DemoOrder["status"]> = [
  "Chờ xử lý",
  "Đang giao",
  "Đã giao",
  "Đã hủy",
];

export function FormField({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  max?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-bold tracking-wider text-zinc-300 uppercase">
      {label}
      <input
        type={type}
        min={min}
        max={max}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xs border border-zinc-700 bg-[#0b0d0c] px-3 py-2.5 text-sm font-normal text-white outline-none focus:border-[#b8f927]"
      />
    </label>
  );
}

export function OrdersTable({
  orders,
  onStatusChange,
  compact = false,
}: {
  orders: DemoOrder[];
  onStatusChange: (orderId: string, status: DemoOrder["status"]) => void;
  compact?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xs border border-zinc-800 bg-[#111513] ${
        compact ? "mt-5" : ""
      }`}
    >
      <div className="border-b border-zinc-800 p-5">
        <h2 className="font-display text-xl font-bold tracking-wide text-white uppercase">
          {compact ? "Đơn hàng gần đây" : "Tất cả đơn hàng"}
        </h2>
      </div>
      {orders.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-zinc-400">
          Chưa có đơn hàng. Đơn hoàn tất thanh toán OTP hoặc COD sẽ xuất hiện
          tại đây.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-[#0b0d0c] text-xs text-zinc-400 uppercase">
              <tr>
                <th className="px-5 py-3.5 font-bold">Mã đơn</th>
                <th className="px-5 py-3.5 font-bold">Khách hàng</th>
                <th className="px-5 py-3.5 font-bold">Sản phẩm</th>
                <th className="px-5 py-3.5 font-bold">Tổng tiền</th>
                <th className="px-5 py-3.5 font-bold">Trạng thái</th>
                <th className="px-5 py-3.5 font-bold">Ngày đặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="transition hover:bg-zinc-900/50"
                >
                  <td className="px-5 py-4 font-mono font-bold whitespace-nowrap text-[#b8f927]">
                    {order.id}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-zinc-400">{order.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-zinc-400">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    sản phẩm
                  </td>
                  <td className="px-5 py-4 font-display text-base font-bold whitespace-nowrap text-white">
                    {formatVndAmount(order.total)}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      aria-label={`Trạng thái đơn ${order.id}`}
                      value={order.status}
                      onChange={(event) =>
                        onStatusChange(
                          order.id,
                          event.target.value as DemoOrder["status"],
                        )
                      }
                      className="rounded-xs border border-zinc-700 bg-[#0b0d0c] px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-[#b8f927]"
                    >
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-zinc-400">
                    {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
