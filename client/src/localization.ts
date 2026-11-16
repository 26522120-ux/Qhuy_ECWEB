import type { Product } from "./types";

export const VND_PER_PRICE_UNIT = 300;
/** @deprecated Dùng VND_PER_PRICE_UNIT hoặc toVndAmount / toPriceUnit */
export const INR_TO_VND = VND_PER_PRICE_UNIT;

export const toVndAmount = (priceUnit: number) =>
  Math.round(priceUnit * VND_PER_PRICE_UNIT);

export const toPriceUnit = (vndAmount: number) =>
  Math.max(1, Math.round(vndAmount / VND_PER_PRICE_UNIT));

const categoryNames: Record<string, string> = {
  "whey-protein": "Whey & Mass Gainer",
  "pre-workout-creatine": "Pre-Workout & Creatine",
  "healthy-meal": "Healthy Meal",
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

export const formatVnd = (priceUnit: number) =>
  formatVndAmount(toVndAmount(priceUnit));

export const formatUnitVi = (unit: string) =>
  unit.replace(/(\d+)\s*pcs\b/i, "$1 cái");
