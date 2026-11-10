import { createAuthClient } from "@neon/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  throw new Error("Thiếu VITE_NEON_AUTH_URL. Hãy cấu hình client/.env.local.");
}

export const authClient = createAuthClient(authUrl);

const LOCAL_TOKEN_KEY = "instantmart-auth-token";

export function setStoredAccessToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(LOCAL_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(LOCAL_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem(LOCAL_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string> {
  try {
    const { data, error } = await authClient.getSession();
    const sessionToken = data?.session?.token;
    if (!error && sessionToken) {
      return sessionToken;
    }
  } catch {
    // Fallback sang local token nếu Neon Auth session chưa sẵn sàng
  }

  const stored = getStoredAccessToken();
  if (stored) {
    return stored;
  }

  throw new Error("Vui lòng đăng nhập lại để tiếp tục.");
}

export async function getOptionalAccessToken(): Promise<string | null> {
  try {
    return await getAccessToken();
  } catch {
    return null;
  }
}

export async function signOutAccount(): Promise<void> {
  setStoredAccessToken(null);
  try {
    await authClient.signOut();
  } catch {
    // Ignore signOut network errors
  }
}
