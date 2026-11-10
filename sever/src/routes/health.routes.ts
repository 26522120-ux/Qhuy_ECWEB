import { Router } from "express";
import { prisma } from "../db/prisma.js";

export const healthRouter = Router();

healthRouter.get("/", async (_request, response) => {
  if (!prisma) {
    response.status(503).json({
      status: "degraded",
      database: "not_configured",
      message: "Hãy cấu hình DATABASE_URL để kết nối PostgreSQL.",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Kiểm tra kết nối database thất bại:", error);
    response.status(503).json({
      status: "degraded",
      database: "unavailable",
      timestamp: new Date().toISOString(),
    });
  }
});
