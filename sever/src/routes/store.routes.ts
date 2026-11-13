import crypto from "node:crypto";
import { Router } from "express";
import { OrderStatus, Prisma, UserRole } from "../generated/prisma/client.js";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { HttpError } from "../errors/http-error.js";
import {
  normalizePhoneNumber,
  optionalAuth,
  requireAdmin,
  requireAuth,
  signLocalToken,
  syncUserToDatabase,
} from "../middleware/auth.js";

const INR_TO_VND = 300;
const DELIVERY_FEE = 15_000;
const FREE_DELIVERY_THRESHOLD = 300_000;
const OTP_LIFETIME_SECONDS = 5 * 60;
const MAX_OTP_ATTEMPTS = 5;
const LOW_STOCK_THRESHOLD = 10;

const orderStatuses = ["Chờ xử lý", "Đang giao", "Đã giao", "Đã hủy"] as const;
const statusToDb = {
  "Chờ xử lý": OrderStatus.PENDING,
  "Đang giao": OrderStatus.SHIPPED,
  "Đã giao": OrderStatus.DELIVERED,
  "Đã hủy": OrderStatus.CANCELLED,
} satisfies Record<(typeof orderStatuses)[number], OrderStatus>;
const statusFromDb = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Chờ xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
} satisfies Record<OrderStatus, (typeof orderStatuses)[number]>;

const productSchema = z.object({
  _id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(160),
  description: z.string().max(2000).default(""),
  price: z.number().int().positive(),
  originalPrice: z.number().int().positive(),
  image: z.string().trim().min(1),
  category: z.string().trim().min(1).max(80),
  unit: z.string().trim().min(1).max(40).default("sản phẩm"),
  stock: z.number().int().min(0),
  isOrganic: z.boolean().default(false),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
  discount: z.number().int().min(0).max(100).default(0),
  createdAt: z.string().datetime().optional(),
});

const orderItemsInputSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(100),
    }),
  )
  .min(1)
  .max(50);

const requestOtpSchema = z.object({
  items: orderItemsInputSchema,
  existingOrderCode: z.string().trim().max(40).optional(),
});

const optionalNonEmptyString = z
  .preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().min(1).optional(),
  );

const verifyOtpSchema = z.object({
  otpId: optionalNonEmptyString,
  orderCode: z.string().trim().min(1, "Thiếu mã giao dịch đơn hàng."),
  otpCode: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "Mã OTP phải gồm đúng 6 chữ số."),
});

const createOrderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập họ và tên người nhận.")
    .max(120),
  email: optionalNonEmptyString,
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/[\s.-]+/g, "").replace(/^\+84/, "0"))
    .refine((val) => /^[0-9]{8,15}$/.test(val), {
      message: "Số điện thoại không hợp lệ (cần từ 8 đến 15 chữ số).",
    }),
  address: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập địa chỉ giao hàng.")
    .max(500),
  items: orderItemsInputSchema,
  paymentMethod: z.enum(["QR_OTP", "COD", "DEMO"]).default("QR_OTP"),
  otpId: optionalNonEmptyString,
  orderCode: optionalNonEmptyString,
  otpCode: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z
      .string()
      .trim()
      .regex(/^[0-9]{6}$/, "Mã OTP phải gồm đúng 6 chữ số.")
      .optional(),
  ),
});

const statusSchema = z.object({ status: z.enum(orderStatuses) });
const taxSchema = z.object({ taxRate: z.number().min(0).max(100) });
const stockUpdateSchema = z.object({ stock: z.number().int().min(0).max(100_000) });
const randomizeProductsSchema = z
  .object({
    minStock: z.number().int().min(0).max(500).default(5),
    maxStock: z.number().int().min(10).max(1000).default(120),
    includeLowStockAlerts: z.boolean().default(true),
    randomizeDiscounts: z.boolean().default(true),
  })
  .default({
    minStock: 5,
    maxStock: 120,
    includeLowStockAlerts: true,
    randomizeDiscounts: true,
  });

const syncAuthSchema = z.object({
  id: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(20).optional(),
});

const localLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(128),
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(20).optional(),
});

const checkAccountSchema = z.object({
  email: z.string().trim().email("Địa chỉ email không hợp lệ."),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/[\s.-]+/g, "").replace(/^\+84/, "0"))
    .refine((val) => /^[0-9]{8,15}$/.test(val), {
      message: "Số điện thoại phải từ 8 đến 15 chữ số.",
    }),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập họ và tên.").max(120),
  email: z.string().trim().email("Địa chỉ email không hợp lệ."),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/[\s.-]+/g, "").replace(/^\+84/, "0"))
    .refine((val) => /^[0-9]{8,15}$/.test(val), {
      message: "Số điện thoại phải từ 8 đến 15 chữ số.",
    }),
});

const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "CUSTOMER"]),
});

function getDatabase() {
  if (!prisma) throw new HttpError(503, "Database chưa được cấu hình.");
  return prisma;
}

function generateSixDigitOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function generateOrderCode(): string {
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `IM${Date.now().toString().slice(-6)}${suffix}`;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(`instantmart:${password}`).digest("hex");
}

function getStockStatus(stock: number): {
  stockStatus: "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";
  stockLabel: string;
} {
  if (stock <= 0) {
    return { stockStatus: "OUT_OF_STOCK", stockLabel: "Hết hàng" };
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return {
      stockStatus: "LOW_STOCK",
      stockLabel: `Sắp hết hàng (còn ${stock})`,
    };
  }
  return {
    stockStatus: "IN_STOCK",
    stockLabel: `Còn hàng (${stock})`,
  };
}

function productDto(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  unit: string;
  stock: number;
  isOrganic: boolean;
  rating: number;
  reviewCount: number;
  discount: number;
  createdAt: Date;
}) {
  const { stockStatus, stockLabel } = getStockStatus(product.stock);
  return {
    ...product,
    _id: product.id,
    stockStatus,
    stockLabel,
    createdAt: product.createdAt.toISOString(),
  };
}

function orderDto(order: Prisma.OrderGetPayload<{ include: { items: true } }>) {
  return {
    id: order.orderCode ?? order.id,
    dbId: order.id,
    orderCode: order.orderCode ?? order.id,
    userId: order.userId,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    paymentMethod: order.paymentMethod,
    isPaid: order.isPaid,
    items: order.items.map((item) => ({
      productId: item.productId ?? "",
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    tax: order.tax,
    total: order.total,
    status: statusFromDb[order.status],
    createdAt: order.createdAt.toISOString(),
  };
}

async function getTaxRate() {
  const db = getDatabase();
  const setting = await db.storeSetting.upsert({
    where: { key: "default" },
    create: { key: "default", taxRate: 5 },
    update: {},
  });
  return setting.taxRate;
}

function normalizeUniqueItems(items: Array<{ productId: string; quantity: number }>) {
  const uniqueItems = new Map<string, number>();
  for (const item of items) {
    uniqueItems.set(item.productId, (uniqueItems.get(item.productId) ?? 0) + item.quantity);
  }
  return uniqueItems;
}

const NUTRAGO_CATEGORIES = [
  {
    slug: "whey-protein",
    name: "Whey & Mass Gainer",
    nameVi: "Whey & Mass Gainer",
    description: "Whey Isolate, Whey Blend & Mass Gainer tăng cơ tăng cân",
    image: "/gym-assets/gym_15.jpg",
  },
  {
    slug: "pre-workout-creatine",
    name: "Pre-Workout & Creatine",
    nameVi: "Pre-Workout & Creatine",
    description: "Tăng sức mạnh đẩy tạ, bơm cơ & tỉnh táo trước buổi tập",
    image: "/gym-assets/gym_02.jpg",
  },
  {
    slug: "weights-barbells",
    name: "Weights & Barbells",
    nameVi: "Tạ Đòn, Bánh Tạ & Tạ Ấm",
    description: "Đòn tạ Olympic, Bumper Plates, bánh tạ gang & Kettlebell",
    image: "/gym-assets/gym_08.jpg",
  },
  {
    slug: "gym-machines",
    name: "Gym Machines",
    nameVi: "Máy Tập & Khung Gánh Tạ",
    description: "Máy chạy bộ điện đa năng & Khung Smith Machine chuyên nghiệp",
    image: "/gym-assets/gym_06.jpg",
  },
  {
    slug: "boxing-accessories",
    name: "Boxing & Accessories",
    nameVi: "Boxing & Phụ Kiện Gym",
    description: "Bao cát đấm bốc, bóng phản xạ, dây nhảy, kìm tay & giãn cơ",
    image: "/gym-assets/gym_10.jpg",
  },
] as const;

export const storeRouter = Router();

// ==================== PRODUCTS, CATEGORIES & INVENTORY ALERTS ====================

storeRouter.get("/categories", (_request, response) => {
  response.json(NUTRAGO_CATEGORIES);
});

storeRouter.get("/products", async (request, response) => {
  const db = getDatabase();
  const search = z.string().trim().max(120).optional().parse(request.query.q);
  const category = z.string().trim().max(80).optional().parse(request.query.category);
  const sort = z
    .enum(["newest", "price_asc", "price_desc", "rating", "discount"])
    .optional()
    .parse(request.query.sort);

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
        ? { price: "desc" }
        : sort === "rating"
          ? { rating: "desc" }
          : sort === "discount"
            ? { discount: "desc" }
            : { createdAt: "desc" };

  const products = await db.product.findMany({
    where: {
      ...(category && category !== "all" ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy,
    take: 200,
  });
  response.json(products.map(productDto));
});

storeRouter.get("/inventory/alerts", requireAuth, requireAdmin, async (_request, response) => {
  const db = getDatabase();
  const products = await db.product.findMany({
    orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
  });

  const outOfStockProducts = products.filter((p) => p.stock <= 0).map(productDto);
  const lowStockProducts = products
    .filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)
    .map(productDto);
  const totalUnitsInStock = products.reduce((sum, p) => sum + p.stock, 0);

  response.json({
    totalProducts: products.length,
    totalUnitsInStock,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    outOfStockCount: outOfStockProducts.length,
    lowStockCount: lowStockProducts.length,
    healthyStockCount: products.length - outOfStockProducts.length - lowStockProducts.length,
    outOfStockProducts,
    lowStockProducts,
    alerts: [...outOfStockProducts, ...lowStockProducts].map((p) => ({
      productId: p._id,
      name: p.name,
      category: p.category,
      stock: p.stock,
      unit: p.unit,
      level: p.stock <= 0 ? "CRITICAL" : "WARNING",
      message:
        p.stock <= 0
          ? `Sản phẩm "${p.name}" đã hết hàng (tồn kho: 0).`
          : `Sản phẩm "${p.name}" sắp hết hàng (chỉ còn ${p.stock} ${p.unit}).`,
    })),
    timestamp: new Date().toISOString(),
  });
});

storeRouter.get("/settings/tax", async (_request, response) => {
  response.json({ taxRate: await getTaxRate() });
});

// ==================== AUTH & CUSTOMER ACCOUNT MANAGEMENT ====================

storeRouter.get("/auth/me", requireAuth, (request, response) => {
  const user = request.authUser!;
  response.json({
    subject: user.id,
    isAdmin: user.isAdmin,
    user,
  });
});

/**
 * Kiểm tra tính duy nhất của Email và Số điện thoại trước khi tạo tài khoản mới.
 * Nếu trùng Email hoặc Số điện thoại -> trả về HTTP 409 kèm redirectToLogin: true.
 */
storeRouter.post("/auth/check-account", async (request, response) => {
  const db = getDatabase();
  const input = checkAccountSchema.parse(request.body);
  const email = input.email.toLowerCase();
  const phone = input.phone;

  const existingEmailUser = await db.user.findUnique({ where: { email } });
  const neonEmailRows = await db
    .$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id FROM neon_auth."user" WHERE lower(email) = ${email} LIMIT 1
    `
    .catch(() => []);

  if (existingEmailUser || neonEmailRows.length > 0) {
    throw new HttpError(
      409,
      "Email này đã được đăng ký tài khoản. Vui lòng đăng nhập!",
      { code: "DUPLICATE_EMAIL", redirectToLogin: true },
    );
  }

  const existingPhoneUser = await db.user.findUnique({ where: { phone } });
  const existingPhoneOrder = await db.order.findFirst({
    where: { phone },
    select: { id: true, userId: true },
  });

  if (existingPhoneUser || existingPhoneOrder) {
    throw new HttpError(
      409,
      "Số điện thoại này đã được sử dụng cho một tài khoản khác. Vui lòng đăng nhập!",
      { code: "DUPLICATE_PHONE", redirectToLogin: true },
    );
  }

  response.json({ valid: true, email, phone });
});

storeRouter.post("/auth/sync", optionalAuth, async (request, response) => {
  const db = getDatabase();
  const body = syncAuthSchema.parse(request.body ?? {});

  if (request.authUser && !body.phone) {
    response.json({
      subject: request.authUser.id,
      isAdmin: request.authUser.isAdmin,
      user: request.authUser,
      syncedToNeon: true,
    });
    return;
  }

  const targetId = body.id ?? request.authUser?.id;
  const targetEmail = body.email ?? request.authUser?.email;

  if (!targetEmail && !targetId) {
    throw new HttpError(400, "Cần cung cấp email hoặc id để đồng bộ tài khoản.");
  }

  const neonUsers = await db
    .$queryRaw<
      Array<{ id: string; name: string | null; email: string; role: string | null; password: string | null }>
    >`
      SELECT
        u.id::text AS id,
        u.name,
        u.email,
        u.role,
        (
          SELECT a.password
          FROM neon_auth.account a
          WHERE a."userId" = u.id AND a.password IS NOT NULL
          LIMIT 1
        ) AS password
      FROM neon_auth."user" u
      WHERE (${targetId ?? ""} <> '' AND u.id::text = ${targetId ?? ""})
         OR (${targetEmail ?? ""} <> '' AND lower(u.email) = lower(${targetEmail ?? ""}))
      ORDER BY u."createdAt" DESC
      LIMIT 1
    `
    .catch(() => []);

  const neonUser = neonUsers[0];
  const syncedUser = await syncUserToDatabase({
    id: neonUser?.id ?? targetId ?? crypto.randomUUID(),
    name: body.name || neonUser?.name || request.authUser?.name,
    email: neonUser?.email ?? targetEmail!,
    phone: body.phone ?? request.authUser?.phone ?? null,
    neonRole: neonUser?.role,
    passwordHash: neonUser?.password,
    strictDuplicateCheck: true,
  });

  const localToken = await signLocalToken(syncedUser);

  response.json({
    subject: syncedUser.id,
    isAdmin: syncedUser.isAdmin,
    user: syncedUser,
    token: localToken,
    syncedToNeon: true,
  });
});

storeRouter.post("/auth/login", async (request, response) => {
  const db = getDatabase();
  const input = localLoginSchema.parse(request.body);
  const email = input.email.toLowerCase();

  const neonUsers = await db
    .$queryRaw<
      Array<{ id: string; name: string | null; email: string; role: string | null; password: string | null }>
    >`
      SELECT
        u.id::text AS id,
        u.name,
        u.email,
        u.role,
        (
          SELECT a.password
          FROM neon_auth.account a
          WHERE a."userId" = u.id AND a.password IS NOT NULL
          LIMIT 1
        ) AS password
      FROM neon_auth."user" u
      WHERE lower(u.email) = ${email}
      LIMIT 1
    `
    .catch(() => []);

  const existingPublic = await db.user.findUnique({ where: { email } });
  const passwordHash = hashPassword(input.password);

  if (existingPublic && existingPublic.passwordHash && existingPublic.passwordHash !== "NEON_AUTH_MANAGED") {
    if (existingPublic.passwordHash !== passwordHash && !neonUsers[0]) {
      throw new HttpError(401, "Email hoặc mật khẩu không chính xác.");
    }
  }

  const syncedUser = await syncUserToDatabase({
    id: neonUsers[0]?.id ?? existingPublic?.id ?? crypto.randomUUID(),
    name: input.name || neonUsers[0]?.name || existingPublic?.name || email.split("@")[0],
    email,
    phone: input.phone ?? existingPublic?.phone ?? null,
    neonRole: neonUsers[0]?.role ?? (existingPublic?.role === UserRole.ADMIN ? "admin" : "user"),
    passwordHash: neonUsers[0]?.password ?? passwordHash,
    strictDuplicateCheck: true,
  });

  const token = await signLocalToken(syncedUser);
  response.json({
    subject: syncedUser.id,
    isAdmin: syncedUser.isAdmin,
    user: syncedUser,
    token,
    syncedToNeon: true,
  });
});

storeRouter.get("/account/me", requireAuth, async (request, response) => {
  const db = getDatabase();
  const user = await db.user.findUnique({
    where: { id: request.authUser!.id },
    include: {
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) {
    throw new HttpError(401, "Tài khoản không tồn tại. Vui lòng đăng nhập lại.", {
      redirectToLogin: true,
    });
  }
  response.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isAdmin: user.role === UserRole.ADMIN,
    orders: user.orders.map(orderDto),
  });
});

storeRouter.put("/account/profile", requireAuth, async (request, response) => {
  const db = getDatabase();
  const input = updateProfileSchema.parse(request.body);
  const currentUser = await db.user.findUnique({
    where: { id: request.authUser!.id },
  });

  if (!currentUser) {
    throw new HttpError(401, "Vui lòng đăng nhập lại.", { redirectToLogin: true });
  }

  const normalizedEmail = input.email.toLowerCase();
  const normalizedPhone = normalizePhoneNumber(input.phone)!;

  // 1 khách hàng chỉ được dùng 1 email duy nhất
  if (normalizedEmail !== currentUser.email.toLowerCase()) {
    throw new HttpError(
      409,
      `Mỗi khách hàng chỉ được phép sử dụng 1 địa chỉ email duy nhất (${currentUser.email}). Vui lòng đăng nhập lại!`,
      { code: "EMAIL_LOCKED", redirectToLogin: true },
    );
  }

  // Nếu đã có SĐT gắn với tài khoản mà đổi sang SĐT khác -> từ chối và quay về đăng nhập
  if (currentUser.phone && currentUser.phone !== normalizedPhone) {
    throw new HttpError(
      409,
      `Mỗi khách hàng chỉ được phép sử dụng 1 số điện thoại duy nhất (${currentUser.phone}). Vui lòng đăng nhập lại!`,
      { code: "PHONE_LOCKED", redirectToLogin: true },
    );
  }

  // Kiểm tra SĐT có bị trùng với tài khoản khác không
  const phoneOwner = await db.user.findUnique({ where: { phone: normalizedPhone } });
  if (phoneOwner && phoneOwner.id !== currentUser.id) {
    throw new HttpError(
      409,
      "Số điện thoại này đã được đăng ký bởi một tài khoản khác. Vui lòng đăng nhập!",
      { code: "DUPLICATE_PHONE", redirectToLogin: true },
    );
  }

  const updated = await db.user.update({
    where: { id: currentUser.id },
    data: {
      name: input.name,
      phone: normalizedPhone,
    },
  });

  response.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    role: updated.role,
    isAdmin: updated.role === UserRole.ADMIN,
  });
});

// ==================== CHECKOUT & OTP (CONFLICT-FREE) ====================

storeRouter.post("/checkout/otp", optionalAuth, async (request, response) => {
  const db = getDatabase();
  const input = requestOtpSchema.parse(request.body);
  const uniqueItems = normalizeUniqueItems(input.items);

  const products = await db.product.findMany({
    where: { id: { in: [...uniqueItems.keys()] } },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));

  let subtotal = 0;
  const snapshotItems: Array<{ productId: string; quantity: number; priceVnd: number }> = [];

  for (const [productId, quantity] of uniqueItems) {
    const product = productsById.get(productId);
    if (!product) {
      throw new HttpError(404, "Một sản phẩm trong giỏ hàng không còn tồn tại.");
    }
    if (product.stock <= 0) {
      throw new HttpError(409, `Sản phẩm "${product.name}" hiện đã hết hàng.`);
    }
    if (product.stock < quantity) {
      throw new HttpError(
        409,
        `Sản phẩm "${product.name}" chỉ còn ${product.stock} ${product.unit} trong kho.`,
      );
    }
    const priceVnd = product.price * INR_TO_VND;
    subtotal += priceVnd * quantity;
    snapshotItems.push({ productId, quantity, priceVnd });
  }

  const taxRate = await getTaxRate();
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const tax = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + deliveryFee + tax;

  const otpCode = generateSixDigitOtp();
  const orderCode = generateOrderCode();
  const expiresAt = new Date(Date.now() + OTP_LIFETIME_SECONDS * 1000);

  // Dọn các OTP hết hạn cũ để tránh rác DB
  await db.paymentOtp
    .deleteMany({
      where: {
        verified: false,
        expiresAt: { lt: new Date(Date.now() - 3600_000) },
      },
    })
    .catch(() => undefined);

  const paymentOtp = await db.paymentOtp.create({
    data: {
      orderCode,
      otpCode,
      amountVnd: total,
      itemsSnapshot: JSON.stringify(snapshotItems),
      expiresAt,
    },
  });

  response.status(201).json({
    otpId: paymentOtp.id,
    orderCode: paymentOtp.orderCode,
    otpCode: paymentOtp.otpCode,
    subtotal,
    deliveryFee,
    tax,
    total,
    taxRate,
    expiresAt: paymentOtp.expiresAt.toISOString(),
    ttlSeconds: OTP_LIFETIME_SECONDS,
  });
});

storeRouter.post("/checkout/verify-otp", optionalAuth, async (request, response) => {
  const db = getDatabase();
  const input = verifyOtpSchema.parse(request.body);

  const record = await db.paymentOtp.findFirst({
    where: input.otpId ? { id: input.otpId } : { orderCode: input.orderCode },
  });

  if (!record) {
    throw new HttpError(404, "Phiên thanh toán OTP không tồn tại. Vui lòng tạo mã OTP mới.");
  }

  if (record.usedForOrderId) {
    response.json({
      verified: true,
      alreadyUsed: true,
      orderId: record.usedForOrderId,
      orderCode: record.orderCode,
    });
    return;
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    throw new HttpError(410, "Mã OTP đã hết hạn. Vui lòng nhấn 'Tạo mã OTP mới'.");
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    throw new HttpError(
      429,
      "Bạn đã nhập sai mã OTP quá số lần quy định. Vui lòng tạo mã OTP mới.",
    );
  }

  if (record.otpCode !== input.otpCode) {
    const updated = await db.paymentOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = Math.max(0, MAX_OTP_ATTEMPTS - updated.attempts);
    throw new HttpError(
      400,
      remaining > 0
        ? `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`
        : "Mã OTP không chính xác và đã bị khóa. Vui lòng tạo mã OTP mới.",
    );
  }

  await db.paymentOtp.update({
    where: { id: record.id },
    data: { verified: true },
  });

  response.json({
    verified: true,
    otpId: record.id,
    orderCode: record.orderCode,
    amountVnd: record.amountVnd,
  });
});

storeRouter.post("/orders", optionalAuth, async (request, response) => {
  const db = getDatabase();
  const input = createOrderSchema.parse(request.body);
  const uniqueItems = normalizeUniqueItems(input.items);

  // 0. Kiểm tra luồng quản lý Account khách hàng: 1 khách hàng chỉ được dùng 1 SĐT và 1 Email
  const normalizedPhone = normalizePhoneNumber(input.phone)!;
  const phoneOwner = await db.user.findUnique({ where: { phone: normalizedPhone } });
  const emailOwner = input.email
    ? await db.user.findUnique({ where: { email: input.email.toLowerCase() } })
    : null;

  if (!request.authUser) {
    if (phoneOwner) {
      throw new HttpError(
        409,
        "Số điện thoại này đã được đăng ký tài khoản. Vui lòng đăng nhập để đặt hàng!",
        { code: "DUPLICATE_PHONE", redirectToLogin: true },
      );
    }
    if (emailOwner) {
      throw new HttpError(
        409,
        "Email này đã được đăng ký tài khoản. Vui lòng đăng nhập để đặt hàng!",
        { code: "DUPLICATE_EMAIL", redirectToLogin: true },
      );
    }
  } else {
    const currentDbUser = await db.user.findUnique({
      where: { id: request.authUser.id },
    });
    if (!currentDbUser) {
      throw new HttpError(401, "Tài khoản không hợp lệ. Vui lòng đăng nhập lại!", {
        redirectToLogin: true,
      });
    }

    if (
      input.email &&
      input.email.toLowerCase() !== currentDbUser.email.toLowerCase()
    ) {
      throw new HttpError(
        409,
        `Mỗi khách hàng chỉ được phép sử dụng 1 email duy nhất (${currentDbUser.email}). Vui lòng đăng nhập lại!`,
        { code: "EMAIL_MISMATCH", redirectToLogin: true },
      );
    }

    if (currentDbUser.phone && currentDbUser.phone !== normalizedPhone) {
      throw new HttpError(
        409,
        `Mỗi khách hàng chỉ được sử dụng 1 số điện thoại duy nhất (${currentDbUser.phone}). Vui lòng đăng nhập lại!`,
        { code: "PHONE_MISMATCH", redirectToLogin: true },
      );
    }

    if (phoneOwner && phoneOwner.id !== currentDbUser.id) {
      throw new HttpError(
        409,
        "Số điện thoại này đã thuộc về một tài khoản khách hàng khác. Vui lòng đăng nhập đúng tài khoản!",
        { code: "DUPLICATE_PHONE", redirectToLogin: true },
      );
    }

    // Nếu tài khoản chưa có SĐT thì gắn cố định SĐT này vào tài khoản khách hàng
    if (!currentDbUser.phone) {
      await db.user.update({
        where: { id: currentDbUser.id },
        data: { phone: normalizedPhone },
      });
    }
  }

  // 1. Kiểm tra chống trùng lặp đơn hàng (Idempotency) theo orderCode hoặc otpId
  if (input.orderCode) {
    const existingOrder = await db.order.findUnique({
      where: { orderCode: input.orderCode },
      include: { items: true },
    });
    if (existingOrder) {
      response.status(200).json(orderDto(existingOrder));
      return;
    }
  }

  // 2. Xác thực mã OTP trên máy chủ nếu thanh toán bằng QR_OTP hoặc khi có truyền otpId/orderCode
  let otpRecordId: string | null = null;
  let resolvedOrderCode = input.orderCode ?? generateOrderCode();

  if (input.paymentMethod === "QR_OTP" || input.otpId || input.otpCode) {
    const otpRecord = await db.paymentOtp.findFirst({
      where: input.otpId
        ? { id: input.otpId }
        : input.orderCode
          ? { orderCode: input.orderCode }
          : undefined,
    });

    if (otpRecord) {
      if (otpRecord.usedForOrderId) {
        const existingOrder = await db.order.findUnique({
          where: { id: otpRecord.usedForOrderId },
          include: { items: true },
        });
        if (existingOrder) {
          response.status(200).json(orderDto(existingOrder));
          return;
        }
      }

      if (otpRecord.expiresAt.getTime() <= Date.now()) {
        throw new HttpError(410, "Mã OTP thanh toán đã hết hạn. Vui lòng tạo mã OTP mới.");
      }

      if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        throw new HttpError(429, "Mã OTP đã bị khóa do nhập sai quá 5 lần. Vui lòng tạo mã mới.");
      }

      if (!input.otpCode || otpRecord.otpCode !== input.otpCode) {
        const updated = await db.paymentOtp.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        });
        const remaining = Math.max(0, MAX_OTP_ATTEMPTS - updated.attempts);
        throw new HttpError(
          400,
          remaining > 0
            ? `Mã OTP xác nhận thanh toán không đúng (còn ${remaining} lần thử).`
            : "Mã OTP đã bị khóa. Vui lòng tạo mã OTP mới.",
        );
      }

      otpRecordId = otpRecord.id;
      resolvedOrderCode = otpRecord.orderCode;
    } else if (input.paymentMethod === "QR_OTP" && !input.otpCode) {
      throw new HttpError(400, "Vui lòng nhập mã OTP 6 chữ số để xác nhận thanh toán.");
    }
  }

  // 3. Giao dịch nguyên tử (Atomic Transaction): kiểm tra & trừ tồn kho chống xung đột (race condition)
  const order = await db.$transaction(async (transaction) => {
    const products = await transaction.product.findMany({
      where: { id: { in: [...uniqueItems.keys()] } },
    });
    const productsById = new Map(products.map((product) => [product.id, product]));
    let subtotal = 0;
    const orderItems: Array<{
      productId: string;
      name: string;
      image: string;
      price: number;
      quantity: number;
      unit: string;
    }> = [];

    for (const [productId, quantity] of uniqueItems) {
      const product = productsById.get(productId);
      if (!product) {
        throw new HttpError(404, "Một sản phẩm trong giỏ không còn tồn tại.");
      }
      if (product.stock < quantity) {
        throw new HttpError(
          409,
          `Sản phẩm "${product.name}" không đủ tồn kho (hiện còn ${product.stock} ${product.unit}).`,
        );
      }

      // Cập nhật có điều kiện stock >= quantity để tránh xung đột khi nhiều người mua cùng lúc
      const decremented = await transaction.product.updateMany({
        where: {
          id: productId,
          stock: { gte: quantity },
        },
        data: {
          stock: { decrement: quantity },
        },
      });

      if (decremented.count === 0) {
        throw new HttpError(
          409,
          `Sản phẩm "${product.name}" vừa thay đổi số lượng tồn kho. Vui lòng kiểm tra lại giỏ hàng.`,
        );
      }

      const priceVnd = product.price * INR_TO_VND;
      subtotal += priceVnd * quantity;
      orderItems.push({
        productId,
        name: product.name,
        image: product.image,
        price: priceVnd,
        quantity,
        unit: product.unit,
      });
    }

    const taxRate = await transaction.storeSetting.upsert({
      where: { key: "default" },
      create: { key: "default", taxRate: 5 },
      update: {},
    });
    const deliveryFee =
      subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const tax = Math.round(subtotal * (taxRate.taxRate / 100));

    const createdOrder = await transaction.order.create({
      data: {
        orderCode: resolvedOrderCode,
        userId: request.authUser?.id ?? null,
        customerName: input.customerName,
        phone: input.phone,
        address: input.address,
        subtotal,
        deliveryFee,
        tax,
        total: subtotal + deliveryFee + tax,
        paymentMethod: input.paymentMethod,
        isPaid: input.paymentMethod === "QR_OTP",
        items: { create: orderItems },
      },
      include: { items: true },
    });

    if (otpRecordId) {
      await transaction.paymentOtp.update({
        where: { id: otpRecordId },
        data: {
          verified: true,
          usedForOrderId: createdOrder.id,
        },
      });
    }

    return createdOrder;
  });

  response.status(201).json(orderDto(order));
});

storeRouter.get("/orders/my", requireAuth, async (request, response) => {
  const db = getDatabase();
  const orders = await db.order.findMany({
    where: { userId: request.authUser!.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  response.json(orders.map(orderDto));
});

// ==================== ADMIN ONLY ROUTES ====================

storeRouter.get("/admin/users", requireAuth, requireAdmin, async (_request, response) => {
  const db = getDatabase();
  // Đồng bộ toàn bộ tài khoản từ neon_auth.user sang public.User trước khi trả về
  await db
    .$executeRaw`
      INSERT INTO public."User" ("id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt")
      SELECT
        u.id::text,
        COALESCE(NULLIF(TRIM(u.name), ''), split_part(u.email, '@', 1)),
        LOWER(TRIM(u.email)),
        COALESCE((SELECT a.password FROM neon_auth.account a WHERE a."userId" = u.id AND a.password IS NOT NULL LIMIT 1), 'NEON_AUTH_MANAGED'),
        CASE WHEN u.role = 'admin' THEN 'ADMIN'::public."UserRole" ELSE 'CUSTOMER'::public."UserRole" END,
        COALESCE(u."createdAt"::timestamp(3), CURRENT_TIMESTAMP),
        CURRENT_TIMESTAMP
      FROM neon_auth."user" u
      ON CONFLICT ("email") DO UPDATE SET
        "name" = EXCLUDED."name",
        "updatedAt" = CURRENT_TIMESTAMP
    `
    .catch(() => undefined);

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
    },
  });

  response.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isAdmin: u.role === UserRole.ADMIN,
      orderCount: u._count.orders,
      createdAt: u.createdAt.toISOString(),
    })),
  );
});

storeRouter.patch(
  "/admin/users/:id/role",
  requireAuth,
  requireAdmin,
  async (request, response) => {
    const db = getDatabase();
    const targetId = z.string().min(1).parse(request.params.id);
    const { role } = updateUserRoleSchema.parse(request.body);

    const updated = await db.user.update({
      where: { id: targetId },
      data: { role: role === "ADMIN" ? UserRole.ADMIN : UserRole.CUSTOMER },
    });

    const neonRole = role === "ADMIN" ? "admin" : "user";
    await db
      .$executeRaw`UPDATE neon_auth."user" SET role = ${neonRole} WHERE id::text = ${updated.id} OR lower(email) = lower(${updated.email})`
      .catch(() => undefined);

    response.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isAdmin: updated.role === UserRole.ADMIN,
    });
  },
);

storeRouter.get("/admin/products", requireAuth, requireAdmin, async (_request, response) => {
  const products = await getDatabase().product.findMany({
    orderBy: { createdAt: "desc" },
  });
  response.json(products.map(productDto));
});

storeRouter.post("/admin/products", requireAuth, requireAdmin, async (request, response) => {
  const input = productSchema.parse(request.body);
  const product = await getDatabase().product.create({
    data: {
      name: input.name,
      description: input.description,
      price: input.price,
      originalPrice: input.originalPrice,
      image: input.image,
      category: input.category,
      unit: input.unit,
      stock: input.stock,
      isOrganic: input.isOrganic,
      rating: input.rating,
      reviewCount: input.reviewCount,
      discount: input.discount,
    },
  });
  response.status(201).json(productDto(product));
});

storeRouter.put("/admin/products/:id", requireAuth, requireAdmin, async (request, response) => {
  const input = productSchema.omit({ _id: true, createdAt: true }).parse(request.body);
  const product = await getDatabase().product.update({
    where: { id: z.string().min(1).parse(request.params.id) },
    data: input,
  });
  response.json(productDto(product));
});

storeRouter.patch(
  "/admin/products/:id/stock",
  requireAuth,
  requireAdmin,
  async (request, response) => {
    const id = z.string().min(1).parse(request.params.id);
    const { stock } = stockUpdateSchema.parse(request.body);
    const product = await getDatabase().product.update({
      where: { id },
      data: { stock },
    });
    response.json(productDto(product));
  },
);

storeRouter.delete(
  "/admin/products/:id",
  requireAuth,
  requireAdmin,
  async (request, response) => {
    const id = z.string().min(1).parse(request.params.id);
    await getDatabase().product.delete({ where: { id } });
    response.status(204).send();
  },
);

export const NUTRAGO_CATALOG_PRODUCTS = [
  // 1. WHEY & MASS GAINER (6 SẢN PHẨM)
  {
    id: "gym_prod_15",
    name: "Dymatize Elite 100% Whey Protein 2.3kg (5 LB) - Gourmet Vanilla",
    description:
      "25g Whey Protein hấp thụ nhanh, 5.5g BCAAs và 2.7g L-Leucine mỗi muỗng. Hỗ trợ tổng hợp cơ bắp tối ưu cho 67 lần dùng.",
    price: 5500,
    originalPrice: 6400,
    image: "/gym-assets/gym_15.jpg",
    category: "whey-protein",
    unit: "hũ 2.3kg (67 lần dùng)",
    stock: 42,
    isOrganic: false,
    rating: 4.9,
    reviewCount: 248,
    discount: 14,
  },
  {
    id: "gym_prod_14",
    name: "EHPlabs OxyWhey Daily Lean Whey Protein 825g - Strawberry Milkshake",
    description:
      "25g Protein nạc tinh khiết, 0g đường bổ sung, 0g chất béo chuyển hóa, chỉ 3g Carbs. Phù hợp cả siết cơ lẫn tăng cơ nạc.",
    price: 3200,
    originalPrice: 3800,
    image: "/gym-assets/gym_14.jpg",
    category: "whey-protein",
    unit: "hũ 825g (25 lần dùng)",
    stock: 36,
    isOrganic: false,
    rating: 4.9,
    reviewCount: 164,
    discount: 16,
  },
  {
    id: "gym_prod_11",
    name: "360°CUT 360Pro Premium Whey Protein 951g - Chocolate Silk",
    description:
      "24g Protein, chỉ 2g Net Carbs và 1g đường kèm enzyme tiêu hóa tự nhiên giúp hấp thụ trọn vẹn không đầy bụng.",
    price: 3400,
    originalPrice: 4000,
    image: "/gym-assets/gym_11.jpg",
    category: "whey-protein",
    unit: "hũ 951g (30 lần dùng)",
    stock: 48,
    isOrganic: false,
    rating: 4.8,
    reviewCount: 119,
    discount: 15,
  },
  {
    id: "gym_prod_17",
    name: "Nature's Nutrition Power Packed Whey Protein 886g - Double Rich Chocolate",
    description:
      "100% Premium Micronized Whey dễ hòa tan, 24g Protein mỗi muỗng giúp phục hồi và xây dựng cơ bắp sau tập.",
    price: 3100,
    originalPrice: 3600,
    image: "/gym-assets/gym_17.jpg",
    category: "whey-protein",
    unit: "hũ 886g (24 lần dùng)",
    stock: 52,
    isOrganic: false,
    rating: 4.8,
    reviewCount: 95,
    discount: 14,
  },
  {
    id: "gym_prod_13",
    name: "Nutrimuscle Massive Muscle Mass Gainer 1kg - Choco Treat",
    description:
      "Sữa tăng cân tăng cơ hàm lượng cao: 80g Protein, 1365 Calories, 238g Carbs và tích hợp sẵn Creatine Monohydrate.",
    price: 2500,
    originalPrice: 2950,
    image: "/gym-assets/gym_13.jpg",
    category: "whey-protein",
    unit: "hũ 1kg",
    stock: 40,
    isOrganic: false,
    rating: 4.7,
    reviewCount: 112,
    discount: 15,
  },
  {
    id: "gym_prod_18",
    name: "Nutrición Avanzada Whey Protein 1kg - Túi Chocolate Cao Cấp",
    description:
      "Bột Whey Protein đậm vị Socola đóng túi zip tiện lợi, dễ mang theo phòng tập, bổ sung axit amin thiết yếu mỗi ngày.",
    price: 2400,
    originalPrice: 2800,
    image: "/gym-assets/gym_18.png",
    category: "whey-protein",
    unit: "túi 1kg",
    stock: 55,
    isOrganic: false,
    rating: 4.7,
    reviewCount: 74,
    discount: 14,
  },
  // 2. PRE-WORKOUT & CREATINE (2 SẢN PHẨM)
  {
    id: "gym_prod_02",
    name: "Optimum Nutrition Micronised Creatine Powder 317g (93 Servings)",
    description:
      "100% Creatine Monohydrate tinh khiết không mùi (3g/muỗng), tái tạo năng lượng ATP giúp bứt phá sức mạnh và độ dày cơ bắp.",
    price: 2200,
    originalPrice: 2600,
    image: "/gym-assets/gym_02.jpg",
    category: "pre-workout-creatine",
    unit: "hũ 317g (93 lần dùng)",
    stock: 68,
    isOrganic: false,
    rating: 4.9,
    reviewCount: 286,
    discount: 15,
  },
  {
    id: "gym_prod_03",
    name: "RAW BUM Essential Pre-Workout 405g - Sour Watermelon (30 Servings)",
    description:
      "Công thức Pre-Workout trứ danh từ Chris Bumstead: tăng tập trung cao độ, bơm máu căng cơ và bùng nổ sức bền vị Dưa hấu chua.",
    price: 2800,
    originalPrice: 3300,
    image: "/gym-assets/gym_03.jpg",
    category: "pre-workout-creatine",
    unit: "hũ 405g (30 lần dùng)",
    stock: 44,
    isOrganic: false,
    rating: 4.9,
    reviewCount: 205,
    discount: 15,
  },
  // 3. TẠ ĐÒN, BÁNH TẠ & TẠ ẤM (3 SẢN PHẨM)
  {
    id: "gym_prod_08",
    name: "Bộ Đòn Tạ Olympic & Bánh Tạ Cao Su Bumper Plates (PT Essentials)",
    description:
      "Trọn bộ thanh đòn Olympic 20kg chịu lực cao cùng bộ bánh tạ màu chuẩn thi đấu (5kg, 10kg, 15kg, 20kg, 25kg) kèm khóa chốt.",
    price: 28000,
    originalPrice: 32000,
    image: "/gym-assets/gym_08.jpg",
    category: "weights-barbells",
    unit: "bộ đầy đủ",
    stock: 15,
    isOrganic: false,
    rating: 4.9,
    reviewCount: 89,
    discount: 13,
  },
  {
    id: "gym_prod_01",
    name: "Bánh Tạ Gang Đúc Olympic Standard Barbell 45 LB (20.4 KG)",
    description:
      "Bánh tạ gang nguyên khối sơn tĩnh điện chống gỉ, lỗ trục 50mm chuẩn Olympic, độ bền vĩnh cửu cho bài Squat & Deadlift.",
    price: 4200,
    originalPrice: 4800,
    image: "/gym-assets/gym_01.jpg",
    category: "weights-barbells",
    unit: "1 bánh (20.4kg)",
    stock: 32,
    isOrganic: false,
    rating: 4.8,
    reviewCount: 141,
    discount: 13,
  },
  {
    id: "gym_prod_12",
    name: "Tạ Ấm Gang Đúc Nguyên Khối Kettlebell Đen Nhám 16kg",
    description:
      "Tay cầm bo tròn chống trượt, đáy phẳng vững chãi. Lý tưởng cho Kettlebell Swing, Goblet Squat và đốt mỡ toàn thân.",
    price: 2600,
    originalPrice: 3100,
    image: "/gym-assets/gym_12.jpg",
    category: "weights-barbells",
    unit: "1 quả (16kg)",
    stock: 28,
    isOrganic: false,
    rating: 4.8,
    reviewCount: 108,
    discount: 16,
  },
  // 4. MÁY TẬP & KHUNG GÁNH TẠ (2 SẢN PHẨM)
  {
    id: "gym_prod_06",
    name: "Khung Gánh Tạ Đa Năng Smith Machine Pro (Technogym Style)",
    description:
      "Khung thép hộp công nghiệp siêu chịu lực, thanh trượt bạc đạn êm ái kèm chốt khóa an toàn đa điểm và giá treo tạ tích hợp.",
    price: 65000,
    originalPrice: 74000,
    image: "/gym-assets/gym_06.jpg",
    category: "gym-machines",
    unit: "1 bộ khung",
    stock: 8,
    isOrganic: false,
    rating: 5.0,
    reviewCount: 47,
    discount: 12,
  },
  {
    id: "gym_prod_05",
    name: "Máy Chạy Bộ Điện Đa Năng nutraGO Pro Motor 4.0HP",
    description:
      "Màn hình LCD hiển thị nhịp tim & calo, nâng dốc tự động 15 cấp độ, thảm chạy rộng giảm chấn bảo vệ khớp gối.",
    price: 42000,
    originalPrice: 49000,
    image: "/gym-assets/gym_05.jpg",
    category: "gym-machines",
    unit: "1 máy",
    stock: 12,
    isOrganic: false,
    rating: 4.9,
    reviewCount: 64,
    discount: 14,
  },
  // 5. BOXING & PHỤ KIỆN TẬP LUYỆN (5 SẢN PHẨM)
  {
    id: "gym_prod_07",
    name: "Bao Cát Đấm Bốc Boxing Heavy Bag 1.5m Da PU Chịu Lực",
    description:
      "Bao cát chuyên nghiệp nhồi sẵn ruột ép mật độ cao, dây đai treo chịu tải nặng, giúp rèn lực đấm, đá và Cardio cường độ cao.",
    price: 5200,
    originalPrice: 6000,
    image: "/gym-assets/gym_07.jpg",
    category: "boxing-accessories",
    unit: "1 bao (1.5m)",
    stock: 20,
    isOrganic: false,
    rating: 4.8,
    reviewCount: 77,
    discount: 13,
  },
  {
    id: "gym_prod_10",
    name: "Bóng Đấm Tốc Độ & Phản Xạ Venum Pro Boxing Uppercut Bag",
    description:
      "Thiết kế giọt nước chuyên luyện đòn móc (Hook/Uppercut), né đòn và tăng phản xạ tốc độ tay chuẩn võ sĩ chuyên nghiệp.",
    price: 3800,
    originalPrice: 4400,
    image: "/gym-assets/gym_10.jpg",
    category: "boxing-accessories",
    unit: "1 quả bóng",
    stock: 24,
    isOrganic: false,
    rating: 4.9,
    reviewCount: 61,
    discount: 14,
  },
  {
    id: "gym_prod_09",
    name: "Dây Nhảy Thể Lực Lõi Thép Tốc Độ Cao Ballistic Speed Rope",
    description:
      "Tay cầm nhôm CNC chống trượt tích hợp vòng bi xoay 360°, dây cáp bọc PVC bền bỉ cho bài tập Double-Under & HIIT đốt mỡ.",
    price: 950,
    originalPrice: 1200,
    image: "/gym-assets/gym_09.jpg",
    category: "boxing-accessories",
    unit: "1 dây",
    stock: 75,
    isOrganic: false,
    rating: 4.8,
    reviewCount: 152,
    discount: 21,
  },
  {
    id: "gym_prod_16",
    name: "Con Lăn Massage Giãn Cơ Foam Roller Yes4All High-Density",
    description:
      "Bề mặt gai 3D giải tỏa căng thẳng mô cơ sâu (Myofascial Release), giảm đau nhức lưng và bắp chân sau buổi tập nặng.",
    price: 1100,
    originalPrice: 1400,
    image: "/gym-assets/gym_16.jpg",
    category: "boxing-accessories",
    unit: "1 con lăn",
    stock: 58,
    isOrganic: false,
    rating: 4.8,
    reviewCount: 134,
    discount: 21,
  },
  {
    id: "gym_prod_04",
    name: "Kìm Tập Lực Bóp Tay Điều Chỉnh Kháng Lực 10kg – 60kg",
    description:
      "Lò xo thép không gỉ điều chỉnh mượt mà từ 10 đến 60kg, tăng lực nắm cẳng tay (Grip Strength) hỗ trợ kéo xà và Deadlift.",
    price: 650,
    originalPrice: 850,
    image: "/gym-assets/gym_04.jpg",
    category: "boxing-accessories",
    unit: "1 cái",
    stock: 90,
    isOrganic: false,
    rating: 4.7,
    reviewCount: 183,
    discount: 24,
  },
] as const;

export async function syncNutragoCatalogProducts(replaceLegacy = false) {
  const db = getDatabase();
  const validCategories = NUTRAGO_CATEGORIES.map((c) => c.slug);

  let deletedLegacyCount = 0;
  if (replaceLegacy) {
    const deleted = await db.product.deleteMany({
      where: {
        category: { notIn: validCategories },
      },
    });
    deletedLegacyCount = deleted.count;
  }

  for (const item of NUTRAGO_CATALOG_PRODUCTS) {
    await db.product.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        category: item.category,
        unit: item.unit,
        stock: item.stock,
        isOrganic: item.isOrganic,
        rating: item.rating,
        reviewCount: item.reviewCount,
        discount: item.discount,
      },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        category: item.category,
        unit: item.unit,
        isOrganic: item.isOrganic,
      },
    });
  }

  const products = await db.product.findMany({ orderBy: { createdAt: "desc" } });
  return {
    deletedLegacyCount,
    totalProducts: products.length,
    products: products.map(productDto),
  };
}

export async function randomizeAndSyncCatalogProducts(
  options: z.infer<typeof randomizeProductsSchema> = {
    minStock: 5,
    maxStock: 120,
    includeLowStockAlerts: true,
    randomizeDiscounts: true,
  },
) {
  const db = getDatabase();
  const minStock = Math.min(options.minStock, options.maxStock);
  const maxStock = Math.max(options.minStock, options.maxStock);

  await syncNutragoCatalogProducts(false);

  const existingProducts = await db.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (existingProducts.length === 0) {
    throw new HttpError(404, "Chưa có sản phẩm nào trong cơ sở dữ liệu để cập nhật.");
  }

  const indices = existingProducts.map((_, idx) => idx);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }

  const outOfStockIndex = options.includeLowStockAlerts ? indices[0] : -1;
  const lowStockIndices = new Set(
    options.includeLowStockAlerts ? indices.slice(1, Math.min(5, indices.length)) : [],
  );

  const updatedProducts = await db.$transaction(
    existingProducts.map((product, idx) => {
      let nextStock: number;
      if (idx === outOfStockIndex) {
        nextStock = 0;
      } else if (lowStockIndices.has(idx)) {
        nextStock = crypto.randomInt(2, LOW_STOCK_THRESHOLD + 1);
      } else {
        const floor = Math.max(LOW_STOCK_THRESHOLD + 2, minStock);
        const ceiling = Math.max(floor + 10, maxStock);
        nextStock = crypto.randomInt(floor, ceiling + 1);
      }

      let nextDiscount = product.discount;
      let nextOriginalPrice = product.originalPrice;
      if (options.randomizeDiscounts) {
        nextDiscount = crypto.randomInt(5, 26);
        nextOriginalPrice = Math.max(
          product.price + 2,
          Math.round(product.price / (1 - nextDiscount / 100)),
        );
      }

      const nextRating = Number((4.1 + crypto.randomInt(0, 9) * 0.1).toFixed(1));
      const nextReviewCount = crypto.randomInt(8, 95);

      return db.product.update({
        where: { id: product.id },
        data: {
          stock: nextStock,
          discount: nextDiscount,
          originalPrice: nextOriginalPrice,
          rating: nextRating,
          reviewCount: nextReviewCount,
        },
      });
    }),
  );

  const mapped = updatedProducts.map(productDto);
  const outOfStockCount = mapped.filter((p) => p.stock <= 0).length;
  const lowStockCount = mapped.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
  const totalUnitsInStock = mapped.reduce((sum, p) => sum + p.stock, 0);

  return {
    products: mapped,
    summary: {
      updatedCount: mapped.length,
      totalUnitsInStock,
      lowStockCount,
      outOfStockCount,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Chức năng chỉ dành cho Admin: Ngẫu nhiên số lượng hàng tồn kho và thông số ưu đãi
 * của toàn bộ sản phẩm hiện hữu, tự động cập nhật trực tiếp lên CSDL Neon và trả về cho Web.
 */
storeRouter.post(
  "/admin/products/randomize",
  requireAuth,
  requireAdmin,
  async (request, response) => {
    const options = randomizeProductsSchema.parse(request.body ?? {});
    const result = await randomizeAndSyncCatalogProducts(options);
    response.json(result);
  },
);

storeRouter.post(
  "/admin/products/sync-nutrago",
  requireAuth,
  requireAdmin,
  async (request, response) => {
    const replaceLegacy = Boolean(request.body?.replaceLegacy ?? true);
    const result = await syncNutragoCatalogProducts(replaceLegacy);
    response.json(result);
  },
);

storeRouter.get("/admin/orders", requireAuth, requireAdmin, async (_request, response) => {
  const orders = await getDatabase().order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  response.json(orders.map(orderDto));
});

storeRouter.patch(
  "/admin/orders/:id",
  requireAuth,
  requireAdmin,
  async (request, response) => {
    const idOrCode = z.string().min(1).parse(request.params.id);
    const { status } = statusSchema.parse(request.body);
    const db = getDatabase();
    const order = await db.$transaction(async (transaction) => {
      const current = await transaction.order.findFirst({
        where: {
          OR: [{ id: idOrCode }, { orderCode: idOrCode }],
        },
      });
      if (!current) throw new HttpError(404, "Không tìm thấy đơn hàng.");

      if (status === "Đã hủy" && current.status !== OrderStatus.CANCELLED) {
        const items = await transaction.orderItem.findMany({ where: { orderId: current.id } });
        for (const item of items) {
          if (item.productId) {
            await transaction.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      return transaction.order.update({
        where: { id: current.id },
        data: { status: statusToDb[status] },
        include: { items: true },
      });
    });
    response.json(orderDto(order));
  },
);

storeRouter.patch("/admin/settings/tax", requireAuth, requireAdmin, async (request, response) => {
  const { taxRate } = taxSchema.parse(request.body);
  const setting = await getDatabase().storeSetting.upsert({
    where: { key: "default" },
    create: { key: "default", taxRate },
    update: { taxRate },
  });
  response.json({ taxRate: setting.taxRate });
});
