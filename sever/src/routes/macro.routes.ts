import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { HttpError } from "../errors/http-error.js";

export const macroRouter = Router();

const LOW_STOCK_THRESHOLD = 10;

const macroRecommendSchema = z.object({
  gender: z.enum(["male", "female"]).default("male"),
  age: z.coerce.number().int().min(14).max(90),
  weightKg: z.coerce.number().min(30).max(250),
  heightCm: z.coerce.number().min(120).max(230),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .default("moderate"),
  goal: z.enum(["cut", "maintain", "bulk"]).default("maintain"),
  mealsPerDay: z.coerce.number().int().min(2).max(6).default(3),
});

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} as const;

interface MealMacroProfile {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  tags: string[];
}

function getStockStatus(stock: number) {
  if (stock <= 0) {
    return { stockStatus: "OUT_OF_STOCK" as const, stockLabel: "Hết hàng" };
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return {
      stockStatus: "LOW_STOCK" as const,
      stockLabel: `Sắp hết hàng (còn ${stock})`,
    };
  }
  return {
    stockStatus: "IN_STOCK" as const,
    stockLabel: `Còn hàng (${stock})`,
  };
}

export function resolveProductMacros(product: {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  description: string;
}): MealMacroProfile {
  if (
    product.calories > 0 ||
    product.proteinG > 0 ||
    product.carbsG > 0 ||
    product.fatG > 0
  ) {
    const computedCalories =
      product.calories > 0
        ? product.calories
        : product.proteinG * 4 + product.carbsG * 4 + product.fatG * 9;
    const tags: string[] = [];
    if (product.proteinG >= 45) tags.push("High-Protein");
    if (product.carbsG <= 20) tags.push("Low-Carb / Keto");
    if (product.fatG <= 15) tags.push("Ít béo");
    if (tags.length === 0) tags.push("Cân bằng Macro");
    return {
      calories: computedCalories,
      proteinG: product.proteinG,
      carbsG: product.carbsG,
      fatG: product.fatG,
      tags,
    };
  }

  const proteinMatch = product.description.match(/(\d+)\s*g\s*protein/i);
  const proteinG = proteinMatch ? Number(proteinMatch[1]) : 35;
  const carbsG = 30;
  const fatG = 16;
  return {
    calories: proteinG * 4 + carbsG * 4 + fatG * 9,
    proteinG,
    carbsG,
    fatG,
    tags: ["Healthy Meal"],
  };
}

macroRouter.post("/macros/recommend", async (request, response) => {
  if (!prisma) throw new HttpError(503, "Database chưa được cấu hình.");
  const input = macroRecommendSchema.parse(request.body);

  const bmrRaw =
    10 * input.weightKg +
    6.25 * input.heightCm -
    5 * input.age +
    (input.gender === "male" ? 5 : -161);
  const bmr = Math.round(bmrRaw);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[input.activityLevel]);

  const targetCalories =
    input.goal === "cut"
      ? Math.max(1200, tdee - 450)
      : input.goal === "bulk"
        ? tdee + 350
        : tdee;

  const proteinPerKg =
    input.goal === "cut" ? 2.2 : input.goal === "bulk" ? 2.0 : 1.8;
  const fatRatio = input.goal === "cut" ? 0.25 : 0.28;

  const proteinG = Math.round(input.weightKg * proteinPerKg);
  const fatG = Math.round((targetCalories * fatRatio) / 9);
  const carbsG = Math.max(
    30,
    Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4),
  );

  const perMeal = {
    calories: Math.round(targetCalories / input.mealsPerDay),
    proteinG: Math.round(proteinG / input.mealsPerDay),
    carbsG: Math.round(carbsG / input.mealsPerDay),
    fatG: Math.round(fatG / input.mealsPerDay),
  };

  const healthyMeals = await prisma.product.findMany({
    where: { category: "healthy-meal", stock: { gt: 0 } },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
  });

  const recommendations = healthyMeals
    .map((product) => {
      const macros = resolveProductMacros(product);
      const calDiffRatio =
        Math.abs(macros.calories - perMeal.calories) /
        Math.max(perMeal.calories, 1);
      const proteinDiffRatio =
        Math.abs(macros.proteinG - perMeal.proteinG) /
        Math.max(perMeal.proteinG, 1);

      let goalBonus = 0;
      if (input.goal === "cut") {
        if (macros.calories <= perMeal.calories + 60) goalBonus += 8;
        if (macros.proteinG >= 38) goalBonus += 6;
      } else if (input.goal === "bulk") {
        if (macros.proteinG >= 42) goalBonus += 8;
        if (macros.calories >= perMeal.calories - 80) goalBonus += 6;
      } else if (calDiffRatio <= 0.25) {
        goalBonus += 8;
      }

      const rawScore =
        92 - calDiffRatio * 34 - proteinDiffRatio * 24 + goalBonus;
      const matchScore = Math.max(55, Math.min(99, Math.round(rawScore)));

      const reasons: string[] = [];
      if (macros.proteinG >= perMeal.proteinG) {
        reasons.push(`Đáp ứng tốt ${macros.proteinG}g đạm/bữa`);
      } else {
        reasons.push(`Bổ sung ${macros.proteinG}g đạm sạch`);
      }
      if (input.goal === "cut" && macros.calories <= perMeal.calories + 50) {
        reasons.push("Phù hợp mức calo siết mỡ");
      } else if (input.goal === "bulk" && macros.calories >= 480) {
        reasons.push("Giàu năng lượng phục hồi & tăng cơ");
      } else {
        reasons.push(`Cân đối ~${macros.calories} kcal mỗi khẩu phần`);
      }

      const { stockStatus, stockLabel } = getStockStatus(product.stock);

      return {
        product: {
          ...product,
          _id: product.id,
          stockStatus,
          stockLabel,
          createdAt: product.createdAt.toISOString(),
        },
        macros,
        matchScore,
        reason: reasons.join(" • "),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  response.json({
    summary: {
      bmr,
      tdee,
      targetCalories,
      proteinG,
      carbsG,
      fatG,
      mealsPerDay: input.mealsPerDay,
      goal: input.goal,
      perMeal,
    },
    recommendations,
  });
});
