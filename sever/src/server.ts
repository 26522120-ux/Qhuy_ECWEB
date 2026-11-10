import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";

async function startServer() {
  if (prisma) await prisma.$connect();

  const server = app.listen(env.PORT, () => {
    console.info(`InstantMart API đang chạy tại http://localhost:${env.PORT}`);
    if (!env.DATABASE_URL) {
      console.warn("DATABASE_URL chưa được cấu hình; API đang chạy nhưng chưa kết nối database.");
    }
  });

  const shutdown = (signal: string) => {
    console.info(`Nhận ${signal}, đang đóng máy chủ...`);
    server.close(async (error) => {
      await prisma?.$disconnect();
      if (error) {
        console.error("Không thể đóng máy chủ một cách bình thường:", error);
        process.exitCode = 1;
      }
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch(async (error: unknown) => {
  console.error("Không thể khởi động backend:", error);
  await prisma?.$disconnect();
  process.exitCode = 1;
});
