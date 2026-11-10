import { useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
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
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";

const AppLayout = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { currentUser, logout, inventoryAlerts } = useStore();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (query) {
      navigate(`/products?q=${encodeURIComponent(query)}`);
    }
  };

  const totalAlerts =
    (inventoryAlerts?.outOfStockCount ?? 0) + (inventoryAlerts?.lowStockCount ?? 0);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition ${
      isActive
        ? "bg-gradient-to-r from-emerald-50 to-amber-50/90 font-semibold text-app-green shadow-2xs ring-1 ring-amber-300/80"
        : "text-app-text-light hover:bg-emerald-50/60 hover:text-app-green"
    }`;

  const mobileBottomNavClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition ${
      isActive ? "text-[#0f5132]" : "text-app-text-light"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fcfa] pb-16 sm:pb-0">
      <div className="bg-gradient-to-r from-[#0f5132] via-[#15803d] to-[#ca8a04] px-3 py-1.5 text-center text-[11px] font-medium text-white sm:px-4 sm:py-2 sm:text-sm">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles size={12} className="shrink-0 text-amber-300" />
          <span className="truncate">
            POPPIN MART — Thực phẩm tươi sạch, giao nhanh tận cửa
          </span>
        </span>
        {currentUser?.isAdmin && totalAlerts > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-300/25 px-2 py-0.5 text-[10px] font-semibold text-amber-100 ring-1 ring-amber-300/40 backdrop-blur-xs">
            <AlertTriangle size={11} className="text-amber-200" />
            Kho: {inventoryAlerts?.outOfStockCount ?? 0} hết,{" "}
            {inventoryAlerts?.lowStockCount ?? 0} sắp hết
          </span>
        )}
      </div>

      <header className="sticky top-0 z-40 border-b border-emerald-100/90 bg-white/95 backdrop-blur-md shadow-[0_4px_20px_-6px_rgba(15,81,50,0.06)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2.5 px-3.5 py-2.5 sm:gap-4 sm:px-6 sm:py-3.5 lg:flex-nowrap lg:px-8">
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-2.5 sm:gap-3"
            aria-label="POPPIN MART Trang chủ"
          >
            <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl border border-emerald-200/80 bg-white p-0.5 shadow-xs ring-2 ring-amber-200/60 transition group-hover:scale-105 sm:size-11 sm:rounded-2xl">
              <img
                src="/poppin-mart-logo.jpg"
                alt="POPPIN MART Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-extrabold tracking-tight sm:text-2xl">
                <span className="text-[#16a34a]">POPPIN</span>{" "}
                <span className="text-[#0f5132]">MART</span>
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-600 sm:text-[10px]">
                Fresh • Clean • Sunny
              </span>
            </div>
          </Link>

          <form
            onSubmit={handleSearch}
            className="order-3 flex w-full items-center rounded-full border border-emerald-200/90 bg-gradient-to-r from-[#f4fbf7] to-[#fefce8]/60 px-3.5 py-2 transition focus-within:border-amber-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-400/15 sm:px-4 sm:py-2.5 lg:order-none lg:mx-8 lg:max-w-xl lg:flex-1"
          >
            <Search size={17} className="shrink-0 text-emerald-700/70" />
            <input
              aria-label="Tìm sản phẩm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm rau củ, sữa rửa mặt, thực phẩm..."
              className="ml-2.5 w-full bg-transparent text-sm text-app-text outline-none placeholder:text-app-text-light/80"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-gradient-to-r from-[#16a34a] to-[#ca8a04] px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:from-[#15803d] hover:to-[#a16207]"
            >
              Tìm
            </button>
          </form>

          <div className="ml-auto flex items-center gap-2 sm:gap-3.5">
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <Link
                  to="/addresses"
                  title="Quản lý tài khoản khách hàng"
                  className="flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 to-amber-50/70 px-2.5 py-1.5 text-xs font-semibold text-app-green hover:border-amber-300 sm:px-3.5"
                >
                  {currentUser.isAdmin ? (
                    <Shield size={13} className="shrink-0 text-amber-600" />
                  ) : (
                    <UserCheck size={13} className="shrink-0 text-app-green" />
                  )}
                  <span className="max-w-20 truncate sm:max-w-28">{currentUser.name}</span>
                  {currentUser.isAdmin && (
                    <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-extrabold text-[#0f5132] sm:text-[10px]">
                      ADMIN
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  title="Đăng xuất"
                  className="inline-flex items-center gap-1 rounded-full border border-transparent p-1.5 text-xs font-semibold text-app-text-light hover:border-red-100 hover:bg-red-50 hover:text-app-error sm:px-2.5"
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-full border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-xs font-semibold text-app-green hover:border-amber-300 hover:bg-amber-50/60 sm:px-4 sm:py-2 sm:text-sm"
              >
                Đăng nhập
              </Link>
            )}

            <Link
              to="/cart"
              aria-label="Giỏ hàng"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0f5132] to-[#16a34a] px-3 py-2 text-xs font-semibold text-white shadow-sm ring-1 ring-amber-300/40 hover:from-[#15803d] hover:to-[#16a34a] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <ShoppingBag size={16} className="text-amber-200" />
              <span className="hidden sm:inline">Giỏ hàng</span>
              {itemCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-extrabold text-[#0f5132]">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <nav
          aria-label="Điều hướng chính"
          className="no-scrollbar border-t border-emerald-100/80 bg-white/90"
        >
          <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-3.5 py-2 sm:gap-2 sm:px-6 sm:py-2.5 lg:px-8">
            <NavLink to="/" end className={navLinkClass}>
              Trang chủ
            </NavLink>
            <NavLink to="/products" className={navLinkClass}>
              Sản phẩm
            </NavLink>
            <NavLink to="/deals" className={navLinkClass}>
              Ưu đãi xanh
            </NavLink>
            {currentUser && (
              <>
                <NavLink to="/orders" className={navLinkClass}>
                  <PackageCheck size={14} />
                  Đơn hàng
                </NavLink>
                <NavLink to="/addresses" className={navLinkClass}>
                  <UserCheck size={14} />
                  Tài khoản
                </NavLink>
              </>
            )}
            {currentUser?.isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                <Shield size={14} className="text-[#16a34a]" />
                <span>Quản trị</span>
                {totalAlerts > 0 && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                    {totalAlerts}
                  </span>
                )}
              </NavLink>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-emerald-100 bg-white px-4 py-8 text-sm text-app-text-light sm:mt-16 sm:py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/poppin-mart-logo.jpg"
              alt="POPPIN MART"
              className="size-11 rounded-2xl border border-emerald-200 bg-white object-contain p-0.5 shadow-2xs"
            />
            <div className="text-left">
              <p className="font-serif text-base font-extrabold tracking-tight sm:text-lg">
                <span className="text-[#16a34a]">POPPIN</span>{" "}
                <span className="text-[#0f5132]">MART</span>
              </p>
              <p className="text-xs text-app-text-light">
                Siêu thị thực phẩm tươi sạch, hiện đại & tận tâm.
              </p>
            </div>
          </div>
          <p className="text-xs text-app-text-light">
            © {new Date().getFullYear()} POPPIN MART. Trải nghiệm mua sắm chuẩn xanh.
          </p>
        </div>
      </footer>

      {/* THANH ĐIỀU HƯỚNG ĐÁY DÀNH RIÊNG CHO MÀN HÌNH ĐIỆN THOẠI 6.9 INCHES */}
      <nav
        aria-label="Điều hướng nhanh trên điện thoại"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-emerald-200/90 bg-white/95 px-1 backdrop-blur-lg shadow-[0_-4px_20px_-4px_rgba(15,81,50,0.12)] sm:hidden"
      >
        <NavLink to="/" end className={mobileBottomNavClass}>
          {({ isActive }) => (
            <>
              <span
                className={`flex size-8 items-center justify-center rounded-xl transition ${
                  isActive ? "bg-emerald-100/90 text-[#0f5132]" : ""
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
                className={`flex size-8 items-center justify-center rounded-xl transition ${
                  isActive ? "bg-emerald-100/90 text-[#0f5132]" : ""
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
                className={`flex size-8 items-center justify-center rounded-xl transition ${
                  isActive ? "bg-amber-100 text-amber-700" : ""
                }`}
              >
                <Flame size={18} />
              </span>
              <span>Ưu đãi</span>
            </>
          )}
        </NavLink>

        <NavLink to="/cart" className={mobileBottomNavClass}>
          {({ isActive }) => (
            <>
              <span
                className={`relative flex size-8 items-center justify-center rounded-xl transition ${
                  isActive ? "bg-emerald-100/90 text-[#0f5132]" : ""
                }`}
              >
                <ShoppingBag size={18} />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-extrabold text-[#0f5132] ring-1 ring-white">
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
                className={`flex size-8 items-center justify-center rounded-xl transition ${
                  isActive ? "bg-emerald-100/90 text-[#0f5132]" : ""
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
