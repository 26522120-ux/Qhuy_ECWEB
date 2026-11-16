import { prisma } from "../db/prisma.js";
import { syncNutragoCatalogProducts } from "../routes/store.routes.js";

async function main() {
  const result = await syncNutragoCatalogProducts(true);
  console.info(
    `Đã đồng bộ danh mục sản phẩm nutraGO lên CSDL Neon: đã xóa ${result.deletedLegacyCount} sản phẩm cũ, hiện có ${result.totalProducts} sản phẩm nutraGO.`,
  );
  await prisma?.$disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Lỗi khi đồng bộ sản phẩm nutraGO lên Neon:", err);
  await prisma?.$disconnect();
  process.exit(1);
});
