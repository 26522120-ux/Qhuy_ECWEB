import type { Product } from "./types";

export const INR_TO_VND = 300;

const categoryNames: Record<string, string> = {
  "whey-protein": "Whey & Mass Gainer",
  "pre-workout-creatine": "Pre-Workout & Creatine",
  "weights-barbells": "Tạ Đòn, Bánh Tạ & Tạ Ấm",
  "gym-machines": "Máy Tập & Khung Gánh Tạ",
  "boxing-accessories": "Boxing & Phụ Kiện Gym",
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
