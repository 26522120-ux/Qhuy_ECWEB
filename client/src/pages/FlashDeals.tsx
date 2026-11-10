import { Flame, Home, Plus, Star, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import { formatUnitVi, formatVnd, getCategoryNameVi, getProductNameVi } from "../localization";

const FlashDeals = () => {
  const { products, currentUser } = useStore();
  const { addItem } = useCart();
  const isAdmin = Boolean(currentUser?.isAdmin);
  const discountedProducts = products
    .filter((product) => product.discount > 0 && product.originalPrice > product.price)
    .sort((first, second) => second.discount - first.discount);

  return (
    <>
      <section className="bg-gradient-to-r from-[#0f5132] via-[#15803d] to-[#ca8a04] px-4 py-8 text-center text-white sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/20 px-3.5 py-1 text-xs font-medium text-amber-100 backdrop-blur-xs sm:px-4 sm:py-1.5 sm:text-sm">
            <Flame size={15} className="text-amber-300" />
            Ưu đãi xanh tại POPPIN MART
          </div>
          <h1 className="mt-3 font-serif text-2xl font-bold sm:mt-4 sm:text-4xl">
            Săn ưu đãi <span className="text-amber-300">tươi sạch</span> mỗi ngày
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-emerald-50/90 sm:mt-3 sm:text-base sm:leading-6">
            Khám phá các sản phẩm đang giảm giá tại POPPIN MART. Chọn món yêu thích và mua sắm ngay hôm nay!
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-3.5 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-6 lg:px-8">
        <nav
          aria-label="Điều hướng"
          className="mb-4 flex items-center gap-2 text-xs text-app-text-light sm:mb-6 sm:text-sm"
        >
          <Link to="/" aria-label="Trang chủ" className="hover:text-app-green">
            <Home size={14} />
          </Link>
          <span>/</span>
          <span className="font-medium text-app-green">Ưu đãi</span>
        </nav>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 sm:mb-5">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-app-orange sm:text-sm">
              <Tag size={15} />
              Giá tốt cho bạn
            </p>
            <h2 className="mt-0.5 font-serif text-xl font-bold text-app-green sm:mt-1 sm:text-3xl">
              Sản phẩm đang giảm giá
            </h2>
          </div>
          <span className="text-xs text-app-text-light sm:text-sm">
            {discountedProducts.length} sản phẩm ưu đãi
          </span>
        </div>

        {discountedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {discountedProducts.map((product) => (
              <article
                key={product._id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_2px_10px_-4px_rgba(15,81,50,0.06)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
              >
                <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-[#0f5132] shadow-2xs ring-1 ring-amber-300 sm:left-3 sm:top-3 sm:px-2.5">
                  -{product.discount}%
                </span>
                {isAdmin && (
                  <span
                    className={`absolute right-2.5 top-2.5 z-10 rounded-full px-2 py-0.5 text-[9px] font-semibold sm:right-3 sm:top-3 sm:px-2.5 sm:text-[10px] ${
                      product.stock <= 0
                        ? "bg-red-600 text-white"
                        : product.stock <= 10
                          ? "bg-amber-500 text-white"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-800"
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
                  <div className="flex aspect-square items-center justify-center bg-[#f6fcf8] p-3.5 sm:p-6">
                    <img
                      src={product.image}
                      alt={getProductNameVi(product)}
                      loading="lazy"
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="px-3 pt-2.5 pb-1 sm:px-4 sm:pt-3">
                    <p className="truncate text-[11px] font-medium text-emerald-700/75 sm:text-xs">
                      {getCategoryNameVi(product.category)}
                    </p>
                    <h3 className="mt-0.5 line-clamp-2 min-h-9 text-xs font-semibold leading-4.5 text-app-text sm:min-h-10 sm:text-sm sm:leading-5">
                      {getProductNameVi(product)}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-[11px] sm:text-xs">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="font-medium text-app-text">{product.rating}</span>
                      <span className="text-app-text-light">({product.reviewCount})</span>
                    </div>
                  </div>
                </Link>

                <div className="mt-2 flex items-end justify-between gap-2 px-3 pb-3 sm:px-4 sm:pb-3.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-1">
                      <span className="text-sm font-bold text-[#0f5132] sm:text-base">
                        {formatVnd(product.price)}
                      </span>
                      <span className="truncate text-[10px] text-app-text-light sm:text-xs">
                        /{formatUnitVi(product.unit)}
                      </span>
                    </div>
                    <span className="block text-[10px] text-app-text-light line-through sm:text-xs">
                      {formatVnd(product.originalPrice)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={product.stock <= 0}
                    onClick={() => addItem(product, 1)}
                    aria-label={`Thêm ${getProductNameVi(product)} vào giỏ`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#0f5132] to-[#16a34a] text-white shadow-xs transition hover:scale-105 disabled:opacity-40 sm:size-9"
                  >
                    <Plus size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-app-border bg-white px-6 py-16 text-center">
            <h2 className="font-semibold text-app-green">Hiện chưa có sản phẩm giảm giá</h2>
            <p className="mt-2 text-sm text-app-text-light">
              Hãy quay lại sau để xem các ưu đãi mới nhé.
            </p>
            <Link
              to="/products"
              className="mt-5 inline-flex rounded-full bg-app-green px-5 py-2.5 text-sm font-medium text-white hover:bg-app-green-light"
            >
              Xem tất cả sản phẩm
            </Link>
          </div>
        )}
      </main>
    </>
  );
};

export default FlashDeals;
