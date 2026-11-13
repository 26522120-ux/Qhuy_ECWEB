import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import { formatUnitVi, formatVnd, formatVndAmount, getProductNameVi } from "../localization";

const Cart = () => {
  const { items, totals, setQuantity, removeItem } = useCart();
  const { taxRate } = useStore();

  if (items.length === 0) {
    return (
      <main className="min-h-[65vh] bg-[#0b0d0c] text-white">
        <div className="mx-auto flex min-h-[65vh] max-w-7xl flex-col items-center justify-center px-4 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-xs border border-[#b8f927]/30 bg-[#b8f927]/10 text-[#b8f927]">
            <ShoppingBag size={28} />
          </span>
          <p className="mt-5 text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
            // GIỎ HÀNG nutraGO
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-white uppercase sm:text-4xl">
            Giỏ hàng đang trống
          </h1>
          <p className="mt-2 max-w-md text-sm text-zinc-400">
            Hãy chọn thực phẩm bổ sung hoặc bữa ăn dinh dưỡng phù hợp với mục tiêu tập luyện của bạn.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xs bg-[#b8f927] px-6 py-3 text-xs font-black tracking-wider text-[#08100a] uppercase hover:bg-[#cbff4d]"
          >
            Khám phá sản phẩm <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="min-h-screen bg-[#0b0d0c] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
              // MUA SẮM CỦA BẠN
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-white uppercase sm:text-5xl">
              GIỎ HÀNG
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {totalQuantity} sản phẩm đang chờ thanh toán
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-xs border border-white/15 bg-[#111513] px-4 py-2.5 text-xs font-bold tracking-wider text-zinc-200 uppercase hover:border-[#b8f927]/50 hover:text-[#b8f927]"
          >
            <ArrowRight size={15} className="rotate-180" />
            Tiếp tục mua sắm
          </Link>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-4" aria-label="Sản phẩm trong giỏ">
            {items.map(({ product, quantity }) => (
              <article
                key={product._id}
                className="flex flex-wrap items-center gap-4 rounded-xs border border-white/10 bg-[#111513] p-4 transition-colors hover:border-white/20 sm:flex-nowrap sm:p-5"
              >
                <Link
                  to={`/products/${product._id}`}
                  className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-white/10 bg-[#181d1a] p-2"
                >
                  <img
                    src={product.image}
                    alt={getProductNameVi(product)}
                    className="h-full w-full object-contain"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/products/${product._id}`}
                    className="font-display text-lg font-bold tracking-wide text-white uppercase hover:text-[#b8f927]"
                  >
                    {getProductNameVi(product)}
                  </Link>
                  <p className="mt-1 text-sm text-zinc-400">
                    {formatVnd(product.price)} / {formatUnitVi(product.unit)}
                  </p>
                  <p className="mt-2 font-display text-lg font-extrabold text-[#b8f927]">
                    {formatVnd(product.price * quantity)}
                  </p>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <div className="flex h-10 items-center rounded-xs border border-white/15 bg-[#0b0d0c]">
                    <button
                      type="button"
                      aria-label={`Giảm số lượng ${getProductNameVi(product)}`}
                      onClick={() => setQuantity(product._id, quantity - 1)}
                      className="flex h-full w-9 items-center justify-center text-zinc-300 hover:bg-white/5 hover:text-[#b8f927]"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="min-w-8 text-center text-sm font-bold text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Tăng số lượng ${getProductNameVi(product)}`}
                      onClick={() => setQuantity(product._id, quantity + 1)}
                      className="flex h-full w-9 items-center justify-center text-zinc-300 hover:bg-white/5 hover:text-[#b8f927]"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label={`Xóa ${getProductNameVi(product)} khỏi giỏ`}
                    onClick={() => removeItem(product._id)}
                    className="flex size-10 items-center justify-center rounded-xs border border-white/10 bg-[#0b0d0c] text-zinc-400 hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-400"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className="rounded-xs border border-white/10 bg-[#111513] p-5 sm:p-6">
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#b8f927] uppercase">
              // THANH TOÁN
            </p>
            <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-white uppercase">
              Tóm tắt đơn hàng
            </h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 text-zinc-400">
                <span>Tạm tính</span>
                <span className="font-semibold text-white">
                  {formatVndAmount(totals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-zinc-400">
                <span>Phí giao hàng</span>
                <span className="font-semibold text-white">
                  {totals.deliveryFee === 0 ? "Miễn phí" : formatVndAmount(totals.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-zinc-400">
                <span>Thuế ({taxRate}%)</span>
                <span className="font-semibold text-white">
                  {formatVndAmount(totals.tax)}
                </span>
              </div>
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-lg font-bold tracking-wide text-white uppercase">
                    Tổng cộng
                  </span>
                  <span className="font-display text-2xl font-black text-[#b8f927]">
                    {formatVndAmount(totals.total)}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-4 rounded-xs border border-[#b8f927]/20 bg-[#b8f927]/5 p-3 text-xs leading-5 text-zinc-300">
              Miễn phí giao hàng cho đơn từ 300.000 ₫. Thuế hiện áp dụng {taxRate}% trên tạm tính.
            </p>
            <Link
              to="/checkout"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xs bg-[#b8f927] px-5 py-3.5 text-xs font-black tracking-wider text-[#08100a] uppercase hover:bg-[#cbff4d]"
            >
              Tiến hành thanh toán <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Cart;
