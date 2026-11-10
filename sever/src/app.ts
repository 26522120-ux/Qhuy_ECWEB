import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { healthRouter } from "./routes/health.routes.js";
import { storeRouter } from "./routes/store.routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const allowedOrigins = new Set([
  ...env.CLIENT_URL.split(",").map((url) => url.trim()).filter(Boolean),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".netlify.app") ||
        origin.endsWith(".up.railway.app") ||
        origin.endsWith(".onrender.com")
      ) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin không được phép truy cập API."));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.use("/api/health", healthRouter);
app.use("/api", storeRouter);

// Tự động phục vụ bản build Frontend (client/dist) nếu triển khai gộp chung 1 Web Service
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const candidateDistPaths = [
  path.resolve(currentDir, "../../client/dist"),
  path.resolve(currentDir, "../../../client/dist"),
  path.resolve(process.cwd(), "../client/dist"),
  path.resolve(process.cwd(), "client/dist"),
];
const clientDistPath =
  candidateDistPaths.find((dir) => fs.existsSync(path.join(dir, "index.html"))) ??
  candidateDistPaths[0];
const clientIndexHtml = path.join(clientDistPath, "index.html");

if (fs.existsSync(clientIndexHtml)) {
  app.use(express.static(clientDistPath));
  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(clientIndexHtml);
  });
} else {
  app.get("/", (_request, response) => {
    response.json({ name: "POPPIN MART API", health: "/api/health" });
  });
}

app.use(notFound);
app.use(errorHandler);
