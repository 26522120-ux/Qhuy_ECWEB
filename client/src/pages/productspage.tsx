import { useState } from "react";
import { ArrowLeft, Check, Home, Minus, Plus, ShoppingCart, Star } from "lucide-react";
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
  ].slice(0, 5);

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-3.5 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-6 lg:px-8">
      <nav aria-label="Điều hướng" className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-app-text-light sm:mb-5 sm:gap-2 sm:text-sm">
        <Link to="/" aria-label="Trang chủ" className="hover:text-app-green">
          <Home size={15} />
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-app-green">
          Sản phẩm
        </Link>
        <span>/</span>
        <Link
          to={`/products?category=${product.category}`}
          className="hover:text-app-green"
        >
          {getCategoryNameVi(product.category)}
        </Link>
        <span>/</span>
        <span className="truncate font-medium text-app-green">{getProductNameVi(product)}</span>
      </nav>

      <Link
        to="/products"
        className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-app-text-light hover:text-app-green sm:mb-5 sm:text-sm"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách
      </Link>

      <section className="grid overflow-hidden rounded-2xl border border-app-border bg-white sm:rounded-3xl md:grid-cols-2">
        <div className="relative flex min-h-60 items-center justify-center bg-[#f6fcf8] p-6 sm:min-h-72 sm:p-12 md:min-h-[440px]">
          {product.discount > 0 && (
            <span className="absolute left-4 top-4 rounded-full bg-amber-400 px-3 py-1 text-xs font-extrabold text-[#0f5132] shadow-2xs ring-1 ring-amber-300 sm:left-5 sm:top-5 sm:py-1.5">
              Giảm {product.discount}%
            </span>
          )}
          <img
            src={product.image}
            alt={getProductNameVi(product)}
            className="max-h-64 w-full object-contain sm:max-h-[360px]"
          />
        </div>

        <div className="flex flex-col justify-center p-5 sm:p-10">
          <Link
            to={`/products?category=${product.category}`}
            className="text-xs font-semibold text-[#16a34a] hover:text-app-green sm:text-sm"
          >
            {getCategoryNameVi(product.category)}
          </Link>
          <h1 className="mt-1.5 font-serif text-2xl font-bold text-app-green sm:mt-2 sm:text-4xl">
            {getProductNameVi(product)}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5" aria-label={`Đánh giá ${product.rating} trên 5 sao`}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  size={17}
                  className={
                    index < Math.round(product.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-app-border"
                  }
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-app-green">{product.rating}</span>
            <a href="#danh-gia" className="text-sm text-app-text-light underline underline-offset-2">
              ({product.reviewCount} đánh giá)
            </a>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-app-green">{formatVnd(product.price)}</span>
            <span className="text-sm text-app-text-light">/{formatUnitVi(product.unit)}</span>
            {product.originalPrice > product.price && (
              <span className="text-base text-app-text-light line-through">
                {formatVnd(product.originalPrice)}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm leading-7 text-app-text-light">
            {getProductDescriptionVi(product)}
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm">
            {product.stock > 0 ? (
              <>
                <Check size={17} className="text-app-success" />
                <span className="font-medium text-app-success">
                  {isAdmin ? `Còn hàng (${product.stock} sản phẩm)` : "Còn hàng"}
                </span>
              </>
            ) : (
              <span className="font-medium text-app-error">Tạm hết hàng</span>
            )}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <div className="flex h-12 items-center rounded-xl border border-app-border">
              <button
                type="button"
                aria-label="Giảm số lượng"
                disabled={quantity <= 1}
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                className="flex h-full w-11 items-center justify-center text-app-green disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={16} />
              </button>
              <span className="min-w-8 text-center text-sm font-semibold">{quantity}</span>
              <button
                type="button"
                aria-label="Tăng số lượng"
                disabled={quantity >= product.stock}
                onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))}
                className="flex h-full w-11 items-center justify-center text-app-green disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-app-orange px-6 py-3 text-sm font-semibold text-white hover:bg-app-orange-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart size={18} />
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </section>

      <div id="danh-gia">
        <DummyReviewsSection product={product} />
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-app-text-light">
                Cùng danh mục: {getCategoryNameVi(product.category)}
              </p>
              <h2 className="mt-1 font-serif text-2xl text-app-green">Sản phẩm liên quan</h2>
            </div>
            <Link
              to={`/products?category=${product.category}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-app-orange hover:text-app-orange-dark"
            >
              Xem tất cả <ArrowLeft size={15} className="rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct._id}
                to={`/products/${relatedProduct._id}`}
                className="overflow-hidden rounded-2xl border border-app-border bg-white transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex aspect-square items-center justify-center p-4">
                  <img
                    src={relatedProduct.image}
                    alt={getProductNameVi(relatedProduct)}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 min-h-10 text-sm font-medium text-app-green">
                    {getProductNameVi(relatedProduct)}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-app-green">
                    {formatVnd(relatedProduct.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductPage;
