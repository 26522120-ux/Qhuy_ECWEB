import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Dices,
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
  category: categoriesData[0]?.slug ?? "fruits-vegetables",
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
    randomizeProducts,
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
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [usersList, setUsersList] = useState<AdminUserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const list = await getAdminUsers();
      setUsersList(list);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tải danh sách người dùng.",
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

  const handleRandomizeInventory = async () => {
    setIsRandomizing(true);
    try {
      const res = await randomizeProducts({
        minStock: 12,
        maxStock: 120,
        includeLowStockAlerts: true,
        randomizeDiscounts: true,
      });
      toast.success(
        `Đã ngẫu nhiên hóa ${res.summary.updatedCount} sản phẩm (Tổng tồn kho: ${res.summary.totalUnitsInStock}, ${res.summary.lowStockCount} sắp hết, ${res.summary.outOfStockCount} hết hàng) và cập nhật lên CSDL Neon!`,
        { duration: 4500 },
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể ngẫu nhiên hóa tồn kho sản phẩm.",
      );
    } finally {
      setIsRandomizing(false);
    }
  };

  const handleQuickStockChange = async (product: Product, nextStock: number) => {
    const safeStock = Math.max(0, nextStock);
    try {
      await quickUpdateStock(product._id, safeStock);
      toast.success(
        `Đã cập nhật tồn kho "${getProductNameVi(product)}": ${safeStock} (${
          safeStock === 0 ? "Hết hàng" : safeStock <= 10 ? "Sắp hết hàng" : "Còn hàng"
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
      toast.success(`Đã xóa sản phẩm "${getProductNameVi(product)}" khỏi CSDL.`);
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
          nextRole === "ADMIN" ? "Quản trị viên (ADMIN)" : "Khách hàng (CUSTOMER)"
        } trên CSDL Neon.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật quyền tài khoản.",
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
  const totalStockUnits = products.reduce((sum, product) => sum + product.stock, 0);
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
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-app-text-light">
        Đang kiểm tra quyền quản trị viên từ máy chủ...
      </main>
    );
  }

  if (accessError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-app-green">
          Yêu cầu đăng nhập Quản trị viên
        </h1>
        <p className="mt-3 text-sm leading-6 text-app-text-light">
          {accessError}
        </p>
        <Link
          to="/login"
          className="mt-5 inline-block rounded-xl bg-app-green px-6 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
        >
          Đăng nhập ngay
        </Link>
      </main>
    );
  }

  if (adminSubject) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-app-green">
          Khu vực dành riêng cho Quản trị viên
        </h1>
        <p className="mt-3 text-sm leading-6 text-app-text-light">
          Tài khoản hiện tại không có quyền truy cập trang quản trị.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/"
            className="rounded-xl border border-app-border px-5 py-2.5 text-sm font-semibold text-app-green hover:bg-app-cream"
          >
            Về trang chủ
          </Link>
          <Link
            to="/login"
            className="rounded-xl bg-app-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-app-green-light"
          >
            Đổi tài khoản
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-app-orange">Quản trị cửa hàng</p>
          <h1 className="mt-1 font-serif text-3xl text-app-green">
            Bảng điều khiển — {adminUserName}
          </h1>
        </div>

        <button
          type="button"
          disabled={isRandomizing}
          onClick={() => void handleRandomizeInventory()}
          className="inline-flex items-center gap-2 rounded-xl bg-app-green px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-app-green-light disabled:opacity-50"
        >
          <Dices size={18} className={isRandomizing ? "animate-spin" : ""} />
          {isRandomizing
            ? "Đang ngẫu nhiên & đồng bộ Neon..."
            : "Ngẫu nhiên tồn kho & sản phẩm (Neon DB)"}
        </button>
      </div>

      {/* BANNER THÔNG BÁO TỒN KHO THỜI GIAN THỰC */}
      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <section className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={20} className="shrink-0 text-amber-700" />
              <h2 className="font-semibold text-amber-950">
                Thông báo tồn kho cần chú ý ({outOfStockProducts.length} hết hàng,{" "}
                {lowStockProducts.length} sắp hết hàng)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className="text-xs font-semibold text-app-green underline underline-offset-2 hover:text-app-orange"
            >
              Xem trong Quản lý sản phẩm
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[...outOfStockProducts, ...lowStockProducts].slice(0, 6).map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-app-green">
                    {getProductNameVi(item)}
                  </p>
                  <p
                    className={
                      item.stock <= 0
                        ? "font-bold text-red-600"
                        : "font-medium text-amber-700"
                    }
                  >
                    {item.stock <= 0
                      ? "Hết hàng (0 sản phẩm)"
                      : `Sắp hết: chỉ còn ${item.stock} ${item.unit}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleQuickStockChange(item, item.stock + 50)}
                  className="shrink-0 rounded-lg bg-app-green px-2.5 py-1.5 font-semibold text-white hover:bg-app-green-light"
                >
                  + Nhập 50
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-app-border bg-white p-4 lg:sticky lg:top-6">
          <div className="flex items-center gap-3 border-b border-app-border px-2 pb-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-app-green/10 text-app-green">
              <Shield size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-app-green">{adminUserName}</p>
              <p className="text-xs font-medium text-app-orange">Quyền: ADMIN</p>
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
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium lg:w-full lg:gap-3 lg:py-2.5 lg:text-sm ${
                  activeTab === id
                    ? "bg-app-green text-white"
                    : "text-app-text-light hover:bg-app-cream hover:text-app-green"
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
                    value: outOfStockProducts.length + lowStockProducts.length,
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
                    className="rounded-2xl border border-app-border bg-white p-5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-app-text-light">{label}</p>
                      <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-app-orange">
                        <Icon size={19} />
                      </span>
                    </div>
                    <p className="mt-3 text-3xl font-semibold text-app-green">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-app-text-light">{sub}</p>
                  </article>
                ))}
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                <section className="rounded-2xl border border-app-border bg-white p-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-app-green">
                        Doanh thu 7 ngày gần nhất
                      </h2>
                      <p className="mt-1 text-sm text-app-text-light">
                        Tổng doanh thu đơn không bị hủy:{" "}
                        {formatVndAmount(totalRevenue)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex h-48 items-end gap-2 sm:gap-4">
                    {weeklySales.map((day, index) => (
                      <div
                        key={`${day.label}-${index}`}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                      >
                        <span className="text-center text-[10px] text-app-text-light">
                          {day.amount > 0 ? formatVndAmount(day.amount) : ""}
                        </span>
                        <div
                          className="w-full max-w-12 rounded-t-lg bg-app-orange transition-all"
                          style={{
                            height: `${day.amount ? Math.max((day.amount / maxWeeklySales) * 100, 8) : 2}%`,
                          }}
                          title={`${day.label}: ${formatVndAmount(day.amount)}`}
                        />
                        <span className="text-xs capitalize text-app-text-light">
                          {day.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-app-border bg-white p-5">
                  <h2 className="text-lg font-semibold text-app-green">
                    Tác vụ nhanh Admin
                  </h2>
                  <p className="mt-1 text-xs text-app-text-light">
                    Tổng đơn vị hàng trong kho: <strong>{totalStockUnits}</strong>
                  </p>
                  <button
                    type="button"
                    disabled={isRandomizing}
                    onClick={() => void handleRandomizeInventory()}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-app-orange px-4 py-2.5 text-xs font-semibold text-white hover:bg-app-orange-dark disabled:opacity-50"
                  >
                    <Dices size={16} />
                    Ngẫu nhiên tồn kho & sản phẩm
                  </button>
                  <div className="mt-4 border-t border-app-border pt-4">
                    <p className="text-sm text-app-text-light">
                      Đơn hàng đang chờ xử lý
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-app-orange">
                      {pendingOrders}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="mt-2 text-xs font-semibold text-app-green underline underline-offset-2"
                    >
                      Mở danh sách đơn hàng
                    </button>
                  </div>
                  <div className="mt-4 border-t border-app-border pt-4">
                    <p className="text-sm text-app-text-light">
                      Thuế đang áp dụng: <strong className="text-app-green">{taxRate}%</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="mt-1 text-xs font-semibold text-app-green underline underline-offset-2"
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
            <section className="rounded-2xl border border-app-border bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border p-5">
                <div>
                  <h2 className="text-lg font-semibold text-app-green">
                    Quản lý sản phẩm & Tồn kho (Chỉ dành cho Admin)
                  </h2>
                  <p className="mt-1 text-sm text-app-text-light">
                    {products.length} sản phẩm hiện hữu • Tổng kho: {totalStockUnits} sản phẩm •{" "}
                    <span className="font-medium text-amber-700">
                      {lowStockProducts.length} sắp hết
                    </span>{" "}
                    •{" "}
                    <span className="font-medium text-red-600">
                      {outOfStockProducts.length} hết hàng
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isRandomizing}
                    onClick={() => void handleRandomizeInventory()}
                    className="inline-flex items-center gap-2 rounded-xl border border-app-green bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-app-green hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <Dices size={17} className={isRandomizing ? "animate-spin" : ""} />
                    {isRandomizing ? "Đang cập nhật..." : "Ngẫu nhiên số lượng tồn kho"}
                  </button>
                  <button
                    type="button"
                    onClick={openNewProductForm}
                    className="inline-flex items-center gap-2 rounded-xl bg-app-orange px-4 py-2.5 text-sm font-semibold text-white hover:bg-app-orange-dark"
                  >
                    <Plus size={17} />
                    Thêm sản phẩm
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="bg-app-cream text-xs uppercase text-app-text-light">
                    <tr>
                      <th className="px-5 py-3 font-medium">Sản phẩm</th>
                      <th className="px-5 py-3 font-medium">Danh mục</th>
                      <th className="px-5 py-3 font-medium">Giá bán</th>
                      <th className="px-5 py-3 font-medium">Số lượng tồn kho</th>
                      <th className="px-5 py-3 font-medium">Trạng thái kho</th>
                      <th className="px-5 py-3 font-medium">Giảm giá</th>
                      <th className="px-5 py-3 font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt=""
                              className="size-11 rounded-lg bg-app-cream object-contain p-1"
                            />
                            <span className="max-w-48 truncate font-medium text-app-green">
                              {getProductNameVi(product)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-app-text-light">
                          {getCategoryNameVi(product.category)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 font-medium text-app-green">
                          {formatVnd(product.price)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                void handleQuickStockChange(product, product.stock - 10)
                              }
                              className="rounded border border-app-border px-2 py-0.5 text-xs font-bold text-app-text hover:bg-app-cream"
                              title="Giảm 10"
                            >
                              -10
                            </button>
                            <span className="min-w-10 text-center font-mono font-semibold text-app-text">
                              {product.stock}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                void handleQuickStockChange(product, product.stock + 10)
                              }
                              className="rounded border border-app-border px-2 py-0.5 text-xs font-bold text-app-green hover:bg-app-cream"
                              title="Tăng 10"
                            >
                              +10
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {product.stock <= 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              <AlertTriangle size={12} /> Hết hàng
                            </span>
                          ) : product.stock <= 10 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                              <AlertTriangle size={12} /> Sắp hết ({product.stock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 size={12} /> Còn hàng
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-app-text">
                          {product.discount}%
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditProductForm(product)}
                              className="font-semibold text-app-orange hover:text-app-orange-dark"
                            >
                              Chỉnh sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteProduct(product)}
                              className="text-app-text-light hover:text-red-600"
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
                <h2 className="text-xl font-semibold text-app-green">
                  Quản lý đơn hàng
                </h2>
                <p className="mt-1 text-sm text-app-text-light">
                  Danh sách tự động cập nhật khi khách hàng hoàn tất thanh toán OTP hoặc COD.
                </p>
              </div>
              <OrdersTable
                orders={orders}
                onStatusChange={handleUpdateOrderStatus}
              />
            </section>
          )}

          {activeTab === "users" && (
            <section className="rounded-2xl border border-app-border bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border p-5">
                <div>
                  <h2 className="text-lg font-semibold text-app-green">
                    Quản lý Tài khoản & Phân quyền
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => void loadUsers()}
                  disabled={isLoadingUsers}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-app-border px-3.5 py-2 text-xs font-semibold text-app-green hover:bg-app-cream"
                >
                  <RefreshCw size={14} className={isLoadingUsers ? "animate-spin" : ""} />
                  Làm mới
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-app-cream text-xs uppercase text-app-text-light">
                    <tr>
                      <th className="px-5 py-3 font-medium">Họ và tên</th>
                      <th className="px-5 py-3 font-medium">Email duy nhất</th>
                      <th className="px-5 py-3 font-medium">SĐT duy nhất</th>
                      <th className="px-5 py-3 font-medium">Vai trò hiện tại</th>
                      <th className="px-5 py-3 font-medium">Số đơn đã đặt</th>
                      <th className="px-5 py-3 font-medium">Ngày tạo</th>
                      <th className="px-5 py-3 font-medium">Phân quyền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {usersList.map((u) => (
                      <tr key={u.id}>
                        <td className="px-5 py-3.5 font-medium text-app-green">
                          {u.name}
                        </td>
                        <td className="px-5 py-3.5 text-app-text">{u.email}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-app-text">
                          {u.phone ?? (
                            <span className="italic text-app-text-light">
                              Chưa cập nhật
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {u.isAdmin ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-app-orange/15 px-3 py-1 text-xs font-bold text-app-orange">
                              <Shield size={12} /> ADMIN (Quản trị viên)
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                              CUSTOMER (Khách hàng)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-app-text-light">
                          {u.orderCount} đơn
                        </td>
                        <td className="px-5 py-3.5 text-app-text-light">
                          {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => void handleToggleUserRole(u)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              u.isAdmin
                                ? "border border-slate-300 text-slate-700 hover:bg-slate-100"
                                : "bg-app-green text-white hover:bg-app-green-light"
                            }`}
                          >
                            {u.isAdmin ? "Chuyển về Khách hàng" : "Cấp quyền Admin"}
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
            <section className="max-w-2xl rounded-2xl border border-app-border bg-white p-5 sm:p-7">
              <h2 className="text-xl font-semibold text-app-green">
                Cài đặt cửa hàng
              </h2>
              <p className="mt-1 text-sm text-app-text-light">
                Điều chỉnh thuế để áp dụng cho các giỏ hàng và đơn thanh toán
                tiếp theo.
              </p>
              <form onSubmit={saveTaxRateForm} className="mt-6">
                <label
                  htmlFor="tax-rate"
                  className="mb-2 block text-sm font-medium text-app-green"
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
                    className="w-full rounded-xl border border-app-border px-4 py-3 text-sm outline-none focus:border-app-green"
                  />
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-app-green px-4 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
                  >
                    <Save size={16} />
                    Lưu
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-app-text-light">
                  Thuế hiện tại: {taxRate}%. Giá sản phẩm được nhập và hiển thị
                  bằng đồng Việt Nam.
                </p>
              </form>
            </section>
          )}
        </div>
      </div>

      {isAddingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsAddingProduct(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2
                  id="product-form-title"
                  className="text-xl font-semibold text-app-green"
                >
                  {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}
                </h2>
                <p className="mt-1 text-sm text-app-text-light">
                  Giá nhập bằng VND; ảnh dùng đường dẫn URL. Tự động cập nhật lên CSDL Neon & Web.
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng biểu mẫu"
                onClick={() => setIsAddingProduct(false)}
                className="rounded-lg p-2 text-app-text-light hover:bg-app-cream"
              >
                <X size={20} />
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
              <label className="block text-sm font-medium text-app-green">
                Danh mục
                <select
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm((form) => ({
                      ...form,
                      category: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-app-border bg-white px-3 py-2.5 text-sm font-normal text-app-text outline-none focus:border-app-green"
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
                  type="url"
                  required
                />
              </div>
              <label className="block text-sm font-medium text-app-green sm:col-span-2">
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
                  className="mt-1.5 w-full rounded-xl border border-app-border px-3 py-2.5 text-sm font-normal text-app-text outline-none focus:border-app-green"
                />
              </label>
              <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="rounded-xl border border-app-border px-4 py-2.5 text-sm font-medium text-app-text hover:bg-app-cream"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-app-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-app-green-light"
                >
                  Lưu sản phẩm lên CSDL Neon
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
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
    <label className="block text-sm font-medium text-app-green">
      {label}
      <input
        type={type}
        min={min}
        max={max}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-app-border px-3 py-2.5 text-sm font-normal text-app-text outline-none focus:border-app-green"
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
      className={`overflow-hidden rounded-2xl border border-app-border bg-white ${compact ? "mt-5" : ""}`}
    >
      <div className="border-b border-app-border p-5">
        <h2 className="text-lg font-semibold text-app-green">
          {compact ? "Đơn hàng gần đây" : "Tất cả đơn hàng"}
        </h2>
      </div>
      {orders.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-app-text-light">
          Chưa có đơn hàng. Đơn hoàn tất thanh toán OTP hoặc COD sẽ xuất hiện tại
          đây.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-app-cream text-xs uppercase text-app-text-light">
              <tr>
                <th className="px-5 py-3 font-medium">Mã đơn</th>
                <th className="px-5 py-3 font-medium">Khách hàng</th>
                <th className="px-5 py-3 font-medium">Sản phẩm</th>
                <th className="px-5 py-3 font-medium">Tổng tiền</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium">Ngày đặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap px-5 py-4 font-mono font-medium text-app-green">
                    {order.id}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-app-text">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-app-text-light">{order.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-app-text-light">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    sản phẩm
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-app-green">
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
                      className="rounded-lg border border-app-border bg-white px-2 py-1.5 text-xs outline-none focus:border-app-green"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-app-text-light">
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
