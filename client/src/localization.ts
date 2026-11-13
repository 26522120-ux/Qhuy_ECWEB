import type { Product } from "./types";

export const INR_TO_VND = 300;

const categoryNames: Record<string, string> = {
  // Danh mục Gym & Supplement Fitness (FORM/FWD)
  "whey-protein": "Whey & Protein Tăng Cơ",
  "pre-workout-energy": "Pre-Workout & Tăng Sức Bền",
  "creatine-strength": "Creatine & Sức Mạnh",
  "bcaa-amino-recovery": "BCAA, EAA & Phục Hồi",
  "fat-burner-shred": "Giảm Mỡ & Siết Cơ",
  "vitamins-health": "Vitamin, Dầu Cá & Khớp",
  "healthy-bars-foods": "Bánh Protein & Ăn Kiêng",
  "gym-gear-accessories": "Phụ Kiện & Dụng Cụ Gym",
  // Danh mục hiện hữu
  "fruits-vegetables": "Rau củ quả",
  "personal-care": "Chăm sóc cá nhân",
  "pantry-staples": "Thực phẩm khô",
  bakery: "Bánh mì & bánh ngọt",
  beverages: "Đồ uống",
  "meat-seafood": "Thịt & hải sản",
  snacks: "Đồ ăn vặt",
  "frozen-foods": "Thực phẩm đông lạnh",
  "baby-care": "Chăm sóc em bé",
  "dairy-eggs": "Sữa & trứng",
};

const productNames: Record<string, string> = {
  "Butter Croissant 100g": "Bánh sừng bò bơ 100g",
  "Organic Quinoa 500g": "Hạt diêm mạch hữu cơ 500g",
  "Brown Bread 400g": "Bánh mì nâu 400g",
  "Barley 1kg": "Đại mạch 1kg",
  "Knorr Cup Soup 70g": "Súp ăn liền Knorr 70g",
  "Maggi Noodles 280g": "Mì ăn liền Maggi 280g",
  "Sprite 1.5L": "Nước ngọt Sprite 1,5L",
  "Carrot 500g": "Cà rốt 500g",
  "Coca-Cola 1.5L": "Nước ngọt Coca-Cola 1,5L",
  "Brown Rice 1kg": "Gạo lứt 1kg",
  "Eggs 12 pcs": "Trứng gà 12 quả",
  "Banana 1 kg": "Chuối 1kg",
  "Basmati Rice 5kg": "Gạo Basmati 5kg",
  "Onion 500g": "Hành tây 500g",
  "7 Up 1.5L": "Nước ngọt 7 Up 1,5L",
  "Spinach 500g": "Rau bina 500g",
  "Orange 1 kg": "Cam 1kg",
  "Wheat Flour 5kg": "Bột mì 5kg",
  "Grapes 500g": "Nho 500g",
  "Fanta 1.5L": "Nước ngọt Fanta 1,5L",
  "Paneer 200g": "Phô mai tươi Paneer 200g",
  "Mango 1 kg": "Xoài 1kg",
  "Tomato 1 kg": "Cà chua 1kg",
  "Potato 500g": "Khoai tây 500g",
  "Cheese 200g": "Phô mai 200g",
  "Amul Milk 1L": "Sữa tươi Amul 1L",
  "Apple 1 kg": "Táo 1kg",
};

const productDescriptions: Record<string, string> = {
  "Butter Croissant 100g": "Bánh sừng bò thơm bơ, nhiều lớp giòn xốp.",
  "Organic Quinoa 500g": "Giàu protein, không chứa gluten, phù hợp cho bữa ăn lành mạnh.",
  "Brown Bread 400g": "Bánh mì mềm, bổ dưỡng, thích hợp cho bữa sáng.",
  "Barley 1kg": "Giàu chất xơ, hỗ trợ tiêu hóa.",
  "Knorr Cup Soup 70g": "Súp ăn liền tiện lợi, thơm ngon.",
  "Maggi Noodles 280g": "Mì ăn liền dễ chế biến, phù hợp cho bữa ăn nhanh.",
  "Sprite 1.5L": "Nước ngọt vị chanh mát lạnh, sảng khoái.",
  "Carrot 500g": "Cà rốt tươi, giòn ngọt, thích hợp làm nước ép và salad.",
  "Coca-Cola 1.5L": "Nước ngọt có ga, ngon hơn khi uống lạnh.",
  "Brown Rice 1kg": "Gạo lứt nguyên cám, giàu dinh dưỡng.",
  "Eggs 12 pcs": "Trứng gà tươi từ nông trại, giàu protein.",
  "Banana 1 kg": "Chuối chín ngọt, giàu kali, thích hợp ăn nhẹ và làm sinh tố.",
  "Basmati Rice 5kg": "Gạo hạt dài thơm đặc trưng, thích hợp nấu cơm và món biryani.",
  "Onion 500g": "Hành tây tươi, thơm, là nguyên liệu quen thuộc trong căn bếp.",
  "7 Up 1.5L": "Nước ngọt có ga vị chanh tươi mát.",
  "Spinach 500g": "Rau bina giàu sắt và vitamin, ngon khi nấu súp hoặc trộn salad.",
  "Orange 1 kg": "Cam mọng nước, vị ngọt thanh, giàu vitamin C.",
  "Wheat Flour 5kg": "Bột mì giàu dinh dưỡng, thích hợp làm bánh và chế biến món ăn.",
  "Grapes 500g": "Nho tươi mọng nước, giàu chất chống oxy hóa.",
  "Fanta 1.5L": "Nước ngọt có ga vị trái cây thơm ngon.",
  "Paneer 200g": "Phô mai tươi mềm, giàu protein, phù hợp với nhiều món ăn.",
  "Mango 1 kg": "Xoài thơm ngọt, giàu vitamin A, ngon khi ăn trực tiếp hoặc làm sinh tố.",
  "Tomato 1 kg": "Cà chua tươi mọng nước, thích hợp làm salad và nước sốt.",
  "Potato 500g": "Khoai tây tươi, giàu tinh bột, thích hợp chế biến nhiều món.",
  "Cheese 200g": "Phô mai béo thơm, thích hợp làm pizza và sandwich.",
  "Amul Milk 1L": "Sữa tươi giàu canxi, thơm ngon mỗi ngày.",
  "Apple 1 kg": "Táo tươi giàu chất xơ, góp phần bổ sung dinh dưỡng hằng ngày.",
};

export const getCategoryNameVi = (slug: string) => categoryNames[slug] ?? slug;

export const getProductNameVi = (product: Product) =>
  productNames[product.name] ?? product.name;

export const getProductDescriptionVi = (product: Product) =>
  productDescriptions[product.name] ?? product.description;

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
