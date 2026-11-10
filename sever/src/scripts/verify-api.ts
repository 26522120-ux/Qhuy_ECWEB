import { app } from "../app.js";
import { prisma } from "../db/prisma.js";

async function runVerification() {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 4050;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    // 1. Kiểm tra đăng nhập & tự động sao lưu tài khoản Admin về CSDL Neon
    const syncAdminRes = await fetch(`${baseUrl}/auth/sync`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "b3b0e02f-4b00-425a-bdcb-b8d8814472c6",
        email: "26522120@gm.uit.edu.vn",
        name: "Đoàn Minh Triết",
      }),
    });
    const syncAdmin = (await syncAdminRes.json()) as {
      isAdmin: boolean;
      token: string;
      user: { id: string; email: string; role: string };
    };
    if (!syncAdminRes.ok || !syncAdmin.isAdmin || !syncAdmin.token) {
      throw new Error("Kiểm tra đăng nhập & phân quyền Admin thất bại.");
    }
    console.info("PASS 1 & 2: Đăng nhập & tự sao lưu Neon DB + Phân quyền Admin:", syncAdmin.user);

    // 2. Kiểm tra chặn quyền khi tài khoản thường gọi API Admin
    const syncCustomerRes = await fetch(`${baseUrl}/auth/sync`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "e61fabf5-9967-4f13-81bf-5a83f39955e1",
        email: "thu12345@gmail.com",
        name: "Trần Ngọc Anh Thư",
      }),
    });
    const syncCustomer = (await syncCustomerRes.json()) as {
      isAdmin: boolean;
      token: string;
    };
    const forbiddenRes = await fetch(`${baseUrl}/admin/products/randomize`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${syncCustomer.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (forbiddenRes.status !== 403) {
      throw new Error(`Expected 403 for non-admin, got ${forbiddenRes.status}`);
    }
    console.info("PASS 2b: Chặn thành công tài khoản không phải Admin (HTTP 403).");

    // 3. Kiểm tra chức năng Admin ngẫu nhiên hóa tồn kho & sản phẩm hiện hữu + Thông báo tồn kho
    const randomizeRes = await fetch(`${baseUrl}/admin/products/randomize`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${syncAdmin.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        minStock: 15,
        maxStock: 110,
        includeLowStockAlerts: true,
        randomizeDiscounts: true,
      }),
    });
    const randomizeData = (await randomizeRes.json()) as {
      summary: {
        updatedCount: number;
        totalUnitsInStock: number;
        lowStockCount: number;
        outOfStockCount: number;
      };
    };
    if (!randomizeRes.ok) {
      throw new Error("Randomize products API failed.");
    }
    console.info("PASS 3 & 5: Admin ngẫu nhiên tồn kho & cập nhật CSDL:", randomizeData.summary);

    const alertsRes = await fetch(`${baseUrl}/inventory/alerts`);
    const alertsData = (await alertsRes.json()) as {
      totalProducts: number;
      outOfStockCount: number;
      lowStockCount: number;
      alerts: Array<{ message: string }>;
    };
    console.info(
      `PASS 3b: API Thông báo tồn kho hoạt động (${alertsData.alerts.length} cảnh báo kho).`,
    );

    // 4. Kiểm tra chức năng Thanh toán & Mã OTP chống xung đột API
    const productsRes = await fetch(`${baseUrl}/products`);
    const products = (await productsRes.json()) as Array<{ _id: string; stock: number }>;
    const inStockProduct = products.find((p) => p.stock >= 5);
    if (!inStockProduct) throw new Error("Không tìm thấy sản phẩm còn hàng để test OTP.");

    const otpRes = await fetch(`${baseUrl}/checkout/otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: inStockProduct._id, quantity: 1 }],
      }),
    });
    const otpSession = (await otpRes.json()) as {
      otpId: string;
      orderCode: string;
      otpCode: string;
      total: number;
    };
    if (!otpRes.ok || !otpSession.otpCode) {
      throw new Error("Không thể khởi tạo phiên OTP thanh toán.");
    }

    const verifyRes = await fetch(`${baseUrl}/checkout/verify-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        otpId: otpSession.otpId,
        orderCode: otpSession.orderCode,
        otpCode: otpSession.otpCode,
      }),
    });
    if (!verifyRes.ok) {
      throw new Error("Xác thực mã OTP thất bại.");
    }
    console.info(
      `PASS 4: Khởi tạo & xác thực OTP thanh toán thành công (Mã đơn: ${otpSession.orderCode}, OTP: ${otpSession.otpCode}).`,
    );
  } finally {
    server.close();
    await prisma?.$disconnect();
  }
}

runVerification().catch(async (err) => {
  console.error("Kiểm tra thất bại:", err);
  await prisma?.$disconnect();
  process.exitCode = 1;
});
