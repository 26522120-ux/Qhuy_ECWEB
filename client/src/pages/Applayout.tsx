import { useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Flame,
  Home,
  LayoutGrid,
  LogOut,
  PackageCheck,
  Search,
  Shield,
  ShoppingBag,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";

const AppLayout = () => {
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();
  const { currentUser, logout, inventoryAlerts } = useStore();

  const isHomePage = location.pathname === "/";

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (query) {
      navigate(`/products?q=${encodeURIComponent(query)}`);
      setIsSearchOpen(false);
    }
  };

  const totalAlerts =
    (inventoryAlerts?.outOfStockCount ?? 0) + (inventoryAlerts?.lowStockCount ?? 0);

  const desktopNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative inline-flex h-16 items-center px-1 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
      isActive
        ? "text-white after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-[#b8f927]"
        : "text-zinc-400 hover:text-white"
    }`;

  const mobileBottomNavClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition ${
      isActive ? "text-[#b8f927]" : "text-zinc-400"
    }`;

  return (
    <div
      className={`flex min-h-screen flex-col pb-16 sm:pb-0 ${
        isHomePage ? "bg-[#0b0d0c] text-white" : "bg-[#f8fcfa] text-app-text"
      }`}
    >
      {/* Thanh cảnh báo tồn kho dành riêng cho Admin */}
      {currentUser?.isAdmin && totalAlerts > 0 && (
        <div className="border-b border-white/10 bg-[#141917] px-3 py-1.5 text-center text-[11px] font-medium text-zinc-200 sm:px-4">
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-[#b8f927]" />
            <span>
              Cảnh báo kho Admin: <strong>{inventoryAlerts?.outOfStockCount ?? 0}</strong> hết hàng,{" "}
              <strong>{inventoryAlerts?.lowStockCount ?? 0}</strong> sắp hết
            </span>
            <Link
              to="/admin"
              className="ml-2 font-bold text-[#b8f927] underline underline-offset-2"
            >
              Kiểm tra ngay
            </Link>
          </span>
        </div>
      )}

      {/* HEADER CHUẨN PHONG CÁCH FORM/FWD */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0f0e]/95 text-white backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* CỘT TRÁI: LOGO FORM/FWD */}
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label="FORM/FWD Trang chủ"
          >
            <span className="inline-flex h-8 w-8 -skew-x-12 items-center justify-center rounded-xs bg-[#b8f927] font-display text-base font-black tracking-tighter text-black shadow-[0_0_20px_rgba(184,249,39,0.3)] transition group-hover:scale-105">
              <span className="skew-x-12">//</span>
            </span>
            <span className="font-display text-xl font-extrabold tracking-[0.08em] text-white uppercase sm:text-2xl">
              FORM/FWD
            </span>
          </Link>

          {/* CỘT GIỮA: ĐIỀU HƯỚNG CHÍNH */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden items-center gap-8 md:flex"
          >
            <NavLink to="/" end className={desktopNavLinkClass}>
              TRANG CHỦ
            </NavLink>
            <NavLink to="/products" className={desktopNavLinkClass}>
              SẢN PHẨM
            </NavLink>
            <a
              href="/#ca-nhan-hoa"
              onClick={(event) => {
                if (location.pathname === "/") {
                  event.preventDefault();
                  document
                    .getElementById("ca-nhan-hoa")
                    ?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="relative inline-flex h-16 items-center px-1 text-xs font-bold tracking-[0.14em] text-zinc-400 uppercase transition-colors hover:text-white"
            >
              CÁ NHÂN HÓA
            </a>
            <NavLink to="/deals" className={desktopNavLinkClass}>
              ƯU ĐÃI
            </NavLink>
            {currentUser && (
              <NavLink to="/orders" className={desktopNavLinkClass}>
                ĐƠN HÀNG
              </NavLink>
            )}
            {currentUser?.isAdmin && (
              <NavLink to="/admin" className={desktopNavLinkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <Shield size={13} className="text-[#b8f927]" />
                  QUẢN TRỊ
                </span>
              </NavLink>
            )}
          </nav>

          {/* CỘT PHẢI: TÌM KIẾM, ĐĂNG NHẬP & GIỎ HÀNG */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Nút bật/tắt ô tìm kiếm nhanh */}
            {isSearchOpen ? (
              <form
                onSubmit={handleSearch}
                className="flex items-center rounded-sm border border-zinc-700 bg-[#151917] px-2.5 py-1.5"
              >
                <Search size={15} className="shrink-0 text-[#b8f927]" />
                <input
                  autoFocus
                  aria-label="Tìm sản phẩm"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm sản phẩm dinh dưỡng..."
                  className="ml-2 w-36 bg-transparent text-xs text-white outline-none placeholder:text-zinc-500 sm:w-48"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  aria-label="Đóng tìm kiếm"
                  className="ml-1 text-zinc-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Mở tìm kiếm"
                className="inline-flex size-9 items-center justify-center rounded-sm text-zinc-300 transition hover:bg-white/5 hover:text-[#b8f927]"
              >
                <Search size={17} />
              </button>
            )}

            {/* Tài khoản / Đăng nhập */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/addresses"
                  title="Quản lý tài khoản khách hàng"
                  className="flex items-center gap-2 rounded-sm border border-zinc-800 bg-[#141816] px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-[#b8f927]/60 hover:text-white"
                >
                  {currentUser.isAdmin ? (
                    <Shield size={14} className="shrink-0 text-[#b8f927]" />
                  ) : (
                    <UserCheck size={14} className="shrink-0 text-[#b8f927]" />
                  )}
                  <span className="max-w-24 truncate sm:max-w-32">{currentUser.name}</span>
                  {currentUser.isAdmin && (
                    <span className="rounded-xs bg-[#b8f927] px-1.5 py-0.5 text-[9px] font-black text-black">
                      ADMIN
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  title="Đăng xuất"
                  className="inline-flex items-center gap-1 rounded-sm p-1.5 text-xs font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-medium text-zinc-200 transition hover:text-[#b8f927] sm:text-sm"
              >
                <User size={16} className="text-zinc-300" />
                <span>Đăng nhập</span>
              </Link>
            )}

            {/* Giỏ hàng vuông viền tối + chấm tròn xanh neon */}
            <Link
              to="/cart"
              aria-label="Giỏ hàng"
              className="relative flex size-10 items-center justify-center rounded-xs border border-zinc-800 bg-[#121514] text-zinc-200 transition hover:border-[#b8f927] hover:text-[#b8f927]"
            >
              <ShoppingBag size={17} />
              <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-[#b8f927] text-[11px] font-extrabold text-black shadow-sm">
                {itemCount}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* FOOTER CHUẨN TỐI HIỆN ĐẠI */}
      <footer className="border-t border-white/10 bg-[#090b0a] px-4 py-10 text-sm text-zinc-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 -skew-x-12 items-center justify-center rounded-xs bg-[#b8f927] font-display text-base font-black text-black">
              <span className="skew-x-12">//</span>
            </span>
            <div className="text-left">
              <p className="font-display text-lg font-extrabold tracking-wider text-white uppercase">
                FORM/FWD
              </p>
              <p className="text-xs text-zinc-500">
                Hiệu Suất • Dinh Dưỡng • Kỷ Luật — Nền tảng mua sắm & dinh dưỡng hiện đại.
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} FORM/FWD. Đồng bộ dữ liệu thời gian thực trên Neon Cloud DB.
          </p>
        </div>
      </footer>

      {/* THANH ĐIỀU HƯỚNG ĐÁY CHO MÀN HÌNH ĐIỆN THOẠI 6.9 INCHES */}
      <nav
        aria-label="Điều hướng nhanh trên điện thoại"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/10 bg-[#0d0f0e]/95 px-1 backdrop-blur-lg sm:hidden"
      >
        <NavLink to="/" end className={mobileBottomNavClass}>
          {({ isActive }) => (
            <>
              <span
                className={`flex size-8 items-center justify-center rounded-lg transition ${
                  isActive ? "bg-[#b8f927]/15 text-[#b8f927]" : ""
                }`}
              >
                <Home size={18} />
              </span>
              <span>Trang chủ</span>
            </>
          )}
        </NavLink>

        <NavLink to="/products" className={mobileBottomNavClass}>
          {({ isActive }) => (
            <>
              <span
                className={`flex size-8 items-center justify-center rounded-lg transition ${
                  isActive ? "bg-[#b8f927]/15 text-[#b8f927]" : ""
                }`}
              >
                <LayoutGrid size={18} />
              </span>
              <span>Sản phẩm</span>
            </>
          )}
        </NavLink>

        <NavLink to="/deals" className={mobileBottomNavClass}>
          {({ isActive }) => (
            <>
              <span
                className={`flex size-8 items-center justify-center rounded-lg transition ${
                  isActive ? "bg-[#b8f927]/15 text-[#b8f927]" : ""
                }`}
              >
                <Flame size={18} />
              </span>
              <span>Cá nhân hóa</span>
            </>
          )}
        </NavLink>

        <NavLink to="/cart" className={mobileBottomNavClass}>
          {({ isActive }) => (
            <>
              <span
                className={`relative flex size-8 items-center justify-center rounded-lg transition ${
                  isActive ? "bg-[#b8f927]/15 text-[#b8f927]" : ""
                }`}
              >
                <ShoppingBag size={18} />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#b8f927] text-[10px] font-extrabold text-black">
                    {itemCount}
                  </span>
                )}
              </span>
              <span>Giỏ hàng</span>
            </>
          )}
        </NavLink>

        <NavLink
          to={
            currentUser?.isAdmin
              ? "/admin"
              : currentUser
                ? "/orders"
                : "/login"
          }
          className={mobileBottomNavClass}
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex size-8 items-center justify-center rounded-lg transition ${
                  isActive ? "bg-[#b8f927]/15 text-[#b8f927]" : ""
                }`}
              >
                {currentUser?.isAdmin ? (
                  <Shield size={18} />
                ) : currentUser ? (
                  <PackageCheck size={18} />
                ) : (
                  <UserCheck size={18} />
                )}
              </span>
              <span>
                {currentUser?.isAdmin
                  ? "Quản trị"
                  : currentUser
                    ? "Đơn hàng"
                    : "Tài khoản"}
              </span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
};

export default AppLayout;
