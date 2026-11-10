import { getAccessToken, getOptionalAccessToken, setStoredAccessToken } from "./auth";
import type { Product } from "./types";
import type { DemoOrder } from "./context/StoreContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "CUSTOMER";
  isAdmin: boolean;
}

export interface AdminUserRecord extends AuthUserDto {
  orderCount: number;
  createdAt: string;
}

export interface InventoryAlertItem {
  productId: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  level: "CRITICAL" | "WARNING";
  message: string;
}

export interface InventoryAlertsResponse {
  totalProducts: number;
  totalUnitsInStock: number;
  lowStockThreshold: number;
  outOfStockCount: number;
  lowStockCount: number;
  healthyStockCount: number;
  outOfStockProducts: Product[];
  lowStockProducts: Product[];
  alerts: InventoryAlertItem[];
  timestamp: string;
}

export interface CheckoutOtpSession {
  otpId: string;
  orderCode: string;
  otpCode: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  taxRate: number;
  expiresAt: string;
  ttlSeconds: number;
}

export interface RandomizeProductsResult {
  products: Product[];
  summary: {
    updatedCount: number;
    totalUnitsInStock: number;
    lowStockCount: number;
    outOfStockCount: number;
    timestamp: string;
  };
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly redirectToLogin: boolean;

  constructor(
    message: string,
    statusCode: number,
    options?: { code?: string; redirectToLogin?: boolean },
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = options?.code;
    this.redirectToLogin = Boolean(options?.redirectToLogin);
  }
}

interface ApiOptions extends RequestInit {
  authenticated?: boolean;
  optionalAuth?: boolean;
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { authenticated = false, optionalAuth = false, headers, ...init } = options;
  const requestHeaders = new Headers(headers);
  if (init.body) requestHeaders.set("content-type", "application/json");

  if (authenticated) {
    requestHeaders.set("authorization", `Bearer ${await getAccessToken()}`);
  } else if (optionalAuth) {
    const token = await getOptionalAccessToken();
    if (token) {
      requestHeaders.set("authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: requestHeaders,
  });
  if (response.status === 204) {
    return undefined as T;
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const payloadObj =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : null;
    const message =
      payloadObj && typeof payloadObj.message === "string"
        ? payloadObj.message
        : `API trả về lỗi HTTP ${response.status}.`;
    const code = payloadObj && typeof payloadObj.code === "string" ? payloadObj.code : undefined;
    const redirectToLogin = Boolean(payloadObj?.redirectToLogin);
    throw new ApiError(message, response.status, { code, redirectToLogin });
  }
  return payload as T;
}

export function getProducts() {
  return request<Product[]>("/products");
}

export function getInventoryAlerts() {
  return request<InventoryAlertsResponse>("/inventory/alerts", {
    authenticated: true,
  });
}

export async function getTaxRate() {
  const result = await request<{ taxRate: number }>("/settings/tax");
  return result.taxRate;
}

export function getCurrentUser() {
  return request<{ subject: string; isAdmin: boolean; user: AuthUserDto }>("/auth/me", {
    authenticated: true,
  });
}

export async function syncAccountToNeon(input: {
  id?: string;
  email?: string;
  name?: string;
  phone?: string;
}) {
  const res = await request<{
    subject: string;
    isAdmin: boolean;
    user: AuthUserDto;
    token?: string;
    syncedToNeon: boolean;
  }>("/auth/sync", {
    method: "POST",
    optionalAuth: true,
    body: JSON.stringify(input),
  });
  if (res.token) {
    setStoredAccessToken(res.token);
  }
  return res;
}

export function checkAccountUnique(input: { email: string; phone: string }) {
  return request<{ valid: boolean; email: string; phone: string }>("/auth/check-account", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAccountProfile() {
  return request<AuthUserDto & { orders: DemoOrder[] }>("/account/me", {
    authenticated: true,
  });
}

export function updateAccountProfile(input: { name: string; email: string; phone: string }) {
  return request<AuthUserDto>("/account/profile", {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify(input),
  });
}

export async function loginWithBackend(input: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}) {
  const res = await request<{
    subject: string;
    isAdmin: boolean;
    user: AuthUserDto;
    token: string;
    syncedToNeon: boolean;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (res.token) {
    setStoredAccessToken(res.token);
  }
  return res;
}

export function getAdminOrders() {
  return request<DemoOrder[]>("/admin/orders", { authenticated: true });
}

export function getMyOrders() {
  return request<DemoOrder[]>("/orders/my", { authenticated: true });
}

export function getAdminUsers() {
  return request<AdminUserRecord[]>("/admin/users", { authenticated: true });
}

export function updateAdminUserRole(userId: string, role: "ADMIN" | "CUSTOMER") {
  return request<AuthUserDto>(`/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({ role }),
  });
}

export function createProduct(product: Product) {
  return request<Product>("/admin/products", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(product),
  });
}

export function saveProduct(product: Product) {
  return request<Product>(`/admin/products/${encodeURIComponent(product._id)}`, {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify(product),
  });
}

export function updateProductStock(productId: string, stock: number) {
  return request<Product>(`/admin/products/${encodeURIComponent(productId)}/stock`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({ stock }),
  });
}

export function deleteProduct(productId: string) {
  return request<void>(`/admin/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export function randomizeAdminProducts(options?: {
  minStock?: number;
  maxStock?: number;
  includeLowStockAlerts?: boolean;
  randomizeDiscounts?: boolean;
}) {
  return request<RandomizeProductsResult>("/admin/products/randomize", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(options ?? {}),
  });
}

export async function saveTaxRate(taxRate: number) {
  const result = await request<{ taxRate: number }>("/admin/settings/tax", {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({ taxRate }),
  });
  return result.taxRate;
}

export function requestCheckoutOtp(items: Array<{ productId: string; quantity: number }>) {
  return request<CheckoutOtpSession>("/checkout/otp", {
    method: "POST",
    optionalAuth: true,
    body: JSON.stringify({ items }),
  });
}

export function verifyCheckoutOtp(input: {
  otpId?: string;
  orderCode: string;
  otpCode: string;
}) {
  return request<{ verified: boolean; otpId: string; orderCode: string; amountVnd: number }>(
    "/checkout/verify-otp",
    {
      method: "POST",
      optionalAuth: true,
      body: JSON.stringify(input),
    },
  );
}

export function createOrder(input: {
  customerName: string;
  email?: string;
  phone: string;
  address: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod?: "QR_OTP" | "COD" | "DEMO";
  otpId?: string;
  orderCode?: string;
  otpCode?: string;
}) {
  return request<DemoOrder>("/orders", {
    method: "POST",
    optionalAuth: true,
    body: JSON.stringify(input),
  });
}

export function saveOrderStatus(orderId: string, status: DemoOrder["status"]) {
  return request<DemoOrder>(`/admin/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({ status }),
  });
}
