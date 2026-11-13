import type { Product } from "./types";

export const INR_TO_VND = 300;

const categoryNames: Record<string, string> = {
  "whey-protein": "Whey & Protein Tăng Cơ",
  "pre-workout-energy": "Pre-Workout & Tăng Sức Bền",
  "creatine-strength": "Creatine & Sức Mạnh",
  "bcaa-amino-recovery": "BCAA, EAA & Phục Hồi",
  "fat-burner-shred": "Giảm Mỡ & Siết Cơ",
  "vitamins-health": "Vitamin, Dầu Cá & Khớp",
  "healthy-bars-foods": "Bánh Protein & Ăn Kiêng",
  "gym-gear-accessories": "Phụ Kiện & Dụng Cụ Gym",
};

export const getCategoryNameVi = (slug: string) => categoryNames[slug] ?? slug;

export const getProductNameVi = (product: Product) => product.name;

export const getProductDescriptionVi = (product: Product) => product.description;

export const formatVndAmount = (vndAmount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Math.round(vndAmount));

export const formatVnd = (inrAmount: number) =>
  formatVndAmount(inrAmount * INR_TO_VND);

export const formatUnitVi = (unit: string) =>
  unit.replace(/(\d+)\s*pcs\b/i, "$1 cái");
