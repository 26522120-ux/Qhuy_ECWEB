import { useMemo, useState } from "react";
import { ChevronDown, Home, Plus, SlidersHorizontal, Star } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { categoriesData } from "../assets/assets";
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
  const { products, currentUser } = useStore();
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
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <nav aria-label="Điều hướng" className="mb-6 flex items-center gap-2 text-sm text-app-text-light">
        <Link to="/" aria-label="Trang chủ" className="hover:text-app-green">
          <Home size={15} />
        </Link>
        <span>/</span>
        <span className="font-medium text-app-green">{selectedCategoryName}</span>
      </nav>

      <div className="grid gap-7 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-app-border bg-white p-5 lg:sticky lg:top-6">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal size={17} className="text-app-green" />
            <h2 className="font-semibold text-app-green">Danh mục</h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            <button
              type="button"
              onClick={() => selectCategory("")}
              aria-pressed={!selectedCategory}
              className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm transition ${
                !selectedCategory
                  ? "bg-app-green font-medium text-white"
                  : "text-app-text-light hover:bg-app-cream hover:text-app-green"
              }`}
            >
              Tất cả danh mục
            </button>
            {categoriesData.map((category) => (
              <button
                type="button"
                key={category.slug}
                onClick={() => selectCategory(category.slug)}
                aria-pressed={selectedCategory === category.slug}
                className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm transition ${
                  selectedCategory === category.slug
                    ? "bg-app-green font-medium text-white"
                    : "text-app-text-light hover:bg-app-cream hover:text-app-green"
                }`}
              >
                {getCategoryNameVi(category.slug)}
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-app-border pt-5">
            <h3 className="mb-3 text-sm font-semibold text-app-green">Khoảng giá (₫)</h3>
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
                className="min-w-0 w-full rounded-lg border border-app-border px-3 py-2 text-sm outline-none focus:border-app-green"
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
                className="min-w-0 w-full rounded-lg border border-app-border px-3 py-2 text-sm outline-none focus:border-app-green"
              />
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl text-app-green">{selectedCategoryName}</h1>
              <p className="mt-1 text-sm text-app-text-light">
                Tìm thấy {visibleProducts.length} sản phẩm
                {searchQuery ? ` với từ khóa “${searchParams.get("q")}”` : ""}
              </p>
            </div>

            <label className="relative flex items-center">
              <span className="sr-only">Sắp xếp sản phẩm</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="appearance-none rounded-xl border border-app-border bg-white py-2.5 pl-4 pr-10 text-sm text-app-text outline-none focus:border-app-green"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-low">Giá: thấp đến cao</option>
                <option value="price-high">Giá: cao đến thấp</option>
                <option value="rating">Đánh giá cao</option>
              </select>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute right-3 text-app-text-light"
              />
            </label>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visibleProducts.map((product) => (
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
                          ? `Sắp hết: còn ${product.stock}`
                          : `Kho: ${product.stock}`}
                    </span>
                  )}
                  <Link to={`/products/${product._id}`} className="block">
                    <div className="flex aspect-square items-center justify-center bg-white p-5 sm:p-7">
                      <img
                        src={product.image}
                        alt={getProductNameVi(product)}
                        loading="lazy"
                        className={`h-full w-full object-contain transition duration-300 group-hover:scale-105 ${
                          product.stock <= 0 ? "opacity-50 grayscale" : ""
                        }`}
                      />
                    </div>
                    <div className="px-3 pb-3 sm:px-4">
                      <p className="mb-1 text-xs text-app-text-light">
                        {getCategoryNameVi(product.category)}
                      </p>
                      <h2 className="min-h-10 text-sm font-medium leading-5 text-app-text">
                        {getProductNameVi(product)}
                      </h2>
                      <div className="mt-1 flex items-center gap-1 text-xs">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span className="font-medium text-app-text">{product.rating}</span>
                        <span className="text-app-text-light">({product.reviewCount})</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="font-semibold text-app-green">
                          {formatVnd(product.price)}
                        </span>
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
                    <Plus size={18} />
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-app-border bg-white px-6 py-16 text-center">
              <h2 className="font-semibold text-app-green">Không tìm thấy sản phẩm</h2>
              <p className="mt-2 text-sm text-app-text-light">
                Hãy thử chọn danh mục khác hoặc điều chỉnh khoảng giá.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                  selectCategory("");
                }}
                className="mt-5 rounded-full bg-app-green px-5 py-2.5 text-sm font-medium text-white hover:bg-app-green-light"
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
