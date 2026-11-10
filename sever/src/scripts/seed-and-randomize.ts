import { prisma } from "../db/prisma.js";
import { randomizeAndSyncCatalogProducts } from "../routes/store.routes.js";

async function main() {
  const result = await randomizeAndSyncCatalogProducts({
    minStock: 12,
    maxStock: 115,
    includeLowStockAlerts: true,
    randomizeDiscounts: true,
  });
  console.info(
    `Đã cập nhật ngẫu nhiên tồn kho & sản phẩm lên CSDL Neon:`,
    JSON.stringify(result.summary, null, 2),
  );
  await prisma?.$disconnect();
}

main().catch(async (err) => {
  console.error("Lỗi khi ngẫu nhiên hóa dữ liệu sản phẩm:", err);
  await prisma?.$disconnect();
  process.exitCode = 1;
});
