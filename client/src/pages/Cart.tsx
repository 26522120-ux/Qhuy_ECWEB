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
      <main className="mx-auto flex min-h-[55vh] max-w-7xl flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-app-green/10 text-app-green">
          <ShoppingBag size={28} />
        </span>
        <h1 className="mt-5 font-serif text-3xl text-app-green">Giỏ hàng đang trống</h1>
        <p className="mt-2 text-sm text-app-text-light">
          Hãy chọn những sản phẩm tươi ngon bạn yêu thích.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-app-green px-6 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
        >
          Khám phá sản phẩm <ArrowRight size={17} />
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="text-sm font-semibold text-app-orange">Mua sắm của bạn</p>
        <h1 className="mt-1 font-serif text-3xl text-app-green">Giỏ hàng</h1>
        <p className="mt-1 text-sm text-app-text-light">
          {items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4" aria-label="Sản phẩm trong giỏ">
          {items.map(({ product, quantity }) => (
            <article
              key={product._id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-app-border bg-white p-4 sm:flex-nowrap sm:p-5"
            >
              <Link
                to={`/products/${product._id}`}
                className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-app-cream p-2"
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
                  className="font-semibold text-app-green hover:text-app-orange"
                >
                  {getProductNameVi(product)}
                </Link>
                <p className="mt-1 text-sm text-app-text-light">
                  {formatVnd(product.price)} / {formatUnitVi(product.unit)}
                </p>
                <p className="mt-2 font-semibold text-app-green">
                  {formatVnd(product.price * quantity)}
                </p>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <div className="flex h-10 items-center rounded-lg border border-app-border">
                  <button
                    type="button"
                    aria-label={`Giảm số lượng ${getProductNameVi(product)}`}
                    onClick={() => setQuantity(product._id, quantity - 1)}
                    className="flex h-full w-9 items-center justify-center text-app-green"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="min-w-7 text-center text-sm font-medium">{quantity}</span>
                  <button
                    type="button"
                    aria-label={`Tăng số lượng ${getProductNameVi(product)}`}
                    onClick={() => setQuantity(product._id, quantity + 1)}
                    className="flex h-full w-9 items-center justify-center text-app-green"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label={`Xóa ${getProductNameVi(product)} khỏi giỏ`}
                  onClick={() => removeItem(product._id)}
                  className="flex size-10 items-center justify-center rounded-lg text-app-text-light hover:bg-red-50 hover:text-app-error"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
          <Link
            to="/products"
            className="inline-flex items-center gap-2 py-2 text-sm font-medium text-app-green hover:text-app-orange"
          >
            <ArrowRight size={16} className="rotate-180" />
            Tiếp tục mua sắm
          </Link>
        </section>

        <aside className="rounded-2xl border border-app-border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-app-green">Tóm tắt đơn hàng</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4 text-app-text-light">
              <span>Tạm tính</span>
              <span className="font-medium text-app-text">{formatVndAmount(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4 text-app-text-light">
              <span>Phí giao hàng</span>
              <span className="font-medium text-app-text">
                {totals.deliveryFee === 0 ? "Miễn phí" : formatVndAmount(totals.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-app-text-light">
              <span>Thuế ({taxRate}%)</span>
              <span className="font-medium text-app-text">{formatVndAmount(totals.tax)}</span>
            </div>
            <div className="border-t border-app-border pt-4">
              <div className="flex justify-between gap-4 text-base font-bold text-app-green">
                <span>Tổng cộng</span>
                <span>{formatVndAmount(totals.total)}</span>
              </div>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-app-cream p-3 text-xs leading-5 text-app-text-light">
            Miễn phí giao hàng cho đơn từ 300.000 ₫. Thuế hiện áp dụng {taxRate}% trên tạm tính.
          </p>
          <Link
            to="/checkout"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-app-orange px-5 py-3 font-semibold text-white hover:bg-app-orange-dark"
          >
            Tiến hành thanh toán <ArrowRight size={17} />
          </Link>
        </aside>
      </div>
    </main>
  );
};

export default Cart;
