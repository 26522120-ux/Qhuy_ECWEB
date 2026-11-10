import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import type { RequestHandler } from "express";
import { UserRole } from "../generated/prisma/client.js";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { HttpError } from "../errors/http-error.js";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      authSubject?: string;
      authUser?: AuthenticatedUser;
    }
  }
}

const jwks = env.NEON_AUTH_JWKS_URL
  ? createRemoteJWKSet(new URL(env.NEON_AUTH_JWKS_URL))
  : null;
const issuer = env.NEON_AUTH_BASE_URL
  ? new URL(env.NEON_AUTH_BASE_URL).origin
  : null;

const localJwtSecret = new TextEncoder().encode(
  env.NEON_REALTIME_SECRET || env.DATABASE_URL || "instantmart-local-jwt-secret-key-2026",
);

export async function signLocalToken(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(localJwtSecret);
}

export function isConfiguredAdminSubject(idOrEmail?: string | null): boolean {
  if (!idOrEmail || !env.ADMIN_AUTH_SUBJECT) return false;
  const normalizedTarget = idOrEmail.trim().toLowerCase();
  const configuredList = env.ADMIN_AUTH_SUBJECT.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return configuredList.includes(normalizedTarget);
}

interface NeonAuthRow {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  password: string | null;
}

export function normalizePhoneNumber(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  const cleaned = rawPhone.trim().replace(/[\s.-]+/g, "").replace(/^\+84/, "0");
  return cleaned || null;
}

/**
 * Tự động đồng bộ (sao lưu) thông tin tài khoản từ Neon Auth / phiên đăng nhập
 * về bảng public."User" trên CSDL Neon và xác định quyền ADMIN.
 * Đảm bảo quy tắc: 1 khách hàng chỉ được dùng duy nhất 1 SĐT và 1 Email.
 */
export async function syncUserToDatabase(input: {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  neonRole?: string | null;
  passwordHash?: string | null;
  strictDuplicateCheck?: boolean;
}): Promise<AuthenticatedUser> {
  const email = input.email.trim().toLowerCase();
  const normalizedPhone = normalizePhoneNumber(input.phone);
  const name = (input.name ?? "").trim() || email.split("@")[0] || "Khách hàng";
  const shouldBeAdmin =
    isConfiguredAdminSubject(input.id) ||
    isConfiguredAdminSubject(email) ||
    input.neonRole?.toLowerCase() === "admin";

  if (!prisma) {
    const role = shouldBeAdmin ? UserRole.ADMIN : UserRole.CUSTOMER;
    return {
      id: input.id,
      name,
      email,
      phone: normalizedPhone,
      role,
      isAdmin: role === UserRole.ADMIN,
    };
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  const existingById = existingByEmail
    ? null
    : await prisma.user.findUnique({ where: { id: input.id } });
  const existing = existingByEmail ?? existingById;

  if (normalizedPhone) {
    const phoneOwner = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });
    if (phoneOwner && (!existing || phoneOwner.id !== existing.id)) {
      throw new HttpError(
        409,
        "Số điện thoại này đã được đăng ký cho một tài khoản khác. Vui lòng đăng nhập!",
        { code: "DUPLICATE_PHONE", redirectToLogin: true },
      );
    }
    if (
      input.strictDuplicateCheck &&
      existing?.phone &&
      existing.phone !== normalizedPhone
    ) {
      throw new HttpError(
        409,
        `Mỗi khách hàng chỉ được sử dụng 1 số điện thoại duy nhất (${existing.phone}). Vui lòng đăng nhập lại!`,
        { code: "PHONE_MISMATCH", redirectToLogin: true },
      );
    }
  }

  const finalRole =
    shouldBeAdmin || existing?.role === UserRole.ADMIN
      ? UserRole.ADMIN
      : UserRole.CUSTOMER;

  let savedUser;
  if (existing) {
    savedUser = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: name || existing.name,
        email,
        ...(normalizedPhone && !existing.phone ? { phone: normalizedPhone } : {}),
        ...(input.passwordHash && !existing.passwordHash
          ? { passwordHash: input.passwordHash }
          : {}),
        role: finalRole,
      },
    });
  } else {
    savedUser = await prisma.user.create({
      data: {
        id: input.id,
        name,
        email,
        phone: normalizedPhone,
        passwordHash: input.passwordHash ?? "NEON_AUTH_MANAGED",
        role: finalRole,
      },
    });
  }

  if (finalRole === UserRole.ADMIN) {
    await prisma
      .$executeRaw`UPDATE neon_auth."user" SET role = 'admin' WHERE id::text = ${savedUser.id} OR lower(email) = ${email}`
      .catch(() => undefined);
  }

  return {
    id: savedUser.id,
    name: savedUser.name,
    email: savedUser.email,
    phone: savedUser.phone,
    role: savedUser.role,
    isAdmin: savedUser.role === UserRole.ADMIN,
  };
}

async function resolveBearerToken(token: string): Promise<AuthenticatedUser | null> {
  // 1. Kiểm tra nếu token là session token của Neon Auth (Better Auth lưu trong neon_auth.session)
  if (prisma && !token.includes(".")) {
    const rows = await prisma
      .$queryRaw<NeonAuthRow[]>`
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
        FROM neon_auth.session s
        JOIN neon_auth."user" u ON u.id = s."userId"
        WHERE s.token = ${token}
          AND s."expiresAt" > NOW()
        LIMIT 1
      `
      .catch(() => [] as NeonAuthRow[]);

    const sessionUser = rows[0];
    if (sessionUser) {
      return syncUserToDatabase({
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        neonRole: sessionUser.role,
        passwordHash: sessionUser.password,
      });
    }
  }

  // 2. Kiểm tra nếu token là JWT (Local JWT hoặc Neon Auth JWKS)
  if (token.includes(".")) {
    let sub: string | undefined;
    let emailClaim: string | undefined;
    let nameClaim: string | undefined;
    let roleClaim: string | undefined;

    try {
      const { payload } = await jwtVerify(token, localJwtSecret);
      sub = payload.sub;
      emailClaim = typeof payload.email === "string" ? payload.email : undefined;
      nameClaim = typeof payload.name === "string" ? payload.name : undefined;
      roleClaim = typeof payload.role === "string" ? payload.role : undefined;
    } catch {
      if (jwks && issuer) {
        const { payload } = await jwtVerify(token, jwks, { issuer });
        sub = payload.sub;
        emailClaim = typeof payload.email === "string" ? payload.email : undefined;
        nameClaim = typeof payload.name === "string" ? payload.name : undefined;
        roleClaim = typeof payload.role === "string" ? payload.role : undefined;
      }
    }

    if (sub) {
      if (prisma) {
        const neonRows = await prisma
          .$queryRaw<NeonAuthRow[]>`
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
            WHERE u.id::text = ${sub}
            LIMIT 1
          `
          .catch(() => [] as NeonAuthRow[]);

        if (neonRows[0]) {
          return syncUserToDatabase({
            id: neonRows[0].id,
            name: neonRows[0].name,
            email: neonRows[0].email,
            neonRole: neonRows[0].role,
            passwordHash: neonRows[0].password,
          });
        }

        const existingPublicUser = await prisma.user.findUnique({ where: { id: sub } });
        if (existingPublicUser) {
          return syncUserToDatabase({
            id: existingPublicUser.id,
            name: existingPublicUser.name,
            email: existingPublicUser.email,
            phone: existingPublicUser.phone,
            neonRole: existingPublicUser.role === UserRole.ADMIN ? "admin" : "user",
            passwordHash: existingPublicUser.passwordHash,
          });
        }
      }

      if (emailClaim) {
        return syncUserToDatabase({
          id: sub,
          name: nameClaim,
          email: emailClaim,
          neonRole: roleClaim,
        });
      }
    }
  }

  return null;
}

export const optionalAuth: RequestHandler = async (request, _response, next) => {
  const [scheme, token] = (request.get("authorization") ?? "").split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    next();
    return;
  }

  try {
    const authUser = await resolveBearerToken(token.trim());
    if (authUser) {
      request.authSubject = authUser.id;
      request.authUser = authUser;
    }
  } catch {
    // Bỏ qua lỗi token ở chế độ optionalAuth
  }
  next();
};

export const requireAuth: RequestHandler = async (request, _response, next) => {
  const [scheme, token] = (request.get("authorization") ?? "").split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    next(new HttpError(401, "Vui lòng đăng nhập để tiếp tục."));
    return;
  }

  try {
    const authUser = await resolveBearerToken(token.trim());
    if (!authUser) {
      throw new HttpError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
    }
    request.authSubject = authUser.id;
    request.authUser = authUser;
    next();
  } catch (error) {
    next(
      error instanceof HttpError
        ? error
        : new HttpError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."),
    );
  }
};

export const requireAdmin: RequestHandler = (request, _response, next) => {
  const isAdmin =
    Boolean(request.authUser?.isAdmin) ||
    isConfiguredAdminSubject(request.authSubject) ||
    isConfiguredAdminSubject(request.authUser?.email);

  if (!isAdmin) {
    next(new HttpError(403, "Chỉ quản trị viên (Admin) được phân quyền mới có thể thực hiện thao tác này."));
    return;
  }
  next();
};
