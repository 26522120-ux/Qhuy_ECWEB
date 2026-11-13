import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import {
  createOrder as createOrderRequest,
  createProduct,
  deleteProduct,
  getAdminOrders,
  getCurrentUser,
  getInventoryAlerts,
  getProducts,
  getTaxRate,
  randomizeAdminProducts,
  saveOrderStatus,
  saveProduct,
  saveTaxRate,
  syncAccountToNeon,
  updateProductStock,
  type AuthUserDto,
  type InventoryAlertsResponse,
  type RandomizeProductsResult,
} from "../api";
import { authClient, getOptionalAccessToken, signOutAccount } from "../auth";
import { gymSupplementProducts } from "../assets/gymSupplementAssets";
import type { Product } from "../types";

export interface DemoOrder {
  id: string;
  dbId?: string;
  orderCode?: string;
  userId?: string | null;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod?: string;
  isPaid?: boolean;
  items: Array<{ productId: string; name: string; image: string; price: number; quantity: number }>;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: "Chờ xử lý" | "Đang giao" | "Đã giao" | "Đã hủy";
  createdAt: string;
}

export interface NewOrder {
  customerName: string;
  email?: string;
  phone: string;
  address: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod?: "QR_OTP" | "COD" | "DEMO";
  otpId?: string;
  orderCode?: string;
  otpCode?: string;
}

interface StoreContextValue {
  products: Product[];
  inventoryAlerts: InventoryAlertsResponse | null;
  taxRate: number;
  orders: DemoOrder[];
  currentUser: AuthUserDto | null;
  isAuthLoading: boolean;
  isLoading: boolean;
  error: string | null;
  refreshStore: () => Promise<void>;
  refreshAuth: () => Promise<AuthUserDto | null>;
  logout: () => Promise<void>;
  loadAdminOrders: () => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  quickUpdateStock: (productId: string, stock: number) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  randomizeProducts: (options?: {
    minStock?: number;
    maxStock?: number;
    includeLowStockAlerts?: boolean;
    randomizeDiscounts?: boolean;
  }) => Promise<RandomizeProductsResult>;
  addProduct: (product: Product) => Promise<void>;
  setTaxRate: (rate: number) => Promise<void>;
  addOrder: (order: NewOrder) => Promise<DemoOrder>;
  updateOrderStatus: (orderId: string, status: DemoOrder["status"]) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(gymSupplementProducts);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlertsResponse | null>(null);
  const [taxRate, setTaxRateState] = useState(5);
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUserDto | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStore = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextProducts, nextTaxRate] = await Promise.all([
        getProducts(),
        getTaxRate(),
      ]);
      const gymCategorySet = new Set([
        "whey-protein",
        "pre-workout-creatine",
        "healthy-meal",
      ]);
      const dbGymProducts = nextProducts.filter((item) =>
        gymCategorySet.has(item.category),
      );
      const dbIds = new Set(dbGymProducts.map((item) => item._id));
      const mergedProducts = [
        ...dbGymProducts,
        ...gymSupplementProducts.filter((item) => !dbIds.has(item._id)),
      ];
      setProducts(mergedProducts);
      setTaxRateState(nextTaxRate);
      setError(null);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Không thể tải dữ liệu cửa hàng.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAdminAlerts = useCallback(async (isAdminUser: boolean) => {
    if (!isAdminUser) {
      setInventoryAlerts(null);
      return;
    }
    const nextAlerts = await getInventoryAlerts().catch(() => null);
    setInventoryAlerts(nextAlerts);
  }, []);

  const refreshAuth = useCallback(async (): Promise<AuthUserDto | null> => {
    setIsAuthLoading(true);
    try {
      // Kiểm tra phiên từ Neon Auth trước
      const sessionRes = await authClient.getSession().catch(() => null);
      const sessionUser = sessionRes?.data?.user;
      if (sessionUser?.email) {
        const synced = await syncAccountToNeon({
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
        });
        setCurrentUser(synced.user);
        await refreshAdminAlerts(synced.user.isAdmin);
        return synced.user;
      }

      // Kiểm tra token local nếu có
      const token = await getOptionalAccessToken();
      if (token) {
        const me = await getCurrentUser();
        setCurrentUser(me.user);
        await refreshAdminAlerts(me.user.isAdmin);
        return me.user;
      }

      setCurrentUser(null);
      setInventoryAlerts(null);
      return null;
    } catch {
      setCurrentUser(null);
      setInventoryAlerts(null);
      return null;
    } finally {
      setIsAuthLoading(false);
    }
  }, [refreshAdminAlerts]);

  const logout = useCallback(async () => {
    await signOutAccount();
    setCurrentUser(null);
    setInventoryAlerts(null);
    toast.success("Đã đăng xuất tài khoản.");
  }, []);

  useEffect(() => {
    void refreshStore();
    void refreshAuth();
  }, [refreshStore, refreshAuth]);

  const loadAdminOrders = useCallback(async () => {
    setOrders(await getAdminOrders());
  }, []);

  const updateProduct = useCallback(async (product: Product) => {
    const savedProduct = await saveProduct(product);
    setProducts((current) =>
      current.map((item) => (item._id === savedProduct._id ? savedProduct : item)),
    );
    const nextAlerts = await getInventoryAlerts().catch(() => null);
    if (nextAlerts) setInventoryAlerts(nextAlerts);
  }, []);

  const quickUpdateStock = useCallback(async (productId: string, stock: number) => {
    const savedProduct = await updateProductStock(productId, stock);
    setProducts((current) =>
      current.map((item) => (item._id === savedProduct._id ? savedProduct : item)),
    );
    const nextAlerts = await getInventoryAlerts().catch(() => null);
    if (nextAlerts) setInventoryAlerts(nextAlerts);
  }, []);

  const removeProduct = useCallback(async (productId: string) => {
    await deleteProduct(productId);
    setProducts((current) => current.filter((item) => item._id !== productId));
    const nextAlerts = await getInventoryAlerts().catch(() => null);
    if (nextAlerts) setInventoryAlerts(nextAlerts);
  }, []);

  const randomizeProducts = useCallback(
    async (options?: {
      minStock?: number;
      maxStock?: number;
      includeLowStockAlerts?: boolean;
      randomizeDiscounts?: boolean;
    }) => {
      const result = await randomizeAdminProducts(options);
      setProducts(result.products);
      const nextAlerts = await getInventoryAlerts().catch(() => null);
      if (nextAlerts) setInventoryAlerts(nextAlerts);
      return result;
    },
    [],
  );

  const addProduct = useCallback(async (product: Product) => {
    const savedProduct = await createProduct(product);
    setProducts((current) => [savedProduct, ...current]);
    const nextAlerts = await getInventoryAlerts().catch(() => null);
    if (nextAlerts) setInventoryAlerts(nextAlerts);
  }, []);

  const setTaxRate = useCallback(async (rate: number) => {
    const savedRate = await saveTaxRate(rate);
    setTaxRateState(savedRate);
  }, []);

  const addOrder = useCallback(
    async (order: NewOrder) => {
      const savedOrder = await createOrderRequest(order);
      setOrders((current) => [savedOrder, ...current]);
      await refreshStore();
      return savedOrder;
    },
    [refreshStore],
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: DemoOrder["status"]) => {
      const savedOrder = await saveOrderStatus(orderId, status);
      setOrders((current) =>
        current.map((order) => (order.id === savedOrder.id ? savedOrder : order)),
      );
      await refreshStore();
    },
    [refreshStore],
  );

  const value = useMemo(
    () => ({
      products,
      inventoryAlerts,
      taxRate,
      orders,
      currentUser,
      isAuthLoading,
      isLoading,
      error,
      refreshStore,
      refreshAuth,
      logout,
      loadAdminOrders,
      updateProduct,
      quickUpdateStock,
      removeProduct,
      randomizeProducts,
      addProduct,
      setTaxRate,
      addOrder,
      updateOrderStatus,
    }),
    [
      products,
      inventoryAlerts,
      taxRate,
      orders,
      currentUser,
      isAuthLoading,
      isLoading,
      error,
      refreshStore,
      refreshAuth,
      logout,
      loadAdminOrders,
      updateProduct,
      quickUpdateStock,
      removeProduct,
      randomizeProducts,
      addProduct,
      setTaxRate,
      addOrder,
      updateOrderStatus,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore phải được sử dụng bên trong StoreProvider.");
  return context;
}
