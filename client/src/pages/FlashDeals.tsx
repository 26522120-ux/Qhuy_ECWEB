import { ArrowRight, Flame, Home, Star, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { formatUnitVi, formatVnd, getCategoryNameVi, getProductNameVi } from "../localization";
import { useStore } from "../context/StoreContext";

const FlashDeals = () => {
  const { products, currentUser } = useStore();
  const isAdmin = Boolean(currentUser?.isAdmin);
  const discountedProducts = products
    .filter((product) => product.discount > 0 && product.originalPrice > product.price)
    .sort((first, second) => second.discount - first.discount);
  return (
    <>
      <section className="bg-gradient-to-r from-[#0f5132] via-[#15803d] to-[#ca8a04] px-4 py-10 text-center text-white sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/20 px-4 py-1.5 text-sm font-medium text-amber-100 backdrop-blur-xs">
            <Flame size={17} className="text-amber-300" />
            Ưu đãi xanh tại POPPIN MART
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
            Săn ưu đãi <span className="text-amber-300">tươi sạch</span> mỗi ngày
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-emerald-50/90 sm:text-base">
            Khám phá các sản phẩm đang giảm giá tại POPPIN MART. Chọn món yêu thích và mua sắm ngay hôm nay!
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <nav aria-label="Điều hướng" className="mb-6 flex items-center gap-2 text-sm text-app-text-light">
          <Link to="/" aria-label="Trang chủ" className="hover:text-app-green">
            <Home size={15} />
          </Link>
          <span>/</span>
          <span className="font-medium text-app-green">Ưu đãi</span>
        </nav>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-app-orange">
              <Tag size={16} />
              Giá tốt cho bạn
            </p>
            <h2 className="mt-1 font-serif text-2xl text-app-green sm:text-3xl">
              Sản phẩm đang giảm giá
            </h2>
          </div>
          <span className="text-sm text-app-text-light">
            {discountedProducts.length} sản phẩm ưu đãi
          </span>
        </div>

        {discountedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {discountedProducts.map((product) => (
              <article
                key={product._id}
                className="group relative overflow-hidden rounded-2xl border border-app-border bg-white transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="absolute left-3 top-3 z-10 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-extrabold text-[#0f5132] shadow-2xs ring-1 ring-amber-300">
                  Giảm {product.discount}%
                </span>
                {isAdmin && (
                  <span
                    className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      product.stock <= 0
                        ? "bg-red-600 text-white"
                        : product.stock <= 10
                          ? "bg-amber-500 text-white"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {product.stock <= 0
                      ? "Hết hàng"
                      : product.stock <= 10
                        ? `Sắp hết (${product.stock})`
                        : `Kho: ${product.stock}`}
                  </span>
                )}

                <Link to={`/products/${product._id}`} className="block">
                  <div className="flex aspect-square items-center justify-center bg-white p-5 sm:p-6">
                    <img
                      src={product.image}
                      alt={getProductNameVi(product)}
                      loading="lazy"
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="px-3 pb-4 sm:px-4">
                    <p className="mb-1 text-xs text-app-text-light">
                      {getCategoryNameVi(product.category)}
                    </p>
                    <h3 className="min-h-10 text-sm font-medium leading-5 text-app-text">
                      {getProductNameVi(product)}
                    </h3>
                    <div className="mt-2 flex items-center gap-1 text-xs">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span className="font-medium text-app-text">{product.rating}</span>
                      <span className="text-app-text-light">({product.reviewCount} đánh giá)</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-semibold text-app-green">{formatVnd(product.price)}</span>
                      <span className="text-xs text-app-text-light">/{formatUnitVi(product.unit)}</span>
                      <span className="text-xs text-app-text-light line-through">
                        {formatVnd(product.originalPrice)}
                      </span>
                    </div>
                  </div>
                </Link>

                <Link
                  to={`/products/${product._id}`}
                  aria-label={`Xem ${getProductNameVi(product)}`}
                  className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-app-orange text-white shadow-sm hover:bg-app-orange-dark"
                >
                  <ArrowRight size={16} />
                </Link>
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
