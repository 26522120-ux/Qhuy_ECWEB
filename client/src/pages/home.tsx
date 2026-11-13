import { useMemo, useState } from "react";
import {
  ArrowRight,
  ShoppingBag,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { categoriesData, gymSupplementProducts } from "../assets/assets";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import {
  formatUnitVi,
  formatVnd,
  getCategoryNameVi,
  getProductDescriptionVi,
  getProductNameVi,
} from "../localization";
import type { Product } from "../types";

const Home = () => {
  const { products, currentUser } = useStore();
  const { addItem } = useCart();
  const isAdmin = Boolean(currentUser?.isAdmin);

  const [activeCatalogFilter, setActiveCatalogFilter] = useState<string>("all");

  const catalogProducts = useMemo(() => {
    const validSlugs = new Set(categoriesData.map((c) => c.slug));
    const filtered = products.filter((p) => validSlugs.has(p.category));
    return filtered.length > 0 ? filtered : gymSupplementProducts;
  }, [products]);

  const shockDealProducts = useMemo(() => {
    return [...catalogProducts]
      .filter((p) => p.discount > 0 && p.category !== "healthy-meal")
      .sort((a, b) => {
        if (b.discount !== a.discount) return b.discount - a.discount;
        return b.originalPrice - b.price - (a.originalPrice - a.price);
      })
      .slice(0, 8);
  }, [catalogProducts]);

  const healthyMealProducts = useMemo(() => {
    return catalogProducts.filter((p) => p.category === "healthy-meal").slice(0, 8);
  }, [catalogProducts]);

  const displayedCatalogProducts: Product[] = useMemo(() => {
    const list =
      activeCatalogFilter === "all"
        ? catalogProducts
        : catalogProducts.filter((p) => p.category === activeCatalogFilter);
    return list.slice(0, 8);
  }, [activeCatalogFilter, catalogProducts]);

  return (
    <div className="bg-[#0b0d0c] text-white">
      {/* ==================== HERO SECTION CHUẨN nutraGO ==================== */}
      <section className="relative min-h-[540px] w-full overflow-hidden border-b border-white/10 bg-[#0b0d0c] sm:min-h-[620px] lg:min-h-[680px]">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/form-fwd-hero.jpg"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center opacity-80 sm:opacity-90"
        >
          <source src="/hero-gym.mp4" type="video/mp4" />
        </video>

        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-[#0b0d0c] via-[#0b0d0c]/88 to-transparent sm:via-[#0b0d0c]/60" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-28 bg-gradient-to-t from-[#0b0d0c] to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[540px] max-w-7xl items-center px-4 py-14 sm:min-h-[620px] sm:px-6 lg:min-h-[680px] lg:px-8">
          <div className="max-w-2xl">
            <p className="font-sans text-[11px] font-semibold tracking-[0.26em] text-zinc-400 uppercase sm:text-xs">
              HIỆU SUẤT &bull; DINH DƯỠNG &bull; KỶ LUẬT
            </p>

            <h1 className="mt-4 font-display text-6xl leading-[0.94] font-black tracking-tight uppercase sm:text-7xl lg:text-[92px]">
              <span className="block text-white">VƯỢT QUA</span>
              <span className="mt-1 block text-[#b8f927]">GIỚI HẠN.</span>
            </h1>

            <p className="mt-6 max-w-xl font-sans text-sm leading-7 font-normal text-zinc-300/90 sm:text-base sm:leading-8">
              Kế hoạch tập luyện, dinh dưỡng và sản phẩm hiệu suất được thiết kế
              riêng để đưa bạn đến phiên bản mạnh mẽ nhất.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5 sm:mt-10 sm:gap-4">
              <a
                href="#khuyen-mai"
                onClick={(event) => {
                  event.preventDefault();
                  document
                    .getElementById("khuyen-mai")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center gap-3 rounded-xs bg-[#b8f927] px-7 py-4 text-xs font-extrabold tracking-[0.12em] text-black uppercase shadow-[0_0_30px_rgba(184,249,39,0.28)] transition hover:bg-[#c9ff4d] sm:px-8 sm:text-sm"
              >
                <span>BẮT ĐẦU NGAY</span>
                <ArrowRight size={17} strokeWidth={2.5} />
              </a>

              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-xs border border-zinc-700 bg-[#0d0f0e]/80 px-7 py-4 text-xs font-bold tracking-[0.12em] text-white uppercase backdrop-blur-xs transition hover:border-[#b8f927] hover:text-[#b8f927] sm:px-8 sm:text-sm"
              >
                KHÁM PHÁ SẢN PHẨM
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== KHU VỰC GIẢM GIÁ SỐC & KHUYẾN MÃI ==================== */}
      <section
        id="khuyen-mai"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
              // ƯU ĐÃI ĐỘC QUYỀN HÔM NAY
            </p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white uppercase sm:text-5xl">
              SẢN PHẨM GIẢM GIÁ SỐC &amp; KHUYẾN MÃI
            </h2>
          </div>
          <Link
            to="/deals"
            className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-[#b8f927] uppercase transition hover:underline sm:text-sm"
          >
            <span>Xem tất cả Flash Deals</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
          {shockDealProducts.map((product) => (
            <div
              key={product._id}
              className="group flex min-w-0 flex-col justify-between overflow-hidden rounded-xs border border-zinc-800 bg-[#121614] transition hover:border-[#b8f927]/70"
            >
              <div>
                <Link
                  to={`/products/${product._id}`}
                  className="relative flex aspect-square items-center justify-center bg-white p-4"
                >
                  {product.discount > 0 && (
                    <span className="absolute left-2.5 top-2.5 rounded-xs bg-[#b8f927] px-2 py-0.5 text-[10px] font-black text-black shadow-xs">
                      -{product.discount}%
                    </span>
                  )}
                  <span className="absolute right-2.5 top-2.5 rounded-xs bg-red-600 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white uppercase shadow-xs">
                    GIẢM SỐC
                  </span>
                  <img
                    src={product.image}
                    alt={getProductNameVi(product)}
                    className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </Link>
                <div className="p-3.5">
                  <p className="truncate text-[10px] font-bold tracking-wider text-[#b8f927] uppercase">
                    {getCategoryNameVi(product.category)}
                  </p>
                  <Link
                    to={`/products/${product._id}`}
                    className="mt-1 line-clamp-2 min-h-9 text-xs font-bold text-white transition group-hover:text-[#b8f927] sm:text-sm"
                  >
                    {getProductNameVi(product)}
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-zinc-800/90 px-3.5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-extrabold text-[#b8f927] sm:text-lg">
                    {formatVnd(product.price)}
                  </p>
                  {product.originalPrice > product.price ? (
                    <p className="truncate text-[11px] text-zinc-500 line-through">
                      {formatVnd(product.originalPrice)}
                    </p>
                  ) : (
                    <p className="truncate text-[10px] text-zinc-400">
                      /{formatUnitVi(product.unit)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => addItem(product, 1)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xs bg-[#b8f927] px-3 py-2 text-[11px] font-extrabold text-black uppercase transition hover:bg-[#c9ff4d]"
                >
                  <ShoppingBag size={13} />
                  <span>Thêm</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== HEALTHY MEAL — BỮA ĂN DINH DƯỠNG ==================== */}
      <section
        id="healthy-meal"
        className="border-t border-white/10 bg-[#0e1210] py-14 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
                // EAT CLEAN &bull; HIGH PROTEIN &bull; KETO
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-black text-white uppercase sm:text-5xl">
                HEALTHY MEAL
              </h2>
            </div>
            <Link
              to="/products?category=healthy-meal"
              className="inline-flex shrink-0 items-center gap-1.5 border border-zinc-700 bg-[#141816] px-4 py-2.5 text-xs font-bold tracking-wider text-white uppercase transition hover:border-[#b8f927] hover:text-[#b8f927]"
            >
              <span>XEM TẤT CẢ</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
            {healthyMealProducts.map((meal) => (
              <div
                key={meal._id}
                className="group flex min-w-0 flex-col justify-between overflow-hidden rounded-xs border border-zinc-800 bg-[#131816] transition hover:-translate-y-1 hover:border-[#b8f927]"
              >
                <div>
                  <Link
                    to={`/products/${meal._id}`}
                    className="relative block aspect-square overflow-hidden bg-[#0b0d0c]"
                  >
                    {meal.discount > 0 && (
                      <span className="absolute left-2.5 top-2.5 z-10 rounded-xs bg-[#b8f927] px-2 py-0.5 text-[10px] font-black text-black shadow-xs">
                        -{meal.discount}%
                      </span>
                    )}
                    <img
                      src={meal.image}
                      alt={getProductNameVi(meal)}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>
                  <div className="p-3.5">
                    <p className="truncate text-[10px] font-bold tracking-wider text-[#b8f927] uppercase">
                      {getCategoryNameVi(meal.category)}
                    </p>
                    <Link
                      to={`/products/${meal._id}`}
                      className="mt-1 line-clamp-2 min-h-9 text-xs font-bold text-white transition group-hover:text-[#b8f927] sm:text-sm"
                    >
                      {getProductNameVi(meal)}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-zinc-800/90 px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-extrabold text-[#b8f927] sm:text-lg">
                      {formatVnd(meal.price)}
                    </p>
                    <p className="truncate text-[10px] text-zinc-400">
                      /{formatUnitVi(meal.unit)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItem(meal, 1)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xs bg-[#b8f927] px-3 py-2 text-[11px] font-extrabold text-black uppercase transition hover:bg-[#c9ff4d]"
                  >
                    <ShoppingBag size={13} />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== DANH SÁCH SẢN PHẨM KHOA HỌC CÓ TAB LỌC NHANH ==================== */}
      <section className="border-t border-white/10 bg-[#0b0d0c] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
                // HIỆU SUẤT &amp; CHẤT LƯỢNG CAO NHẤT
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-black text-white uppercase sm:text-5xl">
                SẢN PHẨM NỔI BẬT
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-xs bg-[#b8f927] px-5 py-2.5 text-xs font-extrabold tracking-wider text-black uppercase transition hover:bg-[#c8ff47]"
            >
              <span>XEM TOÀN BỘ {catalogProducts.length} SẢN PHẨM</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Thanh Tab lọc nhanh theo 5 danh mục */}
          <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setActiveCatalogFilter("all")}
              className={`shrink-0 rounded-xs px-4 py-2 text-xs font-extrabold uppercase transition ${
                activeCatalogFilter === "all"
                  ? "bg-[#b8f927] text-black"
                  : "border border-zinc-800 bg-[#121614] text-zinc-300 hover:border-zinc-600 hover:text-white"
              }`}
            >
              Tất cả
            </button>
            {categoriesData.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => setActiveCatalogFilter(category.slug)}
                className={`shrink-0 rounded-xs px-4 py-2 text-xs font-bold uppercase transition ${
                  activeCatalogFilter === category.slug
                    ? "bg-[#b8f927] text-black"
                    : "border border-zinc-800 bg-[#121614] text-zinc-300 hover:border-zinc-600 hover:text-white"
                }`}
              >
                {getCategoryNameVi(category.slug)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {displayedCatalogProducts.map((product) => (
              <div
                key={product._id}
                className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-xs border border-zinc-800 bg-[#121614] transition hover:-translate-y-1 hover:border-[#b8f927]/70"
              >
                {product.discount > 0 && (
                  <span className="absolute left-3 top-3 z-10 rounded-xs bg-[#b8f927] px-2.5 py-0.5 text-[10px] font-black text-black shadow-xs">
                    -{product.discount}%
                  </span>
                )}
                {isAdmin && (
                  <span
                    className={`absolute right-3 top-3 z-10 rounded-xs px-2 py-0.5 text-[10px] font-bold ${
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

                <div>
                  <Link
                    to={`/products/${product._id}`}
                    className="flex aspect-square items-center justify-center bg-white p-4 sm:p-6"
                  >
                    <img
                      src={product.image}
                      alt={getProductNameVi(product)}
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>

                  <div className="p-3.5 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-bold tracking-wider text-[#b8f927] uppercase">
                        {getCategoryNameVi(product.category)}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-zinc-400">
                        <Star size={11} className="fill-[#b8f927] text-[#b8f927]" />
                        {product.rating}
                      </span>
                    </div>

                    <Link
                      to={`/products/${product._id}`}
                      className="mt-1.5 line-clamp-2 min-h-9 text-xs font-bold leading-4.5 text-white transition group-hover:text-[#b8f927] sm:min-h-10 sm:text-sm sm:leading-5"
                    >
                      {getProductNameVi(product)}
                    </Link>

                    <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400">
                      {getProductDescriptionVi(product)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-zinc-800/80 px-3.5 py-3 sm:px-4">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-extrabold text-white sm:text-xl">
                      {formatVnd(product.price)}
                    </p>
                    <p className="truncate text-[10px] text-zinc-400">
                      /{formatUnitVi(product.unit)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItem(product, 1)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xs border border-[#b8f927] bg-[#b8f927]/10 px-3 py-2 text-[11px] font-extrabold text-[#b8f927] uppercase transition hover:bg-[#b8f927] hover:text-black"
                  >
                    <ShoppingBag size={13} />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
