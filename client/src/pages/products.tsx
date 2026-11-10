import { useMemo, useState } from "react";
import { ChevronDown, Home, Plus, SlidersHorizontal, Star } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { categoriesData } from "../assets/assets";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import {
  formatUnitVi,
  formatVnd,
  getCategoryNameVi,
  getProductNameVi,
  INR_TO_VND,
} from "../localization";

type SortOption = "newest" | "price-low" | "price-high" | "rating";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showMobilePriceFilter, setShowMobilePriceFilter] = useState(false);
  const { products, currentUser } = useStore();
  const { addItem } = useCart();
  const isAdmin = Boolean(currentUser?.isAdmin);

  const selectedCategory = searchParams.get("category") ?? "";
  const searchQuery = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery) ||
        getProductNameVi(product).toLowerCase().includes(searchQuery) ||
        product.description.toLowerCase().includes(searchQuery);
      const priceInVnd = product.price * INR_TO_VND;
      const matchesMin = minPrice === "" || priceInVnd >= Number(minPrice);
      const matchesMax = maxPrice === "" || priceInVnd <= Number(maxPrice);

      return matchesCategory && matchesSearch && matchesMin && matchesMax;
    });

    return filtered.sort((first, second) => {
      switch (sortBy) {
        case "price-low":
          return first.price - second.price;
        case "price-high":
          return second.price - first.price;
        case "rating":
          return second.rating - first.rating;
        default:
          return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
      }
    });
  }, [maxPrice, minPrice, products, searchQuery, selectedCategory, sortBy]);

  const selectCategory = (category: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (category) {
      nextParams.set("category", category);
    } else {
      nextParams.delete("category");
    }
    setSearchParams(nextParams);
  };

  const selectedCategoryName =
    selectedCategory ? getCategoryNameVi(selectedCategory) : "Tất cả sản phẩm";

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-3.5 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-6 lg:px-8">
      <nav
        aria-label="Điều hướng"
        className="mb-3 flex items-center gap-2 text-xs text-app-text-light sm:mb-6 sm:text-sm"
      >
        <Link to="/" aria-label="Trang chủ" className="hover:text-app-green">
          <Home size={14} />
        </Link>
        <span>/</span>
        <span className="truncate font-medium text-app-green">{selectedCategoryName}</span>
      </nav>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-7">
        {/* BỘ LỌC DANH MỤC & GIÁ (CÓ min-w-0 ĐỂ KHÔNG BỊ TRÀN NGANG TRÊN MÀN ĐIỆN THOẠI) */}
        <aside className="min-w-0 h-fit rounded-2xl border border-emerald-100 bg-white p-3.5 shadow-2xs sm:p-5 lg:sticky lg:top-28">
          <div className="mb-2.5 flex items-center justify-between gap-2 sm:mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-app-green" />
              <h2 className="text-sm font-semibold text-app-green sm:text-base">Danh mục</h2>
            </div>

            <button
              type="button"
              onClick={() => setShowMobilePriceFilter((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-[11px] font-semibold text-app-green lg:hidden"
            >
              Lọc giá (₫)
              <ChevronDown
                size={13}
                className={`transition-transform ${showMobilePriceFilter ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <div className="no-scrollbar flex w-full gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            <button
              type="button"
              onClick={() => selectCategory("")}
              aria-pressed={!selectedCategory}
              className={`shrink-0 rounded-full px-3 py-1.5 text-left text-xs transition lg:rounded-xl lg:py-2 lg:text-sm ${
                !selectedCategory
                  ? "bg-app-green font-semibold text-white shadow-2xs"
                  : "border border-emerald-100 bg-[#f6fcf8] text-app-text-light hover:bg-app-cream hover:text-app-green lg:border-transparent lg:bg-transparent"
              }`}
            >
              Tất cả
            </button>
            {categoriesData.map((category) => (
              <button
                type="button"
                key={category.slug}
                onClick={() => selectCategory(category.slug)}
                aria-pressed={selectedCategory === category.slug}
                className={`shrink-0 rounded-full px-3 py-1.5 text-left text-xs transition lg:rounded-xl lg:py-2 lg:text-sm ${
                  selectedCategory === category.slug
                    ? "bg-app-green font-semibold text-white shadow-2xs"
                    : "border border-emerald-100 bg-[#f6fcf8] text-app-text-light hover:bg-app-cream hover:text-app-green lg:border-transparent lg:bg-transparent"
                }`}
              >
                {getCategoryNameVi(category.slug)}
              </button>
            ))}
          </div>

          <div
            className={`${
              showMobilePriceFilter ? "mt-3 block" : "hidden"
            } border-t border-app-border pt-3 lg:mt-6 lg:block lg:pt-5`}
          >
            <h3 className="mb-2.5 text-xs font-semibold text-app-green sm:text-sm">
              Khoảng giá (₫)
            </h3>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="minimum-price">
                Giá thấp nhất (đồng)
              </label>
              <input
                id="minimum-price"
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Thấp nhất"
                className="min-w-0 w-full rounded-xl border border-app-border px-3 py-2 text-xs outline-none focus:border-app-green sm:text-sm"
              />
              <span className="text-app-text-light">–</span>
              <label className="sr-only" htmlFor="maximum-price">
                Giá cao nhất (đồng)
              </label>
              <input
                id="maximum-price"
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Cao nhất"
                className="min-w-0 w-full rounded-xl border border-app-border px-3 py-2 text-xs outline-none focus:border-app-green sm:text-sm"
              />
            </div>
          </div>
        </aside>

        {/* DANH SÁCH SẢN PHẨM */}
        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
            <div className="min-w-0">
              <h1 className="truncate font-serif text-xl font-bold text-app-green sm:text-3xl">
                {selectedCategoryName}
              </h1>
              <p className="mt-0.5 truncate text-xs text-app-text-light sm:text-sm">
                Tìm thấy {visibleProducts.length} sản phẩm
                {searchQuery ? ` với từ khóa “${searchParams.get("q")}”` : ""}
              </p>
            </div>

            <label className="relative flex shrink-0 items-center">
              <span className="sr-only">Sắp xếp sản phẩm</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="appearance-none rounded-xl border border-app-border bg-white py-2 pl-3 pr-8 text-xs font-medium text-app-text outline-none focus:border-app-green sm:py-2.5 sm:pl-4 sm:pr-10 sm:text-sm"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-low">Giá thấp → cao</option>
                <option value="price-high">Giá cao → thấp</option>
                <option value="rating">Đánh giá cao</option>
              </select>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 text-app-text-light"
              />
            </label>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <article
                  key={product._id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_2px_10px_-4px_rgba(15,81,50,0.06)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
                >
                  {product.discount > 0 && (
                    <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-[#0f5132] shadow-2xs ring-1 ring-amber-300 sm:left-3 sm:top-3 sm:px-2.5">
                      -{product.discount}%
                    </span>
                  )}
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
                        className={`h-full w-full object-contain transition duration-300 group-hover:scale-105 ${
                          product.stock <= 0 ? "opacity-50 grayscale" : ""
                        }`}
                      />
                    </div>
                    <div className="px-3 pt-2.5 pb-1 sm:px-4 sm:pt-3">
                      <p className="truncate text-[11px] font-medium text-emerald-700/75 sm:text-xs">
                        {getCategoryNameVi(product.category)}
                      </p>
                      <h2 className="mt-0.5 line-clamp-2 min-h-9 text-xs font-semibold leading-4.5 text-app-text sm:min-h-10 sm:text-sm sm:leading-5">
                        {getProductNameVi(product)}
                      </h2>
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
                      {product.originalPrice > product.price && (
                        <span className="block text-[10px] text-app-text-light line-through sm:text-xs">
                          {formatVnd(product.originalPrice)}
                        </span>
                      )}
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
            <div className="rounded-2xl border border-dashed border-app-border bg-white px-6 py-14 text-center">
              <h2 className="font-semibold text-app-green">Không tìm thấy sản phẩm</h2>
              <p className="mt-2 text-xs text-app-text-light sm:text-sm">
                Hãy thử chọn danh mục khác hoặc điều chỉnh khoảng giá.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                  selectCategory("");
                }}
                className="mt-5 rounded-full bg-app-green px-5 py-2.5 text-xs font-medium text-white hover:bg-app-green-light sm:text-sm"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Products;
