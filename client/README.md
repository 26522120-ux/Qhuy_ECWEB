# InstantMart client

## Chạy giao diện và API local

1. Chạy backend ở thư mục `sever` theo hướng dẫn trong [README backend](../sever/README.md).
2. Tạo `client/.env.local` từ `.env.example` và đặt `VITE_NEON_AUTH_URL` bằng URL Neon Auth của cùng branch với backend (`NEON_AUTH_BASE_URL`).
3. Chạy client:

```powershell
npm install
npm run dev
```

Trong môi trường phát triển, Vite chuyển tiếp `/api` đến `http://localhost:4000`. Khi triển khai, đặt `VITE_API_URL` thành URL API đầy đủ, kết thúc bằng `/api`.

Không đưa `DATABASE_URL`, `NEON_AUTH_JWKS_URL`, `ADMIN_AUTH_SUBJECT` hoặc các credential server khác vào biến `VITE_*`.
