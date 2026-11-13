import { Flame, Home, Plus, Star, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import {
  formatUnitVi,
  formatVnd,
  getCategoryNameVi,
  getProductNameVi,
} from "../localization";

const FlashDeals = () => {
  const { products, currentUser } = useStore();
  const { addItem } = useCart();
  const isAdmin = Boolean(currentUser?.isAdmin);
  const discountedProducts = products
    .filter(
      (product) =>
        product.discount > 0 && product.originalPrice > product.price,
    )
    .sort((first, second) => second.discount - first.discount);

  return (
    <div className="min-h-screen bg-[#0b0d0c] text-white">
      <section className="border-b border-white/10 bg-gradient-to-r from-[#0e1311] via-[#131b16] to-[#0e1311] px-4 py-10 text-center sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-xs border border-[#b8f927]/40 bg-[#b8f927]/15 px-3.5 py-1 text-xs font-bold tracking-wider text-[#b8f927] uppercase sm:px-4 sm:py-1.5">
            <Flame size={15} />
            Ưu đãi hiệu suất FORM/FWD
          </div>
          <h1 className="mt-3 font-display text-3xl font-black text-white uppercase sm:mt-4 sm:text-5xl">
            Săn ưu đãi <span className="text-[#b8f927]">Gym &amp; Supplement</span> mỗi ngày
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-zinc-300 sm:mt-3 sm:text-sm">
            Tổng hợp các sản phẩm Whey Protein, Pre-Workout, Creatine và Dụng cụ tập luyện đang có mức giảm giá tốt nhất hôm nay.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-3.5 pb-14 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:px-8">
        <nav
          aria-label="Điều hướng"
          className="mb-4 flex items-center gap-2 text-xs text-zinc-400 sm:mb-6 sm:text-sm"
        >
          <Link to="/" aria-label="Trang chủ" className="hover:text-[#b8f927]">
            <Home size={14} />
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#b8f927]">Ưu đãi hiệu suất</span>
        </nav>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#b8f927] uppercase">
              <Tag size={14} />
              Giá tốt cho vận động viên
            </p>
            <h2 className="mt-1 font-display text-2xl font-black text-white uppercase sm:text-4xl">
              Sản phẩm đang giảm giá
            </h2>
          </div>
          <span className="text-xs text-zinc-400 sm:text-sm">
            {discountedProducts.length} sản phẩm ưu đãi
          </span>
        </div>

        {discountedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {discountedProducts.map((product) => (
              <article
                key={product._id}
                className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-xs border border-zinc-800 bg-[#121614] transition hover:-translate-y-1 hover:border-[#b8f927]/75"
              >
                <span className="absolute left-2.5 top-2.5 z-10 rounded-xs bg-[#b8f927] px-2 py-0.5 text-[10px] font-black text-black shadow-xs sm:left-3 sm:top-3">
                  -{product.discount}%
                </span>
                {isAdmin && (
                  <span
                    className={`absolute right-2.5 top-2.5 z-10 rounded-xs px-2 py-0.5 text-[9px] font-bold sm:right-3 sm:top-3 sm:text-[10px] ${
                      product.stock <= 0
                        ? "bg-red-600 text-white"
                        : product.stock <= 10
                          ? "bg-amber-400 text-black"
                          : "bg-zinc-900/90 text-[#b8f927] ring-1 ring-[#b8f927]/40"
                    }`}
                  >
                    {product.stock <= 0
                      ? "Hết hàng"
                      : product.stock <= 10
                        ? `Sắp hết (${product.stock})`
                        : `Kho: ${product.stock}`}
                  </span>
                )}

                <Link to={`/products/${product._id}`} className="block flex-1">
                  <div className="flex aspect-square items-center justify-center bg-white p-4 sm:p-6">
                    <img
                      src={product.image}
                      alt={getProductNameVi(product)}
                      loading="lazy"
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3.5 pb-2">
                    <p className="truncate text-[10px] font-bold tracking-wider text-[#b8f927] uppercase">
                      {getCategoryNameVi(product.category)}
                    </p>
                    <h3 className="mt-1 line-clamp-2 min-h-9 text-xs font-bold leading-4.5 text-white group-hover:text-[#b8f927] sm:min-h-10 sm:text-sm sm:leading-5">
                      {getProductNameVi(product)}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-400">
                      <Star
                        size={12}
                        className="fill-[#b8f927] text-[#b8f927]"
                      />
                      <span className="font-semibold text-white">
                        {product.rating}
                      </span>
                      <span>({product.reviewCount})</span>
                    </div>
                  </div>
                </Link>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-800/80 px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-black text-white sm:text-lg">
                      {formatVnd(product.price)}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                      <span className="line-through">
                        {formatVnd(product.originalPrice)}
                      </span>
                      <span>• /{formatUnitVi(product.unit)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={product.stock <= 0}
                    onClick={() => addItem(product, 1)}
                    aria-label={`Thêm ${getProductNameVi(product)} vào giỏ`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-xs bg-[#b8f927] px-2.5 py-2 text-[11px] font-extrabold text-black uppercase transition hover:bg-[#c8ff47] disabled:opacity-40 sm:px-3"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Thêm</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xs border border-dashed border-zinc-700 bg-[#121614] px-6 py-16 text-center">
            <h2 className="font-display text-2xl font-bold text-white uppercase">
              Hiện chưa có sản phẩm giảm giá
            </h2>
            <Link
              to="/products"
              className="mt-5 inline-flex rounded-xs bg-[#b8f927] px-5 py-2.5 text-xs font-extrabold text-black uppercase"
            >
              Xem tất cả sản phẩm
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default FlashDeals;
