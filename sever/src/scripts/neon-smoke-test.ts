import {
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createRealtime, rawSql } from "@neon/realtime/server";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";

function requireSetting<T>(value: T | undefined, name: string): T {
  if (!value) throw new Error(`${name} chưa được cấu hình.`);
  return value;
}

async function checkPostgres() {
  if (!prisma) throw new Error("DATABASE_URL chưa được cấu hình.");
  await prisma.$queryRaw`SELECT 1`;
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  console.info(`PASS PostgreSQL: kết nối Neon thành công (${tables.length} bảng public).`);
}

async function checkAuth() {
  const jwksUrl = requireSetting(env.NEON_AUTH_JWKS_URL, "NEON_AUTH_JWKS_URL");
  requireSetting(env.NEON_AUTH_BASE_URL, "NEON_AUTH_BASE_URL");
  const response = await fetch(jwksUrl);
  if (!response.ok) throw new Error(`Neon Auth JWKS trả HTTP ${response.status}.`);

  const jwks: unknown = await response.json();
  if (
    typeof jwks !== "object" ||
    jwks === null ||
    !("keys" in jwks) ||
    !Array.isArray(jwks.keys) ||
    jwks.keys.length === 0
  ) {
    throw new Error("Neon Auth JWKS không có khóa xác thực.");
  }
  console.info("PASS Neon Auth: endpoint JWKS hoạt động.");
}

async function checkFunction() {
  const functionUrl = requireSetting(
    env.NEON_FUNCTION_HELLO_BASE_URL,
    "NEON_FUNCTION_HELLO_BASE_URL",
  );
  const response = await fetch(functionUrl);
  const body = await response.text();
  if (!response.ok || !body.includes("Hello from Neon Functions")) {
    throw new Error(`Neon Function trả HTTP ${response.status}.`);
  }
  console.info("PASS Neon Functions: gọi function hello thành công.");
}

async function checkObjectStorage() {
  const endpoint = requireSetting(env.AWS_ENDPOINT_URL_S3, "AWS_ENDPOINT_URL_S3");
  const region = requireSetting(env.AWS_REGION, "AWS_REGION");
  const accessKeyId = requireSetting(env.AWS_ACCESS_KEY_ID, "AWS_ACCESS_KEY_ID");
  const secretAccessKey = requireSetting(env.AWS_SECRET_ACCESS_KEY, "AWS_SECRET_ACCESS_KEY");
  const client = new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  const bucket = "assets";
  const key = `health-check/${crypto.randomUUID()}.txt`;

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: "InstantMart Neon storage health check",
        ContentType: "text/plain",
      }),
    );
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    console.info("PASS Object Storage: bucket assets upload/read kiểm tra thành công.");
  } finally {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } finally {
      client.destroy();
    }
  }
}

async function checkAiGateway() {
  const baseUrl = requireSetting(
    env.NEON_AI_GATEWAY_BASE_URL,
    "NEON_AI_GATEWAY_BASE_URL",
  );
  const token = requireSetting(env.NEON_AI_GATEWAY_TOKEN, "NEON_AI_GATEWAY_TOKEN");
  const response = await fetch(new URL("/v1/models", baseUrl), {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`AI Gateway models trả HTTP ${response.status}.`);

  const result: unknown = await response.json();
  const models =
    typeof result === "object" &&
    result !== null &&
    "data" in result &&
    Array.isArray(result.data)
      ? result.data
      : [];
  const enabledModels = models.filter(
    (model) =>
      typeof model === "object" &&
      model !== null &&
      (!("enabled" in model) || model.enabled === true),
  );

  if (enabledModels.length === 0) {
    console.warn(
      "BLOCKED AI Gateway: API hoạt động nhưng chưa có model khả dụng; cần nạp AI Gateway credits để thử inference.",
    );
    return;
  }

  const model = enabledModels[0];
  if (typeof model !== "object" || model === null || !("id" in model) || typeof model.id !== "string") {
    throw new Error("AI Gateway không trả model ID hợp lệ.");
  }
  const inference = await fetch(new URL("/v1/chat/completions", baseUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: model.id,
      messages: [{ role: "user", content: "Reply with the single word OK." }],
      max_tokens: 8,
    }),
  });
  if (!inference.ok) {
    throw new Error(`AI Gateway inference trả HTTP ${inference.status}.`);
  }
  console.info("PASS AI Gateway: model inference thành công.");
}

async function checkRealtime() {
  const url = requireSetting(env.NEON_REALTIME_URL, "NEON_REALTIME_URL");
  const secret = requireSetting(env.NEON_REALTIME_SECRET, "NEON_REALTIME_SECRET");
  const connectionString = requireSetting(env.DATABASE_URL, "DATABASE_URL");
  const database = decodeURIComponent(new URL(connectionString).pathname.slice(1));
  const realtime = createRealtime({ url, secret, db: database, debugMode: true });

  try {
    const subscription = await realtime.subscribe(
      rawSql<{ product_count: number }>(
        'SELECT count(*)::int AS product_count FROM public."Product"',
      ),
    );
    try {
      await subscription.awaitRows(
        (rows) => rows.length === 1 && rows[0] !== undefined,
        30_000,
      );
    } finally {
      subscription.unsubscribe();
    }
    console.info("PASS Realtime: live query nhận dữ liệu từ Neon.");
  } finally {
    realtime.close();
  }
}

async function runChecks() {
  const checks = [
    ["PostgreSQL", checkPostgres],
    ["Neon Auth", checkAuth],
    ["Neon Functions", checkFunction],
    ["Object Storage", checkObjectStorage],
    ["AI Gateway", checkAiGateway],
    ["Realtime", checkRealtime],
  ] as const;
  const failures: string[] = [];

  for (const [name, check] of checks) {
    try {
      await check();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lỗi không xác định.";
      failures.push(`${name}: ${message}`);
      console.error(`FAIL ${name}: ${message}`);
    }
  }

  if (prisma) await prisma.$disconnect();
  if (failures.length > 0) {
    process.exitCode = 1;
    console.error(`\n${failures.length} kiểm tra Neon thất bại.`);
  }
}

runChecks().catch(async (error: unknown) => {
  console.error("Không thể chạy kiểm tra Neon:", error);
  await prisma?.$disconnect();
  process.exitCode = 1;
});
