import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Home,
  Minus,
  Plus,
  ShoppingCart,
  Star,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import DummyReviewsSection from "../assets/DummyReviewsSection";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import {
  formatUnitVi,
  formatVnd,
  getCategoryNameVi,
  getProductDescriptionVi,
  getProductNameVi,
} from "../localization";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const { products, currentUser } = useStore();
  const isAdmin = Boolean(currentUser?.isAdmin);
  const product = products.find((item) => item._id === id);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  if (!product) {
    return <Navigate to="/products" replace />;
  }

  const sameCategoryProducts = products.filter(
    (item) => item._id !== product._id && item.category === product.category,
  );
  const relatedProducts = [
    ...sameCategoryProducts,
    ...products.filter(
      (item) => item._id !== product._id && item.category !== product.category,
    ),
  ].slice(0, 4);

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  return (
    <div className="min-h-screen bg-[#0b0d0c] text-white">
      <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-3.5 pb-14 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:px-8">
        <nav
          aria-label="Điều hướng"
          className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400 sm:gap-2 sm:text-sm"
        >
          <Link to="/" aria-label="Trang chủ" className="hover:text-[#b8f927]">
            <Home size={15} />
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-[#b8f927]">
            Sản phẩm
          </Link>
          <span>/</span>
          <Link
            to={`/products?category=${product.category}`}
            className="hover:text-[#b8f927]"
          >
            {getCategoryNameVi(product.category)}
          </Link>
          <span>/</span>
          <span className="truncate font-semibold text-[#b8f927]">
            {getProductNameVi(product)}
          </span>
        </nav>

        <Link
          to="/products"
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-[#b8f927] sm:text-sm"
        >
          <ArrowLeft size={16} />
          Quay lại kho sản phẩm
        </Link>

        <section className="grid overflow-hidden rounded-xs border border-zinc-800 bg-[#121614] md:grid-cols-2">
          <div className="relative flex min-h-64 items-center justify-center bg-white p-6 sm:min-h-80 sm:p-12 md:min-h-[460px]">
            {product.discount > 0 && (
              <span className="absolute left-4 top-4 rounded-xs bg-[#b8f927] px-3 py-1 text-xs font-black text-black sm:left-5 sm:top-5">
                GIẢM {product.discount}%
              </span>
            )}
            <img
              src={product.image}
              alt={getProductNameVi(product)}
              className="max-h-64 w-full object-contain sm:max-h-[380px]"
            />
          </div>

          <div className="flex flex-col justify-center p-5 sm:p-10">
            <Link
              to={`/products?category=${product.category}`}
              className="text-xs font-bold tracking-wider text-[#b8f927] uppercase hover:underline"
            >
              {getCategoryNameVi(product.category)}
            </Link>
            <h1 className="mt-2 font-display text-2xl font-black text-white uppercase sm:text-4xl">
              {getProductNameVi(product)}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div
                className="flex items-center gap-0.5"
                aria-label={`Đánh giá ${product.rating} trên 5 sao`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    size={16}
                    className={
                      index < Math.round(product.rating)
                        ? "fill-[#b8f927] text-[#b8f927]"
                        : "text-zinc-700"
                    }
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-white">
                {product.rating}
              </span>
              <a
                href="#danh-gia"
                className="text-sm text-zinc-400 underline underline-offset-2 hover:text-[#b8f927]"
              >
                ({product.reviewCount} đánh giá)
              </a>
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl font-black text-[#b8f927] sm:text-4xl">
                {formatVnd(product.price)}
              </span>
              <span className="text-sm text-zinc-400">
                /{formatUnitVi(product.unit)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-base text-zinc-500 line-through">
                  {formatVnd(product.originalPrice)}
                </span>
              )}
            </div>

            <p className="mt-5 text-sm leading-7 text-zinc-300">
              {getProductDescriptionVi(product)}
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm">
              {product.stock > 0 ? (
                <>
                  <Check size={17} className="text-[#b8f927]" />
                  <span className="font-semibold text-[#b8f927]">
                    {isAdmin ? `Còn hàng (${product.stock} sản phẩm)` : "Còn hàng"}
                  </span>
                </>
              ) : (
                <span className="font-semibold text-red-400">Tạm hết hàng</span>
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <div className="flex h-12 items-center rounded-xs border border-zinc-700 bg-[#0b0d0c]">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  disabled={quantity <= 1}
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                  className="flex h-full w-11 items-center justify-center text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-9 text-center text-sm font-bold text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  disabled={quantity >= product.stock}
                  onClick={() =>
                    setQuantity((current) =>
                      Math.min(product.stock, current + 1),
                    )
                  }
                  className="flex h-full w-11 items-center justify-center text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={handleAddToCart}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xs bg-[#b8f927] px-6 py-3 text-sm font-extrabold text-black uppercase transition hover:bg-[#c8ff47] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart size={18} />
                Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </section>

        <div id="danh-gia" className="mt-10 rounded-xs bg-white p-4 text-app-text sm:p-6">
          <DummyReviewsSection product={product} />
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-wider text-[#b8f927] uppercase">
                  Cùng danh mục: {getCategoryNameVi(product.category)}
                </p>
                <h2 className="mt-1 font-display text-2xl font-black text-white uppercase sm:text-3xl">
                  Sản phẩm liên quan
                </h2>
              </div>
              <Link
                to={`/products?category=${product.category}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#b8f927] uppercase hover:underline sm:text-sm"
              >
                Xem tất cả <ArrowLeft size={15} className="rotate-180" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct._id}
                  to={`/products/${relatedProduct._id}`}
                  className="group overflow-hidden rounded-xs border border-zinc-800 bg-[#121614] transition hover:-translate-y-1 hover:border-[#b8f927]"
                >
                  <div className="flex aspect-square items-center justify-center bg-white p-4">
                    <img
                      src={relatedProduct.image}
                      alt={getProductNameVi(relatedProduct)}
                      loading="lazy"
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3.5">
                    <h3 className="line-clamp-2 min-h-10 text-xs font-bold text-white group-hover:text-[#b8f927] sm:text-sm">
                      {getProductNameVi(relatedProduct)}
                    </h3>
                    <p className="mt-2 font-display text-base font-extrabold text-[#b8f927]">
                      {formatVnd(relatedProduct.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ProductPage;
