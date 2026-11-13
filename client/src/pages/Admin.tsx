import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Package,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  getAdminUsers,
  getCurrentUser,
  updateAdminUserRole,
  type AdminUserRecord,
} from "../api";
import { categoriesData } from "../assets/assets";
import { useStore, type DemoOrder } from "../context/StoreContext";
import {
  formatVnd,
  formatVndAmount,
  getCategoryNameVi,
  getProductDescriptionVi,
  getProductNameVi,
  INR_TO_VND,
} from "../localization";
import type { Product } from "../types";

type AdminTab = "dashboard" | "products" | "orders" | "users" | "settings";

interface ProductForm {
  name: string;
  description: string;
  category: string;
  image: string;
  price: string;
  originalPrice: string;
  stock: string;
  discount: string;
}

const emptyProductForm: ProductForm = {
  name: "",
  description: "",
  category: categoriesData[0]?.slug ?? "whey-protein",
  image: "",
  price: "",
  originalPrice: "",
  stock: "25",
  discount: "10",
};

const tabs: Array<{
  id: AdminTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "products", label: "Sản phẩm & Kho", icon: Package },
  { id: "orders", label: "Đơn hàng", icon: ClipboardList },
  { id: "users", label: "Phân quyền Admin", icon: Users },
  { id: "settings", label: "Cài đặt", icon: Settings },
];

const statusOptions: DemoOrder["status"][] = [
  "Chờ xử lý",
  "Đang giao",
  "Đã giao",
  "Đã hủy",
];

const Admin = () => {
  const {
    products,
    orders,
    taxRate,
    updateProduct,
    quickUpdateStock,
    removeProduct,
    addProduct,
    setTaxRate,
    updateOrderStatus,
    loadAdminOrders,
    refreshAuth,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [taxInput, setTaxInput] = useState(String(taxRate));
  const [adminSubject, setAdminSubject] = useState<string | null>(null);
  const [adminUserName, setAdminUserName] = useState<string>("Quản trị viên");
  const [accessChecked, setAccessChecked] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<AdminUserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const list = await getAdminUsers();
      setUsersList(list);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách người dùng.",
      );
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    let active = true;
    void refreshAuth()
      .then(() => getCurrentUser())
      .then(async (userRes) => {
        if (!active) return;
        if (!userRes.isAdmin) {
          setAdminSubject(userRes.subject);
          return;
        }
        setAdminUserName(userRes.user.name);
        await Promise.all([loadAdminOrders(), loadUsers()]);
      })
      .catch((error: unknown) => {
        if (active) {
          const message =
            error instanceof Error
              ? error.message
              : "Vui lòng đăng nhập bằng tài khoản Quản trị viên (Admin).";
          setAccessError(message);
        }
      })
      .finally(() => {
        if (active) setAccessChecked(true);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAdminOrders]);

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: DemoOrder["status"],
  ) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success("Đã cập nhật trạng thái đơn hàng trên Neon DB.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật đơn hàng.",
      );
    }
  };

  const handleQuickStockChange = async (
    product: Product,
    nextStock: number,
  ) => {
    const safeStock = Math.max(0, nextStock);
    try {
      await quickUpdateStock(product._id, safeStock);
      toast.success(
        `Đã cập nhật tồn kho "${getProductNameVi(product)}": ${safeStock} (${
          safeStock === 0
            ? "Hết hàng"
            : safeStock <= 10
              ? "Sắp hết hàng"
              : "Còn hàng"
        })`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật tồn kho.",
      );
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await removeProduct(product._id);
      toast.success(
        `Đã xóa sản phẩm "${getProductNameVi(product)}" khỏi CSDL.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa sản phẩm.",
      );
    }
  };

  const handleToggleUserRole = async (targetUser: AdminUserRecord) => {
    const nextRole = targetUser.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
    try {
      const updated = await updateAdminUserRole(targetUser.id, nextRole);
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === updated.id
            ? { ...u, role: updated.role, isAdmin: updated.isAdmin }
            : u,
        ),
      );
      toast.success(
        `Đã cập nhật quyền của ${targetUser.name} thành ${
          nextRole === "ADMIN"
            ? "Quản trị viên (ADMIN)"
            : "Khách hàng (CUSTOMER)"
        } trên CSDL Neon.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật quyền tài khoản.",
      );
    }
  };

  const totalRevenue = orders
    .filter((order) => order.status !== "Đã hủy")
    .reduce((sum, order) => sum + order.total, 0);
  const outOfStockProducts = products.filter((product) => product.stock <= 0);
  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 10,
  );
  const totalStockUnits = products.reduce(
    (sum, product) => sum + product.stock,
    0,
  );
  const pendingOrders = orders.filter(
    (order) => order.status === "Chờ xử lý",
  ).length;

  const weeklySales = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const amount = orders
        .filter((order) => {
          const createdAt = new Date(order.createdAt).getTime();
          return (
            createdAt >= start.getTime() &&
            createdAt <= end.getTime() &&
            order.status !== "Đã hủy"
          );
        })
        .reduce((sum, order) => sum + order.total, 0);
      return {
        label: date.toLocaleDateString("vi-VN", { weekday: "short" }),
        amount,
      };
    });
  }, [orders]);
  const maxWeeklySales = Math.max(...weeklySales.map((item) => item.amount), 1);

  const openNewProductForm = () => {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setIsAddingProduct(true);
  };

  const openEditProductForm = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: getProductNameVi(product),
      description: getProductDescriptionVi(product),
      category: product.category,
      image: product.image,
      price: String(Math.round(product.price * INR_TO_VND)),
      originalPrice: String(Math.round(product.originalPrice * INR_TO_VND)),
      stock: String(product.stock),
      discount: String(product.discount),
    });
    setIsAddingProduct(true);
  };

  const handleProductSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const priceVnd = Number(productForm.price);
    const originalPriceVnd = Number(productForm.originalPrice);
    const stock = Number(productForm.stock);
    const discount = Number(productForm.discount);

    if (
      !Number.isFinite(priceVnd) ||
      !Number.isFinite(originalPriceVnd) ||
      priceVnd <= 0 ||
      originalPriceVnd < priceVnd ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isInteger(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      toast.error("Vui lòng kiểm tra giá, tồn kho và phần trăm giảm giá.");
      return;
    }

    const updatedProduct: Product = {
      _id: editingProduct?._id ?? crypto.randomUUID(),
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      category: productForm.category,
      image: productForm.image.trim(),
      price: Math.max(1, Math.round(priceVnd / INR_TO_VND)),
      originalPrice: Math.max(1, Math.round(originalPriceVnd / INR_TO_VND)),
      stock,
      discount,
      isOrganic: editingProduct?.isOrganic ?? false,
      rating: editingProduct?.rating ?? 4.5,
      reviewCount: editingProduct?.reviewCount ?? 12,
      unit: editingProduct?.unit ?? "sản phẩm",
      createdAt: editingProduct?.createdAt ?? new Date().toISOString(),
    };

    try {
      if (editingProduct) {
        await updateProduct(updatedProduct);
        toast.success("Đã cập nhật sản phẩm lên CSDL Neon và giao diện Web.");
      } else {
        await addProduct(updatedProduct);
        toast.success("Đã thêm sản phẩm mới lên CSDL Neon và giao diện Web.");
      }
      setIsAddingProduct(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu sản phẩm.",
      );
    }
  };

  const saveTaxRateForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTaxRate = Number(taxInput);
    if (!Number.isFinite(nextTaxRate) || nextTaxRate < 0 || nextTaxRate > 100) {
      toast.error("Thuế phải nằm trong khoảng từ 0% đến 100%.");
      return;
    }
    try {
      await setTaxRate(nextTaxRate);
      toast.success("Đã cập nhật thuế trên máy chủ.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật thuế.",
      );
    }
  };

  if (!accessChecked) {
    return (
      <main className="min-h-screen bg-[#0b0d0c] px-4 py-20 text-center text-zinc-400">
        Đang kiểm tra quyền quản trị viên từ máy chủ...
      </main>
    );
  }

  if (accessError) {
    return (
      <main className="min-h-screen bg-[#0b0d0c] px-4 py-20 text-center text-white">
        <div className="mx-auto max-w-lg rounded-xs border border-zinc-800 bg-[#111513] p-8">
          <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
            // XÁC THỰC QUẢN TRỊ
          </p>
          <h1 className="mt-2 font-display text-3xl font-black text-white uppercase">
            Yêu cầu đăng nhập Quản trị viên
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{accessError}</p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-xs bg-[#b8f927] px-6 py-3 text-xs font-extrabold tracking-wider text-black uppercase transition hover:bg-[#c9ff4d]"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </main>
    );
  }

  if (adminSubject) {
    return (
      <main className="min-h-screen bg-[#0b0d0c] px-4 py-20 text-center text-white">
        <div className="mx-auto max-w-lg rounded-xs border border-zinc-800 bg-[#111513] p-8">
          <p className="text-xs font-bold tracking-[0.22em] text-red-400 uppercase">
            // TRUY CẬP BỊ TỪ CHỐI
          </p>
          <h1 className="mt-2 font-display text-3xl font-black text-white uppercase">
            Khu vực dành riêng cho Quản trị viên
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Tài khoản hiện tại không có quyền truy cập trang quản trị.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/"
              className="rounded-xs border border-zinc-700 bg-[#0b0d0c] px-5 py-2.5 text-xs font-bold tracking-wider text-white uppercase transition hover:border-[#b8f927] hover:text-[#b8f927]"
            >
              Về trang chủ
            </Link>
            <Link
              to="/login"
              className="rounded-xs bg-[#b8f927] px-5 py-2.5 text-xs font-extrabold tracking-wider text-black uppercase transition hover:bg-[#c9ff4d]"
            >
              Đổi tài khoản
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0d0c] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
              // QUẢN TRỊ HỆ THỐNG nutraGO
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-white uppercase sm:text-5xl">
              BẢNG ĐIỀU KHIỂN &mdash; {adminUserName}
            </h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xs border border-[#b8f927]/35 bg-[#b8f927]/10 px-3.5 py-2 text-xs font-extrabold tracking-wider text-[#b8f927] uppercase">
            <Shield size={14} />
            QUYỀN ADMIN
          </span>
        </div>

        {/* BANNER THÔNG BÁO TỒN KHO THỜI GIAN THỰC */}
        {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
          <section className="mb-6 rounded-xs border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={20} className="shrink-0 text-amber-400" />
                <h2 className="font-display text-lg font-bold tracking-wide text-amber-200 uppercase">
                  Thông báo tồn kho cần chú ý ({outOfStockProducts.length} hết
                  hàng, {lowStockProducts.length} sắp hết hàng)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className="text-xs font-bold tracking-wider text-[#b8f927] uppercase underline underline-offset-4 hover:text-white"
              >
                Xem trong Quản lý sản phẩm
              </button>
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {[...outOfStockProducts, ...lowStockProducts]
                .slice(0, 6)
                .map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between gap-2 rounded-xs border border-zinc-800 bg-[#111513] px-3.5 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {getProductNameVi(item)}
                      </p>
                      <p
                        className={
                          item.stock <= 0
                            ? "font-bold text-red-400"
                            : "font-medium text-amber-400"
                        }
                      >
                        {item.stock <= 0
                          ? "Hết hàng (0 sản phẩm)"
                          : `Sắp hết: chỉ còn ${item.stock} ${item.unit}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleQuickStockChange(item, item.stock + 50)
                      }
                      className="shrink-0 rounded-xs bg-[#b8f927] px-2.5 py-1.5 text-[11px] font-extrabold text-black uppercase transition hover:bg-[#c9ff4d]"
                    >
                      + Nhập 50
                    </button>
                  </div>
                ))}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit rounded-xs border border-zinc-800 bg-[#111513] p-4 lg:sticky lg:top-20">
            <div className="flex items-center gap-3 border-b border-zinc-800 px-2 pb-4">
              <span className="flex size-10 items-center justify-center rounded-xs border border-[#b8f927]/30 bg-[#b8f927]/10 text-[#b8f927]">
                <Shield size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold tracking-wide text-white uppercase">
                  {adminUserName}
                </p>
                <p className="text-[11px] font-bold tracking-wider text-[#b8f927] uppercase">
                  Quản trị viên
                </p>
              </div>
            </div>
            <nav
              aria-label="Điều hướng quản trị"
              className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:space-y-1 lg:overflow-visible lg:pb-0"
            >
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setActiveTab(id)}
                  aria-current={activeTab === id ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-xs px-3 py-2.5 text-left text-xs font-bold tracking-wider uppercase transition lg:w-full lg:gap-3 ${
                    activeTab === id
                      ? "bg-[#b8f927] text-black shadow-[0_0_20px_rgba(184,249,39,0.2)]"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            {activeTab === "dashboard" && (
              <section>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "Tổng sản phẩm hiện hữu",
                      value: products.length,
                      sub: `Tổng tồn kho: ${totalStockUnits} đv`,
                      icon: Package,
                    },
                    {
                      label: "Cảnh báo tồn kho",
                      value:
                        outOfStockProducts.length + lowStockProducts.length,
                      sub: `${outOfStockProducts.length} hết hàng • ${lowStockProducts.length} sắp hết`,
                      icon: BarChart3,
                    },
                    {
                      label: "Tổng đơn hàng",
                      value: orders.length,
                      sub: `${pendingOrders} đơn chờ xử lý`,
                      icon: ClipboardList,
                    },
                    {
                      label: "Tài khoản trên Neon DB",
                      value: usersList.length,
                      sub: `${usersList.filter((u) => u.isAdmin).length} Admin được phân quyền`,
                      icon: Users,
                    },
                  ].map(({ label, value, sub, icon: Icon }) => (
                    <article
                      key={label}
                      className="rounded-xs border border-zinc-800 bg-[#111513] p-5 transition hover:border-zinc-700"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                          {label}
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xs border border-[#b8f927]/25 bg-[#b8f927]/10 text-[#b8f927]">
                          <Icon size={18} />
                        </span>
                      </div>
                      <p className="mt-3 font-display text-4xl font-black text-white">
                        {value}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">{sub}</p>
                    </article>
                  ))}
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <section className="rounded-xs border border-zinc-800 bg-[#111513] p-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h2 className="font-display text-xl font-bold tracking-wide text-white uppercase">
                          Doanh thu 7 ngày gần nhất
                        </h2>
                        <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                          Tổng doanh thu đơn không bị hủy:{" "}
                          <span className="font-bold text-[#b8f927]">
                            {formatVndAmount(totalRevenue)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex h-48 items-end gap-2 sm:gap-4">
                      {weeklySales.map((day, index) => (
                        <div
                          key={`${day.label}-${index}`}
                          className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                        >
                          <span className="text-center text-[10px] text-zinc-400">
                            {day.amount > 0 ? formatVndAmount(day.amount) : ""}
                          </span>
                          <div
                            className="w-full max-w-12 rounded-t-xs bg-[#b8f927] transition-all"
                            style={{
                              height: `${day.amount ? Math.max((day.amount / maxWeeklySales) * 100, 8) : 2}%`,
                            }}
                            title={`${day.label}: ${formatVndAmount(day.amount)}`}
                          />
                          <span className="text-xs text-zinc-400 capitalize">
                            {day.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-xs border border-zinc-800 bg-[#111513] p-5">
                    <h2 className="font-display text-xl font-bold tracking-wide text-white uppercase">
                      Tác vụ nhanh Admin
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400">
                      Tổng đơn vị hàng trong kho:{" "}
                      <strong className="text-white">{totalStockUnits}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("products");
                        openNewProductForm();
                      }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xs bg-[#b8f927] px-4 py-3 text-xs font-extrabold tracking-wider text-black uppercase transition hover:bg-[#c9ff4d]"
                    >
                      <Plus size={16} />
                      Thêm sản phẩm mới
                    </button>
                    <div className="mt-4 border-t border-zinc-800 pt-4">
                      <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                        Đơn hàng đang chờ xử lý
                      </p>
                      <p className="mt-1 font-display text-3xl font-black text-[#b8f927]">
                        {pendingOrders}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("orders")}
                        className="mt-2 text-xs font-bold tracking-wider text-zinc-300 uppercase underline underline-offset-4 hover:text-[#b8f927]"
                      >
                        Mở danh sách đơn hàng
                      </button>
                    </div>
                    <div className="mt-4 border-t border-zinc-800 pt-4">
                      <p className="text-xs text-zinc-400">
                        Thuế đang áp dụng:{" "}
                        <strong className="text-white">{taxRate}%</strong>
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("settings")}
                        className="mt-1 text-xs font-bold tracking-wider text-zinc-300 uppercase underline underline-offset-4 hover:text-[#b8f927]"
                      >
                        Điều chỉnh thuế
                      </button>
                    </div>
                  </section>
                </div>

                <OrdersTable
                  orders={orders.slice(0, 5)}
                  onStatusChange={handleUpdateOrderStatus}
                  compact
                />
              </section>
            )}

            {activeTab === "products" && (
              <section className="rounded-xs border border-zinc-800 bg-[#111513]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 p-5">
                  <div>
                    <h2 className="font-display text-xl font-bold tracking-wide text-white uppercase">
                      Quản lý sản phẩm &amp; Tồn kho (Chỉ dành cho Admin)
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                      {products.length} sản phẩm hiện hữu &bull; Tổng kho:{" "}
                      {totalStockUnits} sản phẩm &bull;{" "}
                      <span className="font-semibold text-amber-400">
                        {lowStockProducts.length} sắp hết
                      </span>{" "}
                      &bull;{" "}
                      <span className="font-semibold text-red-400">
                        {outOfStockProducts.length} hết hàng
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={openNewProductForm}
                      className="inline-flex items-center gap-2 rounded-xs bg-[#b8f927] px-4 py-2.5 text-xs font-extrabold tracking-wider text-black uppercase transition hover:bg-[#c9ff4d]"
                    >
                      <Plus size={16} />
                      Thêm sản phẩm
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left text-sm">
                    <thead className="border-b border-zinc-800 bg-[#0b0d0c] text-xs text-zinc-400 uppercase">
                      <tr>
                        <th className="px-5 py-3.5 font-bold">Sản phẩm</th>
                        <th className="px-5 py-3.5 font-bold">Danh mục</th>
                        <th className="px-5 py-3.5 font-bold">Giá bán</th>
                        <th className="px-5 py-3.5 font-bold">
                          Số lượng tồn kho
                        </th>
                        <th className="px-5 py-3.5 font-bold">
                          Trạng thái kho
                        </th>
                        <th className="px-5 py-3.5 font-bold">Giảm giá</th>
                        <th className="px-5 py-3.5 font-bold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80">
                      {products.map((product) => (
                        <tr
                          key={product._id}
                          className="transition hover:bg-zinc-900/50"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image}
                                alt=""
                                className="size-11 rounded-xs bg-white object-contain p-1"
                              />
                              <span className="max-w-48 truncate font-semibold text-white">
                                {getProductNameVi(product)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs font-semibold text-[#b8f927] uppercase">
                            {getCategoryNameVi(product.category)}
                          </td>
                          <td className="px-5 py-3 font-display text-base font-bold whitespace-nowrap text-white">
                            {formatVnd(product.price)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  void handleQuickStockChange(
                                    product,
                                    product.stock - 10,
                                  )
                                }
                                className="rounded-xs border border-zinc-700 bg-[#0b0d0c] px-2 py-0.5 text-xs font-bold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                                title="Giảm 10"
                              >
                                -10
                              </button>
                              <span className="min-w-10 text-center font-mono font-bold text-white">
                                {product.stock}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleQuickStockChange(
                                    product,
                                    product.stock + 10,
                                  )
                                }
                                className="rounded-xs border border-zinc-700 bg-[#0b0d0c] px-2 py-0.5 text-xs font-bold text-[#b8f927] transition hover:border-[#b8f927]"
                                title="Tăng 10"
                              >
                                +10
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {product.stock <= 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-xs border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-400">
                                <AlertTriangle size={12} /> Hết hàng
                              </span>
                            ) : product.stock <= 10 ? (
                              <span className="inline-flex items-center gap-1 rounded-xs border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-300">
                                <AlertTriangle size={12} /> Sắp hết (
                                {product.stock})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-xs border border-[#b8f927]/30 bg-[#b8f927]/15 px-2.5 py-1 text-xs font-bold text-[#b8f927]">
                                <CheckCircle2 size={12} /> Còn hàng
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 font-semibold text-zinc-300">
                            {product.discount}%
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => openEditProductForm(product)}
                                className="text-xs font-bold tracking-wider text-[#b8f927] uppercase hover:underline"
                              >
                                Chỉnh sửa
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeleteProduct(product)
                                }
                                className="text-zinc-400 transition hover:text-red-400"
                                title="Xóa sản phẩm"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === "orders" && (
              <section>
                <div className="mb-4">
                  <h2 className="font-display text-2xl font-bold tracking-wide text-white uppercase">
                    Quản lý đơn hàng
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                    Danh sách tự động cập nhật khi khách hàng hoàn tất thanh
                    toán OTP hoặc COD.
                  </p>
                </div>
                <OrdersTable
                  orders={orders}
                  onStatusChange={handleUpdateOrderStatus}
                />
              </section>
            )}

            {activeTab === "users" && (
              <section className="rounded-xs border border-zinc-800 bg-[#111513]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 p-5">
                  <div>
                    <h2 className="font-display text-xl font-bold tracking-wide text-white uppercase">
                      Quản lý Tài khoản &amp; Phân quyền
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadUsers()}
                    disabled={isLoadingUsers}
                    className="inline-flex items-center gap-1.5 rounded-xs border border-zinc-700 bg-[#0b0d0c] px-3.5 py-2 text-xs font-bold tracking-wider text-white uppercase transition hover:border-[#b8f927] hover:text-[#b8f927]"
                  >
                    <RefreshCw
                      size={14}
                      className={isLoadingUsers ? "animate-spin" : ""}
                    />
                    Làm mới
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-zinc-800 bg-[#0b0d0c] text-xs text-zinc-400 uppercase">
                      <tr>
                        <th className="px-5 py-3.5 font-bold">Họ và tên</th>
                        <th className="px-5 py-3.5 font-bold">Email duy nhất</th>
                        <th className="px-5 py-3.5 font-bold">SĐT duy nhất</th>
                        <th className="px-5 py-3.5 font-bold">
                          Vai trò hiện tại
                        </th>
                        <th className="px-5 py-3.5 font-bold">Số đơn đã đặt</th>
                        <th className="px-5 py-3.5 font-bold">Ngày tạo</th>
                        <th className="px-5 py-3.5 font-bold">Phân quyền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80">
                      {usersList.map((u) => (
                        <tr
                          key={u.id}
                          className="transition hover:bg-zinc-900/50"
                        >
                          <td className="px-5 py-3.5 font-semibold text-white">
                            {u.name}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-300">
                            {u.email}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-zinc-300">
                            {u.phone ?? (
                              <span className="text-zinc-500 italic">
                                Chưa cập nhật
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {u.isAdmin ? (
                              <span className="inline-flex items-center gap-1 rounded-xs border border-[#b8f927]/30 bg-[#b8f927]/15 px-3 py-1 text-xs font-bold text-[#b8f927]">
                                <Shield size={12} /> ADMIN (Quản trị viên)
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-xs border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300">
                                CUSTOMER (Khách hàng)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-400">
                            {u.orderCount} đơn
                          </td>
                          <td className="px-5 py-3.5 text-zinc-400">
                            {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() => void handleToggleUserRole(u)}
                              className={`rounded-xs px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition ${
                                u.isAdmin
                                  ? "border border-zinc-700 bg-[#0b0d0c] text-zinc-300 hover:border-zinc-500 hover:text-white"
                                  : "bg-[#b8f927] text-black hover:bg-[#c9ff4d]"
                              }`}
                            >
                              {u.isAdmin
                                ? "Chuyển về Khách hàng"
                                : "Cấp quyền Admin"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === "settings" && (
              <section className="max-w-2xl rounded-xs border border-zinc-800 bg-[#111513] p-5 sm:p-7">
                <h2 className="font-display text-2xl font-bold tracking-wide text-white uppercase">
                  Cài đặt cửa hàng
                </h2>
                <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                  Điều chỉnh thuế để áp dụng cho các giỏ hàng và đơn thanh toán
                  tiếp theo.
                </p>
                <form onSubmit={saveTaxRateForm} className="mt-6">
                  <label
                    htmlFor="tax-rate"
                    className="mb-2 block text-xs font-bold tracking-wider text-zinc-300 uppercase"
                  >
                    Thuế (%)
                  </label>
                  <div className="flex max-w-sm gap-3">
                    <input
                      id="tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      required
                      value={taxInput}
                      onChange={(event) => setTaxInput(event.target.value)}
                      className="w-full rounded-xs border border-zinc-700 bg-[#0b0d0c] px-4 py-3 text-sm text-white outline-none focus:border-[#b8f927]"
                    />
                    <button
                      type="submit"
                      className="inline-flex shrink-0 items-center gap-2 rounded-xs bg-[#b8f927] px-5 py-3 text-xs font-extrabold tracking-wider text-black uppercase transition hover:bg-[#c9ff4d]"
                    >
                      <Save size={15} />
                      Lưu
                    </button>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-zinc-400">
                    Thuế hiện tại:{" "}
                    <span className="font-bold text-[#b8f927]">{taxRate}%</span>
                    . Giá sản phẩm được nhập và hiển thị bằng đồng Việt Nam.
                  </p>
                </form>
              </section>
            )}
          </div>
        </div>

        {isAddingProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-xs"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget)
                setIsAddingProduct(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-form-title"
              className="my-auto w-full max-w-2xl rounded-xs border border-zinc-800 bg-[#111513] p-5 text-white shadow-2xl sm:p-7"
            >
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <h2
                    id="product-form-title"
                    className="font-display text-2xl font-black tracking-wide text-white uppercase"
                  >
                    {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    Giá nhập bằng VND; ảnh dùng đường dẫn URL. Tự động cập nhật
                    lên CSDL Neon &amp; Web.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Đóng biểu mẫu"
                  onClick={() => setIsAddingProduct(false)}
                  className="rounded-xs border border-zinc-800 p-2 text-zinc-400 transition hover:border-[#b8f927] hover:text-[#b8f927]"
                >
                  <X size={18} />
                </button>
              </div>
              <form
                onSubmit={handleProductSave}
                className="grid gap-4 sm:grid-cols-2"
              >
                <FormField
                  label="Tên sản phẩm"
                  value={productForm.name}
                  onChange={(value) =>
                    setProductForm((form) => ({ ...form, name: value }))
                  }
                  required
                />
                <label className="block text-xs font-bold tracking-wider text-zinc-300 uppercase">
                  Danh mục
                  <select
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm((form) => ({
                        ...form,
                        category: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xs border border-zinc-700 bg-[#0b0d0c] px-3 py-2.5 text-sm font-normal text-white outline-none focus:border-[#b8f927]"
                  >
                    {categoriesData.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {getCategoryNameVi(category.slug)}
                      </option>
                    ))}
                  </select>
                </label>
                <FormField
                  label="Giá bán (₫)"
                  value={productForm.price}
                  onChange={(value) =>
                    setProductForm((form) => ({ ...form, price: value }))
                  }
                  type="number"
                  min="1"
                  required
                />
                <FormField
                  label="Giá gốc (₫)"
                  value={productForm.originalPrice}
                  onChange={(value) =>
                    setProductForm((form) => ({ ...form, originalPrice: value }))
                  }
                  type="number"
                  min="1"
                  required
                />
                <FormField
                  label="Tồn kho"
                  value={productForm.stock}
                  onChange={(value) =>
                    setProductForm((form) => ({ ...form, stock: value }))
                  }
                  type="number"
                  min="0"
                  required
                />
                <FormField
                  label="Giảm giá (%)"
                  value={productForm.discount}
                  onChange={(value) =>
                    setProductForm((form) => ({ ...form, discount: value }))
                  }
                  type="number"
                  min="0"
                  max="100"
                  required
                />
                <div className="sm:col-span-2">
                  <FormField
                    label="Đường dẫn hình ảnh"
                    value={productForm.image}
                    onChange={(value) =>
                      setProductForm((form) => ({ ...form, image: value }))
                    }
                    type="text"
                    required
                  />
                </div>
                <label className="block text-xs font-bold tracking-wider text-zinc-300 uppercase sm:col-span-2">
                  Mô tả sản phẩm
                  <textarea
                    value={productForm.description}
                    onChange={(event) =>
                      setProductForm((form) => ({
                        ...form,
                        description: event.target.value,
                      }))
                    }
                    required
                    rows={3}
                    className="mt-1.5 w-full rounded-xs border border-zinc-700 bg-[#0b0d0c] px-3 py-2.5 text-sm font-normal text-white outline-none focus:border-[#b8f927]"
                  />
                </label>
                <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingProduct(false)}
                    className="rounded-xs border border-zinc-700 bg-[#0b0d0c] px-4 py-2.5 text-xs font-bold tracking-wider text-zinc-300 uppercase transition hover:border-zinc-500 hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-xs bg-[#b8f927] px-5 py-2.5 text-xs font-extrabold tracking-wider text-black uppercase transition hover:bg-[#c9ff4d]"
                  >
                    Lưu sản phẩm lên CSDL Neon
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

function FormField({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  max?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-bold tracking-wider text-zinc-300 uppercase">
      {label}
      <input
        type={type}
        min={min}
        max={max}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xs border border-zinc-700 bg-[#0b0d0c] px-3 py-2.5 text-sm font-normal text-white outline-none focus:border-[#b8f927]"
      />
    </label>
  );
}

function OrdersTable({
  orders,
  onStatusChange,
  compact = false,
}: {
  orders: DemoOrder[];
  onStatusChange: (orderId: string, status: DemoOrder["status"]) => void;
  compact?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xs border border-zinc-800 bg-[#111513] ${compact ? "mt-5" : ""}`}
    >
      <div className="border-b border-zinc-800 p-5">
        <h2 className="font-display text-xl font-bold tracking-wide text-white uppercase">
          {compact ? "Đơn hàng gần đây" : "Tất cả đơn hàng"}
        </h2>
      </div>
      {orders.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-zinc-400">
          Chưa có đơn hàng. Đơn hoàn tất thanh toán OTP hoặc COD sẽ xuất hiện
          tại đây.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-[#0b0d0c] text-xs text-zinc-400 uppercase">
              <tr>
                <th className="px-5 py-3.5 font-bold">Mã đơn</th>
                <th className="px-5 py-3.5 font-bold">Khách hàng</th>
                <th className="px-5 py-3.5 font-bold">Sản phẩm</th>
                <th className="px-5 py-3.5 font-bold">Tổng tiền</th>
                <th className="px-5 py-3.5 font-bold">Trạng thái</th>
                <th className="px-5 py-3.5 font-bold">Ngày đặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="transition hover:bg-zinc-900/50"
                >
                  <td className="px-5 py-4 font-mono font-bold whitespace-nowrap text-[#b8f927]">
                    {order.id}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-zinc-400">{order.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-zinc-400">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    sản phẩm
                  </td>
                  <td className="px-5 py-4 font-display text-base font-bold whitespace-nowrap text-white">
                    {formatVndAmount(order.total)}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      aria-label={`Trạng thái đơn ${order.id}`}
                      value={order.status}
                      onChange={(event) =>
                        onStatusChange(
                          order.id,
                          event.target.value as DemoOrder["status"],
                        )
                      }
                      className="rounded-xs border border-zinc-700 bg-[#0b0d0c] px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-[#b8f927]"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-zinc-400">
                    {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Admin;
