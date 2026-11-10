import "dotenv/config";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...((process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)
    ? { datasource: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL } }
    : {}),
});
