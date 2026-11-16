import { useMemo } from "react";
import { Plus, Search, Star } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import {
  formatUnitVi,
  formatVnd,
  getCategoryNameVi,
  getProductDescriptionVi,
  getProductNameVi,
} from "../localization";

const SearchResult = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const { products } = useStore();
  const { addItem } = useCart();

  const matchedProducts = useMemo(() => {
    if (!query) return products;
    const normalized = query.toLowerCase();
    return products.filter((product) => {
      const nameVi = getProductNameVi(product).toLowerCase();
      const descVi = getProductDescriptionVi(product).toLowerCase();
      const catVi = getCategoryNameVi(product.category).toLowerCase();
      return (
        nameVi.includes(normalized) ||
        descVi.includes(normalized) ||
        catVi.includes(normalized)
      );
    });
  }, [products, query]);

  return (
    <main className="min-h-screen bg-[#0b0d0c] text-white">
      <div className="mx-auto max-w-7xl px-3.5 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
              // TÌM KIẾM SẢN PHẨM nutraGO
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-white uppercase sm:text-5xl">
              {query ? `Kết quả cho "${query}"` : "Tất cả sản phẩm"}
            </h1>
            <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
              Tìm thấy {matchedProducts.length} sản phẩm phù hợp
            </p>
          </div>

          <div className="flex w-full max-w-sm items-center rounded-xs border border-white/15 bg-[#111513] px-3 py-2">
            <Search size={16} className="shrink-0 text-[#b8f927]" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                const next = e.target.value;
                setSearchParams(next ? { q: next } : {});
              }}
              placeholder="Nhập tên Whey, Creatine, Healthy Meal..."
              className="ml-2.5 w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500 sm:text-sm"
            />
          </div>
        </div>

        {matchedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {matchedProducts.map((product) => (
              <article
                key={product._id}
                className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-xs border border-zinc-800 bg-[#121614] transition hover:-translate-y-1 hover:border-[#b8f927]/75"
              >
                <Link to={`/products/${product._id}`} className="block">
                  <div className="flex aspect-square items-center justify-center bg-white p-3.5 sm:p-5">
                    <img
                      src={product.image}
                      alt={getProductNameVi(product)}
                      loading="lazy"
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-2.5 sm:p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-bold tracking-wider text-[#b8f927] uppercase">
                        {getCategoryNameVi(product.category)}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-zinc-400">
                        <Star size={11} className="fill-[#b8f927] text-[#b8f927]" />
                        {product.rating}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-[13px] font-bold leading-[1.35] break-words text-white group-hover:text-[#b8f927] sm:text-sm">
                      {getProductNameVi(product)}
                    </h2>
                  </div>
                </Link>

                <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-zinc-800/80 px-2.5 py-2.5 sm:px-3.5 sm:py-3">
                  <div>
                    <p className="font-display text-sm font-black text-white sm:text-lg">
                      {formatVnd(product.price)}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      /{formatUnitVi(product.unit)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItem(product, 1)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-xs bg-[#b8f927] px-2.5 py-1.5 text-[10px] font-extrabold text-black uppercase hover:bg-[#cbff4d] sm:px-3 sm:py-2 sm:text-[11px]"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>Thêm</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xs border border-dashed border-zinc-700 bg-[#111513] px-6 py-16 text-center">
            <h2 className="font-display text-2xl font-bold text-white uppercase">
              Không tìm thấy sản phẩm nào cho "{query}"
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Hãy thử từ khóa khác hoặc xem toàn bộ danh mục sản phẩm nutraGO.
            </p>
            <Link
              to="/products"
              className="mt-5 inline-flex rounded-xs bg-[#b8f927] px-6 py-3 text-xs font-black tracking-wider text-black uppercase hover:bg-[#cbff4d]"
            >
              Xem toàn bộ sản phẩm
            </Link>
          </div>
        )}
      </div>
    </main>
  );
};

export default SearchResult;
