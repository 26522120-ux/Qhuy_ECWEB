import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: ".env.local" });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  ADMIN_AUTH_SUBJECT: z.string().optional(),
  DATABASE_URL: z.string().url().optional(),
  DATABASE_URL_UNPOOLED: z.string().url().optional(),
  NEON_AUTH_BASE_URL: z.string().url().optional(),
  NEON_AUTH_JWKS_URL: z.string().url().optional(),
  NEON_FUNCTION_HELLO_BASE_URL: z.string().url().optional(),
  NEON_AI_GATEWAY_BASE_URL: z.string().url().optional(),
  NEON_AI_GATEWAY_TOKEN: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_ENDPOINT_URL_S3: z.string().url().optional(),
  AWS_REGION: z.string().optional(),
  NEON_REALTIME_URL: z.string().url().optional(),
  NEON_REALTIME_SECRET: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Cấu hình môi trường không hợp lệ:\n${details}`);
}

export const env = result.data;
