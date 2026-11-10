import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gift,
  Leaf,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { categoriesData, heroSectionData } from "../assets/assets";
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

const SLIDE_DURATION_MS = 3200;

const FALLBACK_CLEANSER_PRODUCT: Product = {
  _id: "prod_poppin_gentle_cleanser",
  name: "Sữa Rửa Mặt Dịu Nhẹ POPPIN MART - The Gentle Cleanser 80ml",
  description:
    "Sữa rửa mặt tạo bọt mịn dịu nhẹ chuẩn Hàn Quốc độc quyền từ POPPIN MART (Your Daily Freshness). Làm sạch sâu lỗ chân lông, cân bằng độ ẩm tự nhiên và mang lại làn da tươi mát mỗi ngày.",
  price: 390,
  originalPrice: 550,
  image: "/poppin-cleanser.jpg",
  category: "personal-care",
  unit: "1 tuýp (80ml)",
  stock: 68,
  isOrganic: true,
  rating: 5.0,
  reviewCount: 128,
  discount: 29,
  createdAt: new Date().toISOString(),
};

const Home = () => {
  const { products, currentUser } = useStore();
  const { addItem } = useCart();
  const isAdmin = Boolean(currentUser?.isAdmin);

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // Luôn hiển thị màn hình banner khuyến mãi sản phẩm mới mỗi khi truy cập vào Trang chủ
  const [isPromoBannerOpen, setIsPromoBannerOpen] = useState(true);

  // Tìm sản phẩm Sữa Rửa Mặt POPPIN MART trong danh sách sản phẩm từ CSDL (hoặc dùng bản dự phòng)
  const cleanserProduct = useMemo(() => {
    return (
      products.find(
        (item) =>
          item._id === "prod_poppin_gentle_cleanser" ||
          item.image === "/poppin-cleanser.jpg" ||
          item.name.toLowerCase().includes("gentle cleanser") ||
          item.name.toLowerCase().includes("sữa rửa mặt"),
      ) ?? FALLBACK_CLEANSER_PRODUCT
    );
  }, [products]);

  // Chọn danh sách sản phẩm tiêu biểu đại diện cho các gian hàng trên trang chủ (ưu tiên Sữa rửa mặt mới lên đầu)
  const showcaseProducts = useMemo(() => {
    if (products.length === 0) return [cleanserProduct];
    const byCategory = new Map<string, Product>();
    byCategory.set("personal-care-featured", cleanserProduct);
    for (const item of products) {
      if (
        item._id !== cleanserProduct._id &&
        item.stock > 0 &&
        !byCategory.has(item.category)
      ) {
        byCategory.set(item.category, item);
      }
      if (byCategory.size >= 8) break;
    }
    return Array.from(byCategory.values());
  }, [cleanserProduct, products]);

  useEffect(() => {
    if (isPaused || showcaseProducts.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % showcaseProducts.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, showcaseProducts.length]);

  const currentShowcase = showcaseProducts[activeSlide] ?? showcaseProducts[0];

  return (
    <div className="space-y-14 pb-8">
      {/* MÀN HÌNH POP-UP BANNER KHUYẾN MÃI GIỚI THIỆU SẢN PHẨM MỚI (CÓ THỂ TẮT ĐƯỢC) */}
      {isPromoBannerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-product-promo-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsPromoBannerOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-[0_25px_70px_-15px_rgba(15,81,50,0.45)]">
            {/* Nút Tắt (X) góc phải trên */}
            <button
              type="button"
              onClick={() => setIsPromoBannerOpen(false)}
              aria-label="Đóng banner khuyến mãi"
              className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-full border border-emerald-200 bg-white/90 text-app-green shadow-md transition hover:scale-105 hover:bg-emerald-50"
            >
              <X size={18} />
            </button>

            <div className="grid md:grid-cols-[46%_54%]">
              {/* Cột Trái: Poster hình ảnh Sữa Rửa Mặt POPPIN MART */}
              <div className="relative min-h-[280px] overflow-hidden bg-[#e0f4f7] md:min-h-[440px]">
                <img
                  src="/poppin-cleanser.jpg"
                  alt="Sữa Rửa Mặt Dịu Nhẹ POPPIN MART - The Gentle Cleanser"
                  className="h-full w-full object-cover object-top"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-extrabold text-[#0f5132] shadow-md ring-1 ring-amber-200">
                  MỚI RA MẮT • GIẢM {cleanserProduct.discount}%
                </span>
              </div>

              {/* Cột Phải: Nội dung khuyến mãi & Nút hành động */}
              <div className="flex flex-col justify-between bg-gradient-to-br from-white via-[#f8fcfa] to-amber-50/40 p-6 sm:p-8">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-xs font-bold text-[#0f5132]">
                    <Gift size={14} className="text-amber-600" />
                    ƯU ĐÃI ĐỘC QUYỀN TẠI POPPIN MART
                  </div>

                  <h2
                    id="new-product-promo-title"
                    className="mt-3 font-serif text-2xl leading-snug font-extrabold text-app-green sm:text-[26px]"
                  >
                    Sữa Rửa Mặt Dịu Nhẹ POPPIN MART
                    <span className="mt-0.5 block text-base font-semibold text-[#16a34a]">
                      The Gentle Cleanser • Your Daily Freshness
                    </span>
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-app-text-light">
                    Dòng chăm sóc da hằng ngày độc quyền từ{" "}
                    <strong className="text-app-green">POPPIN MART</strong>. Lớp bọt kem siêu mịn giúp làm sạch sâu bụi bẩn, giữ trọn độ ẩm tự nhiên và mang lại cảm giác tươi mát tức thì.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs font-medium text-app-text">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="shrink-0 text-[#16a34a]" />
                      Công thức dịu nhẹ chuẩn Hàn Quốc, an toàn cho mọi loại da
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="shrink-0 text-[#16a34a]" />
                      Dung tích 80ml (2.7 oz) nhỏ gọn, tiện lợi mang theo mỗi ngày
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="shrink-0 text-amber-500" />
                      Tặng ngay ưu đãi mở bán giảm{" "}
                      <strong className="text-amber-700">{cleanserProduct.discount}%</strong> duy nhất hôm nay!
                    </li>
                  </ul>
                </div>

                <div className="mt-6 border-t border-emerald-100 pt-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-xs font-medium text-app-text-light">
                        Giá ưu đãi ra mắt:
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-[#0f5132]">
                          {formatVnd(cleanserProduct.price)}
                        </span>
                        <span className="text-sm text-app-text-light line-through">
                          {formatVnd(cleanserProduct.originalPrice)}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#16a34a] ring-1 ring-emerald-200">
                      Tiết kiệm{" "}
                      {formatVnd(cleanserProduct.originalPrice - cleanserProduct.price)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        addItem(cleanserProduct, 1);
                        setIsPromoBannerOpen(false);
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f5132] to-[#16a34a] px-5 py-3 text-sm font-bold text-white shadow-md hover:from-[#15803d] hover:to-[#16a34a]"
                    >
                      <ShoppingBag size={16} className="text-amber-300" />
                      Thêm vào giỏ & Nhận ưu đãi
                    </button>

                    <Link
                      to={`/products/${cleanserProduct._id}`}
                      onClick={() => setIsPromoBannerOpen(false)}
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm font-semibold text-app-green hover:border-amber-300 hover:bg-amber-50"
                    >
                      Xem chi tiết
                    </Link>

                    <button
                      type="button"
                      onClick={() => setIsPromoBannerOpen(false)}
                      className="w-full pt-1 text-center text-xs font-medium text-app-text-light underline-offset-2 hover:text-app-green hover:underline"
                    >
                      Đóng thông báo này
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-cover bg-center shadow-[0_20px_50px_-18px_rgba(15,81,50,0.25)]"
          style={{ backgroundImage: `url(${heroSectionData.hero_image})` }}
        >
          {/* LỚP PHỦ MÀU XANH LÁ & ÁNH VÀNG NẮNG HIỆN ĐẠI */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#072e1b]/95 via-[#0f5132]/85 to-amber-500/25" />
          <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-amber-400/20 blur-3xl" />

          <div className="relative z-10 grid items-center gap-8 px-6 pt-10 pb-6 sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-12">
            {/* CỘT TRÁI: THÔNG ĐIỆP CHÍNH */}
            <div className="flex flex-col items-start justify-center text-white">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/45 bg-amber-400/20 px-4 py-1.5 text-xs font-semibold tracking-wide text-amber-100 uppercase backdrop-blur-md">
                  <Leaf size={14} className="text-amber-300" /> POPPIN MART • Tươi sạch mỗi ngày
                </span>
                <button
                  type="button"
                  onClick={() => setIsPromoBannerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur-md hover:bg-white/25"
                >
                  <Gift size={13} className="text-amber-300" />
                  Mới: Sữa rửa mặt POPPIN MART (-29%)
                </button>
              </div>

              <h1 className="font-serif text-3xl leading-tight font-extrabold sm:text-5xl lg:text-[50px]">
                Không gian mua sắm <span className="text-amber-300">xanh tươi</span> cho bữa ăn lành mạnh.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-50/90 sm:text-base">
                Thực phẩm tươi sạch, rau củ hữu cơ và sản phẩm chăm sóc cá nhân chất lượng cao được POPPIN MART tuyển chọn kỹ lưỡng và giao tận tay bạn.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 text-sm font-bold text-[#0f5132] shadow-md hover:bg-amber-300"
                >
                  Khám phá ngay <ArrowRight size={18} />
                </Link>
                <Link
                  to="/deals"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-xs hover:bg-white/25"
                >
                  <Sparkles size={16} className="text-amber-300" />
                  Ưu đãi trong ngày
                </Link>
              </div>
            </div>

            {/* CỘT PHẢI: SLIDER SẢN PHẨM TỰ ĐỘNG CHUYỂN CẢNH */}
            {currentShowcase && (
              <div
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                className="relative mx-auto w-full max-w-md rounded-3xl border border-white/25 bg-white/95 p-4 text-app-text shadow-2xl backdrop-blur-xl sm:p-5"
              >
                {/* Thanh chỉ báo tiến trình slide */}
                <div className="mb-3 flex items-center gap-1.5">
                  {showcaseProducts.map((item, idx) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      aria-label={`Xem sản phẩm ${idx + 1}`}
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-emerald-100"
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === activeSlide
                            ? "w-full bg-gradient-to-r from-[#16a34a] to-amber-400"
                            : idx < activeSlide
                              ? "w-full bg-emerald-400"
                              : "w-0"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Header của khung trình chiếu */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#0f5132] ring-1 ring-emerald-200">
                    <Sparkles size={12} className="text-amber-500" />
                    Gian hàng: {getCategoryNameVi(currentShowcase.category)}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-app-text-light">
                    <span>
                      {activeSlide + 1}/{showcaseProducts.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSlide(
                          (prev) =>
                            (prev - 1 + showcaseProducts.length) %
                            showcaseProducts.length,
                        )
                      }
                      aria-label="Sản phẩm trước"
                      className="rounded-full p-1 hover:bg-emerald-50 hover:text-app-green"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSlide((prev) => (prev + 1) % showcaseProducts.length)
                      }
                      aria-label="Sản phẩm tiếp theo"
                      className="rounded-full p-1 hover:bg-emerald-50 hover:text-app-green"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>

                {/* Hình ảnh sản phẩm */}
                <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-[#f4fbf7] via-white to-amber-50/50 p-4 sm:h-48">
                  {currentShowcase.discount > 0 && (
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold text-[#0f5132] shadow-2xs ring-1 ring-amber-300">
                      Ưu đãi -{currentShowcase.discount}%
                    </span>
                  )}
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-app-green shadow-2xs">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {currentShowcase.rating}
                  </div>
                  <Link
                    to={`/products/${currentShowcase._id}`}
                    className="flex h-full w-full items-center justify-center"
                  >
                    <img
                      key={currentShowcase._id}
                      src={currentShowcase.image}
                      alt={getProductNameVi(currentShowcase)}
                      className="animate-fade-in max-h-36 w-auto rounded-lg object-contain transition duration-500 hover:scale-105"
                    />
                  </Link>
                </div>

                {/* Thông tin sản phẩm */}
                <div className="mt-3">
                  <Link
                    to={`/products/${currentShowcase._id}`}
                    className="line-clamp-1 text-base font-bold text-app-green hover:text-[#16a34a]"
                  >
                    {getProductNameVi(currentShowcase)}
                  </Link>
                  <p className="mt-1 line-clamp-1 text-xs text-app-text-light">
                    {getProductDescriptionVi(currentShowcase)}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-emerald-100 pt-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-[#0f5132]">
                        {formatVnd(currentShowcase.price)}
                      </span>
                      <span className="text-xs text-app-text-light">
                        /{formatUnitVi(currentShowcase.unit)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addItem(currentShowcase, 1)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0f5132] to-[#16a34a] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:from-[#15803d] hover:to-[#16a34a]"
                      >
                        <ShoppingBag size={14} className="text-amber-300" />
                        Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DẢI BĂNG CHUYỀN SẢN PHẨM CHẠY QUA CHẠY LẠI TRONG BANNER */}
          {products.length > 0 && (
            <div className="relative z-10 border-t border-white/15 bg-black/25 px-4 py-3.5 backdrop-blur-md">
              <div className="overflow-hidden">
                <div className="animate-product-slide flex w-max items-center gap-3">
                  {[...products.slice(0, 12), ...products.slice(0, 12)].map(
                    (item, index) => (
                      <Link
                        key={`${item._id}-${index}`}
                        to={`/products/${item._id}`}
                        className="group flex shrink-0 items-center gap-2.5 rounded-2xl border border-white/20 bg-white/95 px-3 py-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f4fbf7] p-1">
                          <img
                            src={item.image}
                            alt={getProductNameVi(item)}
                            className="h-full w-full object-contain transition group-hover:scale-110"
                            loading="lazy"
                          />
                        </div>
                        <div className="pr-1">
                          <p className="max-w-36 truncate text-xs font-bold text-app-green group-hover:text-[#16a34a]">
                            {getProductNameVi(item)}
                          </p>
                          <p className="text-[11px] font-semibold text-amber-600">
                            {formatVnd(item.price)}
                          </p>
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* DANH MỤC GIAN HÀNG */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#16a34a]">
              Danh mục sản phẩm
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-app-green sm:text-3xl">
              Mua sắm theo nhóm hàng
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-app-green hover:bg-emerald-100"
          >
            Xem tất cả <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
          {categoriesData.map((category) => (
            <Link
              key={category.slug}
              to={`/products?category=${category.slug}`}
              className="group overflow-hidden rounded-2xl border border-emerald-100 bg-white p-2.5 shadow-[0_2px_12px_-4px_rgba(15,81,50,0.06)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="overflow-hidden rounded-xl bg-[#f4fbf7]">
                <img
                  src={category.image}
                  alt={getCategoryNameVi(category.slug)}
                  className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="px-2 pt-3 pb-1 text-center text-sm font-semibold text-app-green group-hover:text-[#16a34a]">
                {getCategoryNameVi(category.slug)}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* SẢN PHẨM NỔI BẬT */}
      <section className="border-y border-emerald-100/80 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#16a34a]">
                Tuyển chọn mỗi ngày
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-app-green sm:text-3xl">
                Sản phẩm nổi bật tại POPPIN MART
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-app-green hover:bg-emerald-100"
            >
              Tất cả sản phẩm <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.slice(0, 8).map((product) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_12px_30px_-10px_rgba(15,81,50,0.14)]"
              >
                {product.discount > 0 && (
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold text-[#0f5132] shadow-2xs ring-1 ring-amber-300">
                    -{product.discount}%
                  </span>
                )}
                {isAdmin && (
                  <span
                    className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      product.stock <= 0
                        ? "bg-red-600 text-white"
                        : product.stock <= 10
                          ? "bg-amber-500 text-white"
                          : "bg-emerald-700/90 text-white"
                    }`}
                  >
                    {product.stock <= 0
                      ? "Hết hàng"
                      : product.stock <= 10
                        ? `Sắp hết (${product.stock})`
                        : `Kho: ${product.stock}`}
                  </span>
                )}
                <div className="flex aspect-square items-center justify-center bg-[#f6fcf8] p-6">
                  <img
                    src={product.image}
                    alt={getProductNameVi(product)}
                    className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="border-t border-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-700/75">
                    {getCategoryNameVi(product.category)}
                  </p>
                  <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold text-app-green group-hover:text-[#16a34a]">
                    {getProductNameVi(product)}
                  </h3>
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <span className="text-base font-bold text-[#0f5132]">
                      {formatVnd(product.price)}
                    </span>
                    <span className="text-xs text-app-text-light">
                      /{formatUnitVi(product.unit)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CAM KẾT DỊCH VỤ */}
      <section className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
        {[
          {
            icon: Truck,
            title: "Giao nhanh chuẩn xanh",
            text: "Đóng gói sạch sẽ, giữ trọn độ tươi ngon khi giao đến tận cửa.",
          },
          {
            icon: Leaf,
            title: "100% Tươi sạch chọn lọc",
            text: "Nguồn gốc rõ ràng, kiểm định chất lượng mỗi ngày tại POPPIN MART.",
          },
          {
            icon: ShieldCheck,
            title: "Thanh toán QR & OTP an toàn",
            text: "Xác thực bảo mật, minh bạch và tiện lợi cho mọi đơn hàng.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-white to-amber-50/45 p-5 shadow-2xs"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-100/80 text-[#0f5132] ring-1 ring-amber-200/70">
              <Icon size={21} />
            </span>
            <div>
              <h3 className="font-semibold text-app-green">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-app-text-light">{text}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Home;
