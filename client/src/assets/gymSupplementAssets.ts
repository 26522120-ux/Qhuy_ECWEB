import type { Product } from "../types";

export interface GymCategoryItem {
  slug: string;
  name: string;
  nameVi: string;
  description: string;
  image: string;
}

/**
 * 5 Danh mục khoa học, cân đối cho hệ thống FORM/FWD Gym & Supplement Fitness
 * Sử dụng 100% hình ảnh thực tế từ gói tài nguyên gym-assets
 */
export const gymCategoriesData: GymCategoryItem[] = [
  {
    slug: "whey-protein",
    name: "Whey & Mass Gainer",
    nameVi: "Whey & Mass Gainer",
    description: "Whey Isolate, Whey Blend & Mass Gainer tăng cơ tăng cân",
    image: "/gym-assets/gym_15.jpg",
  },
  {
    slug: "pre-workout-creatine",
    name: "Pre-Workout & Creatine",
    nameVi: "Pre-Workout & Creatine",
    description: "Tăng sức mạnh đẩy tạ, bơm cơ & tỉnh táo trước buổi tập",
    image: "/gym-assets/gym_02.jpg",
  },
];

/**
 * 18 Sản phẩm thực tế từ bộ ảnh đã tải lên (Quy đổi INR_TO_VND = 300 sang VND)
 */
export const gymSupplementProducts: Array<Product & { id: string; priceVnd: number }> = [
  // ==================== 1. WHEY & MASS GAINER (7 SẢN PHẨM) ====================
  {
    _id: "gym_prod_giant_whey",
    id: "gym_prod_giant_whey",
    name: "GIANT Performance Whey Protein 2kg (55 Servings) - Cookies & Cream",
    description:
      "Ultra Premium Whey Protein với 26g Protein tinh khiết, chỉ 130 Calories và 55 lần dùng mỗi hũ. Hỗ trợ phục hồi và phát triển cơ bắp nạc tối đa.",
    price: 4600,
    originalPrice: 6150,
    priceVnd: 1_380_000,
    image: "/gym-assets/gym_giant_whey.jpg",
    category: "whey-protein",
    unit: "hũ 2kg (55 lần dùng)",
    stock: 38,
    isOrganic: false,
    rating: 4.9,
    reviewCount: 312,
    discount: 25,
    createdAt: "2026-11-13T10:05:00.000Z",
  },
  {
    _id: "gym_prod_15",
    id: "gym_prod_15",
    name: "Dymatize Elite 100% Whey Protein 2.3kg (5 LB) - Gourmet Vanilla",
    description:
      "25g Whey Protein hấp thụ nhanh, 5.5g BCAAs và 2.7g L-Leucine mỗi muỗng. Hỗ trợ tổng hợp cơ bắp tối ưu cho 67 lần dùng.",
    price: 5500,
    originalPrice: 6400,
    priceVnd: 1_650_000,
    image: "/gym-assets/gym_15.jpg",
    category: "whey-protein",
    unit: "hũ 2.3kg (67 lần dùng)",
    stock: 42,
    isOrganic: false,
    rating: 4.9,
    reviewCount: 248,
    discount: 14,
    createdAt: "2026-11-13T10:00:00.000Z",
  },
  {
    _id: "gym_prod_14",
    id: "gym_prod_14",
    name: "EHPlabs OxyWhey Daily Lean Whey Protein 825g - Strawberry Milkshake",
    description:
      "25g Protein nạc tinh khiết, 0g đường bổ sung, 0g chất béo chuyển hóa, chỉ 3g Carbs. Phù hợp cả siết cơ lẫn tăng cơ nạc.",
    price: 3200,
    originalPrice: 3800,
    priceVnd: 960_000,
    image: "/gym-assets/gym_14.jpg",
    category: "whey-protein",
    unit: "hũ 825g (25 lần dùng)",
    stock: 36,
    isOrganic: false,
    rating: 4.9,
    reviewCount: 164,
    discount: 16,
    createdAt: "2026-11-13T09:55:00.000Z",
  },
  {
    _id: "gym_prod_11",
    id: "gym_prod_11",
    name: "360°CUT 360Pro Premium Whey Protein 951g - Chocolate Silk",
    description:
      "24g Protein, chỉ 2g Net Carbs và 1g đường kèm enzyme tiêu hóa tự nhiên giúp hấp thụ trọn vẹn không đầy bụng.",
    price: 3400,
    originalPrice: 4000,
    priceVnd: 1_020_000,
    image: "/gym-assets/gym_11.jpg",
    category: "whey-protein",
    unit: "hũ 951g (30 lần dùng)",
    stock: 48,
    isOrganic: false,
    rating: 4.8,
    reviewCount: 119,
    discount: 15,
    createdAt: "2026-11-13T09:50:00.000Z",
  },
  {
    _id: "gym_prod_17",
    id: "gym_prod_17",
    name: "Nature's Nutrition Power Packed Whey Protein 886g - Double Rich Chocolate",
    description:
      "100% Premium Micronized Whey dễ hòa tan, 24g Protein mỗi muỗng giúp phục hồi và xây dựng cơ bắp sau tập.",
    price: 3100,
    originalPrice: 3600,
    priceVnd: 930_000,
    image: "/gym-assets/gym_17.jpg",
    category: "whey-protein",
    unit: "hũ 886g (24 lần dùng)",
    stock: 52,
    isOrganic: false,
    rating: 4.8,
    reviewCount: 95,
    discount: 14,
    createdAt: "2026-11-13T09:45:00.000Z",
  },
  {
    _id: "gym_prod_13",
    id: "gym_prod_13",
    name: "Nutrimuscle Massive Muscle Mass Gainer 1kg - Choco Treat",
    description:
      "Sữa tăng cân tăng cơ hàm lượng cao: 80g Protein, 1365 Calories, 238g Carbs và tích hợp sẵn Creatine Monohydrate.",
    price: 2500,
    originalPrice: 2950,
    priceVnd: 750_000,
    image: "/gym-assets/gym_13.jpg",
    category: "whey-protein",
    unit: "hũ 1kg",
    stock: 40,
    isOrganic: false,
    rating: 4.7,
    reviewCount: 112,
    discount: 15,
    createdAt: "2026-11-13T09:40:00.000Z",
  },
  {
    _id: "gym_prod_18",
    id: "gym_prod_18",
    name: "Nutrición Avanzada Whey Protein 1kg - Túi Chocolate Cao Cấp",
    description:
      "Bột Whey Protein đậm vị Socola đóng túi zip tiện lợi, dễ mang theo phòng tập, bổ sung axit amin thiết yếu mỗi ngày.",
    price: 2400,
    originalPrice: 2800,
    priceVnd: 720_000,
    image: "/gym-assets/gym_18.png",
    category: "whey-protein",
    unit: "túi 1kg",
    stock: 55,
    isOrganic: false,
    rating: 4.7,
    reviewCount: 74,
    discount: 14,
    createdAt: "2026-11-13T09:35:00.000Z",
  },

  // ==================== 2. PRE-WORKOUT & CREATINE (2 SẢN PHẨM) ====================
  {
    _id: "gym_prod_02",
    id: "gym_prod_02",
    name: "Optimum Nutrition Micronised Creatine Powder 317g (93 Servings)",
    description:
      "100% Creatine Monohydrate tinh khiết không mùi (3g/muỗng), tái tạo năng lượng ATP giúp bứt phá sức mạnh và độ dày cơ bắp.",
    price: 2200,
    originalPrice: 2600,
    priceVnd: 660_000,
    image: "/gym-assets/gym_02.jpg",
    category: "pre-workout-creatine",
    unit: "hũ 317g (93 lần dùng)",
    stock: 68,
    isOrganic: false,
    rating: 4.9,
    reviewCount: 286,
    discount: 15,
    createdAt: "2026-11-13T09:30:00.000Z",
  },
  {
    _id: "gym_prod_03",
    id: "gym_prod_03",
    name: "RAW BUM Essential Pre-Workout 405g - Sour Watermelon (30 Servings)",
    description:
      "Công thức Pre-Workout trứ danh từ Chris Bumstead: tăng tập trung cao độ, bơm máu căng cơ và bùng nổ sức bền vị Dưa hấu chua.",
    price: 2800,
    originalPrice: 3300,
    priceVnd: 840_000,
    image: "/gym-assets/gym_03.jpg",
    category: "pre-workout-creatine",
    unit: "hũ 405g (30 lần dùng)",
    stock: 44,
    isOrganic: false,
    rating: 4.9,
    reviewCount: 205,
    discount: 15,
    createdAt: "2026-11-13T09:25:00.000Z",
  },
];

export default gymSupplementProducts;
