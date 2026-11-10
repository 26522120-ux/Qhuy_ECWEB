# InstantMart backend

Backend khởi tạo bằng Express, TypeScript, PostgreSQL và Prisma. Tiền được lưu theo đơn vị đồng (VND).
Neon CLI lưu thông tin kết nối local trong `.env.local`; file này được nạp khi chạy backend và đã được ignore.

## Yêu cầu

- Node.js 20.19+ (khuyến nghị Node.js 22+)
- Neon CLI đã đăng nhập bằng `neon login`

## Cài đặt và chạy

```powershell
npm install
```

Các biến Neon được quản lý trong `.env.local` (không commit file này). Để làm mới chúng:

```powershell
neon env pull
npm run build
npm run neon:check
npm run dev
```

Máy chủ HTTP chạy tại `http://localhost:4000`. Khi không dùng Neon, có thể tạo `.env` từ `.env.example` và cung cấp một PostgreSQL `DATABASE_URL`.

## Neon services

Project được liên kết với branch `production`; `neon.ts` khai báo Auth, AI Gateway,
Functions, Object Storage và Realtime cho preview branches. Realtime đã được bật
riêng trên branch production cho hai origin local (`localhost:5173` và
`127.0.0.1:5173`). Không đưa các credential `NEON_*`, `AWS_*` hoặc
`DATABASE_URL` vào frontend.

Chạy kiểm tra kết nối dịch vụ:

```powershell
npm run neon:check
```

## Lệnh thường dùng

```powershell
npm run build
npm start
npm run db:deploy
npm run db:studio
```

## API hiện có

- `GET /` — thông tin API
- `GET /api/health` — kiểm tra kết nối database
- `GET /api/products?q=&category=` — danh sách/tìm kiếm sản phẩm
- `GET /api/settings/tax` — thuế hiện tại
- `POST /api/orders` — tạo đơn hàng (khách)
- `GET /api/auth/me` — thông tin phiên đăng nhập
- `GET /api/admin/products`, `POST /api/admin/products`, `PUT /api/admin/products/:id` — quản lý sản phẩm
- `GET /api/admin/orders`, `PATCH /api/admin/orders/:id` — quản lý đơn hàng
- `PATCH /api/admin/settings/tax` — cập nhật thuế

Các API quản trị xác thực JWT Neon ở backend và yêu cầu `ADMIN_AUTH_SUBJECT` khớp subject của tài khoản admin. Cấu hình `NEON_AUTH_BASE_URL` và `NEON_AUTH_JWKS_URL` để bật xác thực; không gửi role admin từ client.

Client mặc định gọi `/api`; cấu hình Vite chuyển tiếp endpoint này đến backend local ở cổng 4000. Client cần `VITE_NEON_AUTH_URL` trỏ đến URL Auth của cùng branch. URL này là cấu hình công khai cho trình duyệt; không đưa `DATABASE_URL`, JWKS hay credential server vào client.
