import {
  ClockIcon,
  LeafIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "lucide-react";
import { SiFacebook, SiInstagram, SiX } from "@icons-pack/react-simple-icons";
import delivery_truck from "./delivery_truck.svg";
import { gymCategoriesData, gymSupplementProducts } from "./gymSupplementAssets";

export { gymCategoriesData, gymSupplementProducts };

export const assets = {
  delivery_truck,
  hero_bg: "/form-fwd-hero.jpg",
};

export const categoriesData = gymCategoriesData;

export const heroSectionData = {
  description:
    "Kế hoạch tập luyện, dinh dưỡng và sản phẩm hiệu suất được thiết kế riêng để đưa bạn đến phiên bản mạnh mẽ nhất.",
  hero_image: "/form-fwd-hero.jpg",
  hero_features: [
    { icon: TruckIcon, title: "Giao Nhanh 2H", desc: "Miễn phí đơn từ 300.000 ₫" },
    { icon: LeafIcon, title: "100% Chính Hãng", desc: "Nhập khẩu & kiểm định" },
    { icon: ClockIcon, title: "Hiệu Suất Cao", desc: "Tối ưu trước & sau tập" },
    { icon: ShieldCheckIcon, title: "Thanh Toán An Toàn", desc: "Bảo mật QR & OTP 6 số" },
  ],
};

export const footerData = {
  brand: {
    name: "FORM/FWD",
    description:
      "Hiệu Suất • Dinh Dưỡng • Kỷ Luật — Hệ sinh thái Thực phẩm bổ sung & Phụ kiện Gym chuyên nghiệp.",
    socials: [
      { icon: SiFacebook, link: "#" },
      { icon: SiX, link: "#" },
      { icon: SiInstagram, link: "#" },
    ],
  },
  sections: [
    {
      title: "Liên Kết Nhanh",
      links: [
        { label: "Tất cả sản phẩm", to: "/products" },
        { label: "Ưu đãi hiệu suất", to: "/deals" },
        { label: "Theo dõi đơn hàng", to: "/orders" },
      ],
    },
    {
      title: "Hỗ Trợ Khách Hàng",
      links: [
        { label: "Tài khoản của tôi", to: "/addresses" },
        { label: "Lịch sử đơn hàng", to: "/orders" },
        { label: "Quản lý địa chỉ", to: "/addresses" },
      ],
    },
  ],
  contact: [
    { icon: MapPinIcon, text: "TP. Hồ Chí Minh, Việt Nam" },
    { icon: PhoneIcon, text: "1900 6868" },
    { icon: MailIcon, text: "support@formfwd.vn" },
  ],
  bottom: {
    copyright: "© 2026 FORM/FWD. All rights reserved.",
    links: [
      { label: "Chính sách bảo mật", href: "#" },
      { label: "Điều khoản dịch vụ", href: "#" },
    ],
  },
};

export const statusColors: Record<string, string> = {
  Placed: "bg-blue-100 text-blue-700",
  Confirmed: "bg-indigo-100 text-indigo-700",
  Packed: "bg-purple-100 text-purple-700",
  "Out for Delivery": "bg-app-orange/10 text-app-orange",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export const dummyProducts = gymSupplementProducts;

export const dummyCartData = [
  { product: dummyProducts[0], quantity: 1 },
  { product: dummyProducts[7], quantity: 1 },
  { product: dummyProducts[13], quantity: 1 },
];

export const dummyAddressData = [
  {
    label: "Home",
    address: "Khu đô thị Đại học Quốc gia",
    city: "TP. Thủ Đức",
    state: "TP.HCM",
    zip: "700000",
    isDefault: true,
    lat: 10.87,
    lng: 106.8,
    _id: "addr_default_01",
  },
];
