import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Truck,
  Zap,
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

type FitnessGoalId = "muscle" | "shred" | "energy" | "recovery";

interface FitnessGoalPlan {
  id: FitnessGoalId;
  badge: string;
  title: string;
  subtitle: string;
  macros: string;
  categories: string[];
  highlights: string[];
}

const FITNESS_GOALS: FitnessGoalPlan[] = [
  {
    id: "muscle",
    badge: "HYPERTROPHY • HIGH PROTEIN",
    title: "TĂNG CƠ & SỨC MẠNH",
    subtitle:
      "Tối ưu tổng hợp protein cơ bắp với Whey Isolate thủy phân, Creatine Monohydrate tinh khiết và nguồn đạm chất lượng cao.",
    macros: "40% Protein • 40% Carb phức • 20% Chất béo tốt",
    categories: ["whey-protein", "creatine-strength", "meat-seafood", "dairy-eggs"],
    highlights: [
      "Iso-Hydro Whey 100% Isolate, Whey Gold Standard & Creapure® Đức",
      "Micellar Casein nuôi cơ 8 tiếng ban đêm & Mass Gainer Pro tăng cân",
      "Phục hồi sợi cơ siêu tốc và gia tăng mức tạ qua từng buổi tập",
    ],
  },
  {
    id: "shred",
    badge: "LEAN CUT • THERMOGENIC SHRED",
    title: "SIẾT CƠ & GIẢM MỠ",
    subtitle:
      "Đốt mỡ thừa chuyên sâu với L-Carnitine 3000, CLA, viên sinh nhiệt Thermo Shred kết hợp yến mạch và bánh Protein ít đường.",
    macros: "45% Protein • 30% Chất xơ & Carb chậm • 25% Chất béo tốt",
    categories: ["fat-burner-shred", "healthy-bars-foods", "fruits-vegetables"],
    highlights: [
      "L-Carnitine 3000 Liquid, CLA 1250mg & Thermo Shred đốt mỡ",
      "Thanh bánh Protein Bar 20g đạm, Yến mạch cán dẹt & Bơ đậu phộng",
      "Giảm tỷ lệ mỡ cơ thể (Body Fat) mà vẫn giữ nguyên khối lượng cơ nạc",
    ],
  },
  {
    id: "energy",
    badge: "ENDURANCE • EXPLOSIVE PUMP",
    title: "NĂNG LƯỢNG & BỀN BỈ",
    subtitle:
      "Bùng nổ sức mạnh và độ tỉnh táo cực đại trước giờ tập với Pre-Workout, Citrulline Malate, Beta-Alanine và Gel năng lượng.",
    macros: "6g Citrulline • 3.2g Beta-Alanine • 200mg Caffeine",
    categories: ["pre-workout-energy", "gym-gear-accessories", "snacks"],
    highlights: [
      "Nitro Surge Pre-Workout, Stim-Free Pump & Beta-Alanine CarnoSyn®",
      "Đai lưng cứng Squat/Deadlift 10mm, Straps kéo lưng & Quấn cổ tay",
      "Kéo dài sức bền hiệp tập, bơm máu căng phồng cơ bắp tối đa",
    ],
  },
  {
    id: "recovery",
    badge: "INTRA-WORKOUT • JOINT & HEALTH",
    title: "CHĂM SÓC & PHỤC HỒI",
    subtitle:
      "Chống dị hóa cơ, bù điện giải tức thì và bảo vệ hệ xương khớp, tim mạch với EAA, BCAA, ZMA, Omega-3 và Glucosamine.",
    macros: "9g EAA • 7g BCAA 2:1:1 • 1000mg EPA/DHA Omega-3",
    categories: ["bcaa-amino-recovery", "vitamins-health", "personal-care"],
    highlights: [
      "Hydro EAA + Electrolytes, BCAA 2:1:1, L-Glutamine & ZMA ngủ sâu",
      "Dầu cá Omega-3 Triple Strength, Multivitamin & Glucosamine bảo vệ khớp",
      "Giảm đau mỏi cơ (DOMS) và phục hồi toàn diện sau tập nặng",
    ],
  },
];

const Home = () => {
  const { products, currentUser } = useStore();
  const { addItem } = useCart();
  const isAdmin = Boolean(currentUser?.isAdmin);

  const [selectedGoal, setSelectedGoal] = useState<FitnessGoalId>("muscle");

  // Ưu tiên hiển thị bộ 40 sản phẩm Gym & Supplement Fitness mới trên giao diện
  const catalogProducts = useMemo(() => {
    const hasGymProductsInStore = products.some((p) =>
      p.category.includes("whey") || p.category.includes("creatine") || p._id.startsWith("gym_prod_"),
    );
    return hasGymProductsInStore ? products : [...gymSupplementProducts, ...products];
  }, [products]);

  const activeGoal = useMemo(
    () => FITNESS_GOALS.find((g) => g.id === selectedGoal) ?? FITNESS_GOALS[0]!,
    [selectedGoal],
  );

  const goalProducts = useMemo(() => {
    const matched = catalogProducts.filter((item) =>
      activeGoal.categories.includes(item.category),
    );
    return (matched.length > 0 ? matched : catalogProducts).slice(0, 4);
  }, [activeGoal, catalogProducts]);

  const featuredProducts: Product[] = useMemo(() => {
    return catalogProducts.slice(0, 8);
  }, [catalogProducts]);

  return (
    <div className="bg-[#0b0d0c] text-white">
      {/* ==================== HERO SECTION CHUẨN FORM/FWD ==================== */}
      <section className="relative min-h-[540px] w-full overflow-hidden border-b border-white/10 bg-[#0b0d0c] sm:min-h-[620px] lg:min-h-[680px]">
        {/* Lưới kỹ thuật mờ bên trái (Technical Grid Overlay) */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* Hình nền vận động viên thể hình bên phải */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-position-[72%_top] bg-no-repeat opacity-85 sm:bg-position-[right_top] sm:opacity-100"
          style={{ backgroundImage: "url('/form-fwd-hero.jpg')" }}
        />

        {/* Lớp chuyển sắc tối từ trái sang phải để nổi bật chữ tiếng Việt tuyệt đối */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-[#0b0d0c] via-[#0b0d0c]/88 to-transparent sm:via-[#0b0d0c]/60" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-28 bg-gradient-to-t from-[#0b0d0c] to-transparent" />

        {/* Nội dung chính của Hero */}
        <div className="relative z-10 mx-auto flex min-h-[540px] max-w-7xl items-center px-4 py-14 sm:min-h-[620px] sm:px-6 lg:min-h-[680px] lg:px-8">
          <div className="max-w-2xl">
            {/* Dòng tiêu đề phụ phía trên */}
            <p className="font-sans text-[11px] font-semibold tracking-[0.26em] text-zinc-400 uppercase sm:text-xs">
              HIỆU SUẤT &bull; DINH DƯỠNG &bull; KỶ LUẬT
            </p>

            {/* Tiêu đề chính: Font Barlow Condensed 900 hỗ trợ 100% dấu tiếng Việt đồng nhất */}
            <h1 className="mt-4 font-display text-6xl leading-[0.94] font-black tracking-tight uppercase sm:text-7xl lg:text-[92px]">
              <span className="block text-white">VƯỢT QUA</span>
              <span className="mt-1 block text-[#b8f927]">GIỚI HẠN.</span>
            </h1>

            {/* Đoạn mô tả tiếng Việt chuẩn xác */}
            <p className="mt-6 max-w-xl font-sans text-sm leading-7 font-normal text-zinc-300/90 sm:text-base sm:leading-8">
              Kế hoạch tập luyện, dinh dưỡng và sản phẩm hiệu suất được thiết kế
              riêng để đưa bạn đến phiên bản mạnh mẽ nhất.
            </p>

            {/* Cụm 2 nút hành động chuẩn thiết kế */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5 sm:mt-10 sm:gap-4">
              <a
                href="#ca-nhan-hoa"
                onClick={(event) => {
                  event.preventDefault();
                  document
                    .getElementById("ca-nhan-hoa")
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

      {/* ==================== THANH CHỈ SỐ HIỆU SUẤT ==================== */}
      <section className="border-b border-white/10 bg-[#0e1110]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-white/10 sm:grid-cols-4 sm:divide-y-0">
          {[
            {
              icon: Zap,
              metric: "100% CHUẨN SẠCH",
              desc: "Dinh dưỡng & thực phẩm tuyển chọn",
            },
            {
              icon: Target,
              metric: "CÁ NHÂN HÓA",
              desc: "Phân nhóm theo mục tiêu hình thể",
            },
            {
              icon: Truck,
              metric: "GIAO NHANH 2H",
              desc: "Miễn phí đơn từ 300.000 ₫",
            },
            {
              icon: ShieldCheck,
              metric: "QR & OTP 6 SỐ",
              desc: "Bảo mật giao dịch thời gian thực",
            },
          ].map(({ icon: Icon, metric, desc }) => (
            <div
              key={metric}
              className="flex items-center gap-3.5 px-4 py-5 sm:px-6 sm:py-6"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xs border border-[#b8f927]/30 bg-[#b8f927]/10 text-[#b8f927]">
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-base font-extrabold tracking-wider text-white uppercase sm:text-lg">
                  {metric}
                </p>
                <p className="truncate text-xs text-zinc-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== KHU VỰC CÁ NHÂN HÓA LỘ TRÌNH & DINH DƯỠNG ==================== */}
      <section
        id="ca-nhan-hoa"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
              // THIẾT KẾ LỘ TRÌNH RIÊNG CHO BẠN
            </p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white uppercase sm:text-5xl">
              CÁ NHÂN HÓA MỤC TIÊU DINH DƯỠNG
            </h2>
          </div>
          <p className="max-w-md text-xs leading-6 text-zinc-400 sm:text-sm">
            Chọn mục tiêu tập luyện của bạn để hệ thống lọc ngay thực đơn và sản
            phẩm phù hợp nhất từ Cơ sở dữ liệu Neon.
          </p>
        </div>

        {/* Bộ nút chọn mục tiêu */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3.5">
          {FITNESS_GOALS.map((goal) => {
            const isSelected = goal.id === selectedGoal;
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => setSelectedGoal(goal.id)}
                className={`flex flex-col items-start justify-between rounded-xs border p-4 text-left transition ${
                  isSelected
                    ? "border-[#b8f927] bg-[#b8f927] text-black shadow-[0_0_25px_rgba(184,249,39,0.2)]"
                    : "border-zinc-800 bg-[#121614] text-zinc-300 hover:border-zinc-600 hover:text-white"
                }`}
              >
                <span
                  className={`text-[10px] font-bold tracking-[0.16em] uppercase ${
                    isSelected ? "text-black/75" : "text-[#b8f927]"
                  }`}
                >
                  {goal.badge.split("•")[0]}
                </span>
                <span className="mt-1.5 font-display text-lg font-black tracking-wide uppercase sm:text-xl">
                  {goal.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chi tiết mục tiêu + 4 sản phẩm gợi ý */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.45fr]">
          {/* Bảng thông số mục tiêu */}
          <div className="flex flex-col justify-between rounded-xs border border-zinc-800 bg-[#111513] p-6 sm:p-8">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-xs bg-[#b8f927]/15 px-3 py-1 text-[11px] font-bold tracking-wider text-[#b8f927] uppercase">
                <Dumbbell size={13} />
                {activeGoal.badge}
              </span>
              <h3 className="mt-4 font-display text-3xl font-black text-white uppercase sm:text-4xl">
                {activeGoal.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                {activeGoal.subtitle}
              </p>

              <div className="mt-5 rounded-xs border border-zinc-800 bg-[#0b0d0c] p-3.5">
                <p className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
                  TỶ LỆ DINH DƯỠNG KHUYẾN NGHỊ
                </p>
                <p className="mt-1 text-xs font-semibold text-[#b8f927] sm:text-sm">
                  {activeGoal.macros}
                </p>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-zinc-300 sm:text-sm">
                {activeGoal.highlights.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 shrink-0 text-[#b8f927]"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 border-t border-zinc-800 pt-5">
              <Link
                to={`/products?category=${activeGoal.categories[0] ?? ""}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xs bg-[#b8f927] px-5 py-3.5 text-xs font-extrabold tracking-wider text-black uppercase transition hover:bg-[#c8ff47]"
              >
                <span>XEM TRỌN BỘ SẢN PHẨM MỤC TIÊU NÀY</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* 4 sản phẩm gợi ý trực tiếp từ CSDL */}
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {goalProducts.map((product) => (
              <div
                key={product._id}
                className="group flex min-w-0 flex-col justify-between rounded-xs border border-zinc-800 bg-[#121614] p-3.5 transition hover:border-[#b8f927]/60 sm:p-4"
              >
                <div>
                  <Link
                    to={`/products/${product._id}`}
                    className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xs bg-[#181d1b] p-4"
                  >
                    {product.discount > 0 && (
                      <span className="absolute left-2.5 top-2.5 rounded-xs bg-[#b8f927] px-2 py-0.5 text-[10px] font-black text-black">
                        -{product.discount}%
                      </span>
                    )}
                    <img
                      src={product.image}
                      alt={getProductNameVi(product)}
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>
                  <p className="mt-3 truncate text-[10px] font-bold tracking-wider text-[#b8f927] uppercase">
                    {getCategoryNameVi(product.category)}
                  </p>
                  <Link
                    to={`/products/${product._id}`}
                    className="mt-1 line-clamp-2 min-h-9 text-xs font-bold text-white transition group-hover:text-[#b8f927] sm:text-sm"
                  >
                    {getProductNameVi(product)}
                  </Link>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-800/90 pt-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-extrabold text-white sm:text-lg">
                      {formatVnd(product.price)}
                    </p>
                    <p className="truncate text-[10px] text-zinc-400">
                      /{formatUnitVi(product.unit)}
                    </p>
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
        </div>
      </section>

      {/* ==================== DANH MỤC SẢN PHẨM & DINH DƯỠNG ==================== */}
      <section className="border-t border-white/10 bg-[#0e1210] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
                // HỆ SINH THÁI DINH DƯỠNG
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-black text-white uppercase sm:text-5xl">
                DANH MỤC CHUYÊN BIỆT
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex shrink-0 items-center gap-1.5 border border-zinc-700 bg-[#141816] px-4 py-2.5 text-xs font-bold tracking-wider text-white uppercase transition hover:border-[#b8f927] hover:text-[#b8f927]"
            >
              <span>TẤT CẢ</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
            {categoriesData.map((category) => (
              <Link
                key={category.slug}
                to={`/products?category=${category.slug}`}
                className="group relative overflow-hidden rounded-xs border border-zinc-800 bg-[#131816] p-3 transition hover:-translate-y-1 hover:border-[#b8f927]"
              >
                <div className="overflow-hidden rounded-xs bg-[#1b221f]">
                  <img
                    src={category.image}
                    alt={getCategoryNameVi(category.slug)}
                    className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="pt-3 pb-1 text-center">
                  <h3 className="font-display text-sm font-bold tracking-wider text-white uppercase transition group-hover:text-[#b8f927] sm:text-base">
                    {getCategoryNameVi(category.slug)}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SẢN PHẨM HIỆU SUẤT NỔI BẬT ==================== */}
      <section className="border-t border-white/10 bg-[#0b0d0c] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
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
              <span>KHÁM PHÁ TOÀN BỘ KHO HÀNG</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <div
                key={product._id}
                className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-xs border border-zinc-800 bg-[#121614] transition hover:-translate-y-1 hover:border-[#b8f927]/70"
              >
                {product.discount > 0 && (
                  <span className="absolute left-3 top-3 z-10 rounded-xs bg-[#b8f927] px-2.5 py-0.5 text-[10px] font-black text-black">
                    -{product.discount}%
                  </span>
                )}
                {isAdmin && (
                  <span
                    className={`absolute right-3 top-3 z-10 rounded-xs px-2 py-0.5 text-[10px] font-bold ${
                      product.stock <= 0
                        ? "bg-red-600 text-white"
                        : product.stock <= 10
                          ? "bg-amber-500 text-black"
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
                    className="flex aspect-square items-center justify-center bg-[#181e1b] p-5 sm:p-6"
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

      {/* ==================== BANNER KỶ LUẬT & HÀNH ĐỘNG ==================== */}
      <section className="border-t border-white/10 bg-gradient-to-r from-[#0e1311] via-[#131b16] to-[#0e1311] py-14 sm:py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] text-[#b8f927] uppercase">
              <Activity size={15} />
              SẴN SÀNG BỨT PHÁ MỖI NGÀY
            </span>
            <h2 className="mt-2 font-display text-3xl font-black text-white uppercase sm:text-5xl">
              NẠP ĐÚNG DINH DƯỠNG. CHINH PHỤC MỌI GIỚI HẠN.
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-zinc-300 sm:text-sm">
              Toàn bộ sản phẩm, đơn hàng và tài khoản khách hàng đều được đồng bộ
              thời gian thực trên hệ thống Cơ sở dữ liệu Neon PostgreSQL.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-xs bg-[#b8f927] px-7 py-4 text-xs font-extrabold tracking-wider text-black uppercase transition hover:bg-[#c8ff47] sm:text-sm"
            >
              <Sparkles size={16} />
              <span>MUA SẮM NGAY</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
