import { useMemo, useState } from "react";
import {
  ChevronDown,
  Home,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { categoriesData } from "../assets/assets";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import {
  formatUnitVi,
  formatVnd,
  getCategoryNameVi,
  getProductDescriptionVi,
  getProductNameVi,
  INR_TO_VND,
} from "../localization";

type SortOption = "newest" | "price-low" | "price-high" | "rating" | "discount";

const PRICE_PRESETS = [
  { label: "Tất cả mức giá", min: "", max: "" },
  { label: "Dưới 1.000.000 ₫", min: "", max: "1000000" },
  { label: "1.000.000 – 3.000.000 ₫", min: "1000000", max: "3000000" },
  { label: "Trên 3.000.000 ₫", min: "3000000", max: "" },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const { products, currentUser } = useStore();
  const { addItem } = useCart();
  const isAdmin = Boolean(currentUser?.isAdmin);

  const selectedCategory = searchParams.get("category") ?? "";
  const searchQuery = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of products) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;
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
        case "discount":
          return second.discount - first.discount;
        default:
          return (
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime()
          );
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

  const selectedCategoryName = selectedCategory
    ? getCategoryNameVi(selectedCategory)
    : "Tất cả sản phẩm Gym & Supplement";

  const hasActiveFilter = Boolean(selectedCategory || minPrice || maxPrice || searchQuery);

  return (
    <div className="min-h-screen bg-[#0b0d0c] text-white">
      <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-3.5 pb-14 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:px-8">
        {/* BREADCRUMB */}
        <nav
          aria-label="Điều hướng"
          className="mb-4 flex items-center gap-2 text-xs text-zinc-400 sm:text-sm"
        >
          <Link to="/" aria-label="Trang chủ" className="hover:text-[#b8f927]">
            <Home size={14} />
          </Link>
          <span>/</span>
          <span className="truncate font-semibold text-[#b8f927]">
            {selectedCategoryName}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-7">
          {/* SIDEBAR BỘ LỌC KHOA HỌC */}
          <aside className="h-fit min-w-0 rounded-xs border border-zinc-800 bg-[#111513] p-4 sm:p-5 lg:sticky lg:top-20">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-[#b8f927]" />
                <h2 className="font-display text-base font-extrabold tracking-wider text-white uppercase">
                  BỘ LỌC KHO HÀNG
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowMobileFilter((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-xs border border-zinc-700 bg-[#171c19] px-2.5 py-1 text-[11px] font-bold text-[#b8f927] lg:hidden"
              >
                Lọc giá
                <ChevronDown
                  size={13}
                  className={`transition-transform ${showMobileFilter ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Danh mục kèm số lượng sản phẩm */}
            <div className="no-scrollbar flex w-full gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
              <button
                type="button"
                onClick={() => selectCategory("")}
                aria-pressed={!selectedCategory}
                className={`flex shrink-0 items-center justify-between gap-2 rounded-xs px-3 py-2 text-left text-xs font-bold transition ${
                  !selectedCategory
                    ? "bg-[#b8f927] text-black"
                    : "border border-zinc-800 bg-[#161b18] text-zinc-300 hover:border-zinc-600 hover:text-white lg:border-transparent"
                }`}
              >
                <span className="truncate">Tất cả sản phẩm</span>
                <span
                  className={`rounded-xs px-1.5 py-0.5 text-[10px] font-extrabold ${
                    !selectedCategory
                      ? "bg-black/15 text-black"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {products.length}
                </span>
              </button>

              {categoriesData.map((category) => {
                const isSelected = selectedCategory === category.slug;
                const count = categoryCounts.get(category.slug) ?? 0;
                return (
                  <button
                    type="button"
                    key={category.slug}
                    onClick={() => selectCategory(category.slug)}
                    aria-pressed={isSelected}
                    className={`flex shrink-0 items-center justify-between gap-2 rounded-xs px-3 py-2 text-left text-xs font-semibold transition ${
                      isSelected
                        ? "bg-[#b8f927] font-bold text-black"
                        : "border border-zinc-800 bg-[#161b18] text-zinc-300 hover:border-zinc-600 hover:text-white lg:border-transparent"
                    }`}
                  >
                    <span className="truncate">{getCategoryNameVi(category.slug)}</span>
                    <span
                      className={`rounded-xs px-1.5 py-0.5 text-[10px] font-extrabold ${
                        isSelected
                          ? "bg-black/15 text-black"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bộ lọc khoảng giá */}
            <div
              className={`${
                showMobileFilter ? "mt-4 block" : "hidden"
              } border-t border-zinc-800 pt-4 lg:mt-5 lg:block`}
            >
              <h3 className="mb-2.5 text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
                Mức giá nhanh (VND)
              </h3>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {PRICE_PRESETS.map((preset) => {
                  const active = minPrice === preset.min && maxPrice === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setMinPrice(preset.min);
                        setMaxPrice(preset.max);
                      }}
                      className={`rounded-xs border px-2.5 py-1 text-[11px] font-semibold transition ${
                        active
                          ? "border-[#b8f927] bg-[#b8f927]/15 text-[#b8f927]"
                          : "border-zinc-800 bg-[#161b18] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="minimum-price"
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder="Từ (₫)"
                  className="min-w-0 w-full rounded-xs border border-zinc-800 bg-[#0b0d0c] px-2.5 py-2 text-xs text-white outline-none placeholder:text-zinc-500 focus:border-[#b8f927]"
                />
                <span className="text-zinc-500">–</span>
                <input
                  id="maximum-price"
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="Đến (₫)"
                  className="min-w-0 w-full rounded-xs border border-zinc-800 bg-[#0b0d0c] px-2.5 py-2 text-xs text-white outline-none placeholder:text-zinc-500 focus:border-[#b8f927]"
                />
              </div>

              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    selectCategory("");
                  }}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xs border border-zinc-700 bg-[#171c19] px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-[#b8f927] hover:text-[#b8f927]"
                >
                  <RotateCcw size={13} />
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          </aside>

          {/* KHU VỰC HIỂN THỊ SẢN PHẨM */}
          <section className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#b8f927] uppercase">
                  // DANH MỤC HIỆU SUẤT FORM/FWD
                </p>
                <h1 className="mt-1 truncate font-display text-2xl font-black text-white uppercase sm:text-4xl">
                  {selectedCategoryName}
                </h1>
                <p className="mt-1 truncate text-xs text-zinc-400 sm:text-sm">
                  Hiển thị <strong className="text-white">{visibleProducts.length}</strong> sản phẩm
                  {searchQuery ? ` cho từ khóa “${searchParams.get("q")}”` : ""}
                </p>
              </div>

              <label className="relative flex shrink-0 items-center">
                <span className="sr-only">Sắp xếp sản phẩm</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  className="appearance-none rounded-xs border border-zinc-700 bg-[#121614] py-2.5 pl-3.5 pr-9 text-xs font-bold text-white outline-none focus:border-[#b8f927] sm:text-sm"
                >
                  <option value="newest">Sắp xếp: Mới nhất</option>
                  <option value="price-low">Giá: Thấp → Cao</option>
                  <option value="price-high">Giá: Cao → Thấp</option>
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="discount">Ưu đãi giảm sâu</option>
                </select>
                <ChevronDown
                  size={15}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2.5 text-[#b8f927]"
                />
              </label>
            </div>

            {visibleProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {visibleProducts.map((product) => (
                  <article
                    key={product._id}
                    className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-xs border border-zinc-800 bg-[#121614] transition hover:-translate-y-1 hover:border-[#b8f927]/75"
                  >
                    {/* Nhãn giảm giá & tồn kho Admin */}
                    {product.discount > 0 && (
                      <span className="absolute left-2.5 top-2.5 z-10 rounded-xs bg-[#b8f927] px-2 py-0.5 text-[10px] font-black text-black shadow-xs sm:left-3 sm:top-3">
                        -{product.discount}%
                      </span>
                    )}
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

                    {/* Khung ảnh Studio trắng sắc nét */}
                    <Link to={`/products/${product._id}`} className="block">
                      <div className="flex aspect-square items-center justify-center bg-white p-3.5 sm:p-5">
                        <img
                          src={product.image}
                          alt={getProductNameVi(product)}
                          loading="lazy"
                          className={`h-full w-full object-contain transition duration-300 group-hover:scale-105 ${
                            product.stock <= 0 ? "opacity-50 grayscale" : ""
                          }`}
                        />
                      </div>

                      <div className="p-3 pb-2 sm:p-3.5 sm:pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[10px] font-bold tracking-wider text-[#b8f927] uppercase">
                            {getCategoryNameVi(product.category)}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-zinc-400">
                            <Star
                              size={11}
                              className="fill-[#b8f927] text-[#b8f927]"
                            />
                            {product.rating}
                          </span>
                        </div>

                        <h2 className="mt-1.5 line-clamp-2 min-h-9 text-xs font-bold leading-4.5 text-white transition group-hover:text-[#b8f927] sm:min-h-10 sm:text-sm sm:leading-5">
                          {getProductNameVi(product)}
                        </h2>

                        <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400">
                          {getProductDescriptionVi(product)}
                        </p>

                        <span className="mt-2 inline-block rounded-xs border border-zinc-800 bg-[#0b0d0c] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                          Quy cách: {formatUnitVi(product.unit)}
                        </span>
                      </div>
                    </Link>

                    {/* Giá & nút Thêm vào giỏ */}
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-800/80 px-3 py-2.5 sm:px-3.5 sm:py-3">
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-black text-white sm:text-lg">
                          {formatVnd(product.price)}
                        </p>
                        {product.originalPrice > product.price && (
                          <p className="truncate text-[10px] text-zinc-500 line-through sm:text-xs">
                            {formatVnd(product.originalPrice)}
                          </p>
                        )}
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
                  Không tìm thấy sản phẩm phù hợp
                </h2>
                <p className="mt-2 text-xs text-zinc-400 sm:text-sm">
                  Hãy thử chọn danh mục khác hoặc đặt lại khoảng giá.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    selectCategory("");
                  }}
                  className="mt-5 rounded-xs bg-[#b8f927] px-6 py-2.5 text-xs font-extrabold text-black uppercase hover:bg-[#c8ff47]"
                >
                  Xem toàn bộ sản phẩm
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Products;
