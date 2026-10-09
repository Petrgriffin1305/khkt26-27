# Viễn Du

Ứng dụng học tập bằng hành trình tàu: web và Windows dùng chung giao diện Expo, có phiên học 1–240 phút, khám phá qua sương mù, toa cá nhân, đoàn bất đồng bộ, nhật ký và quiz tùy chọn. Màn hình native của dự án Expo được giữ riêng.

## Chạy thử

Dùng Node.js 24 LTS và npm 11, cùng phiên bản chính với GitHub Actions. npm 10 đi kèm Node 22 có thể từ chối lockfile khi giải quyết peer dependency.

```bash
npm ci
npm --prefix backend ci
npm --prefix backend run db:generate
npm --prefix backend run dev:local
```

Ở terminal khác:

```bash
npm run web
```

Chế độ khách dùng được khi offline. Tạo tài khoản trên backend local để thử đồng bộ, đoàn và quiz ngân hàng. Muốn tạo quiz AI từ tài liệu, đặt `GEMINI_API_KEY` trong `backend/.env`, rồi khởi động lại backend; khóa chỉ dùng trên máy chủ và không đưa vào Git. Tài liệu được đọc trên thiết bị; chỉ văn bản trích xuất được gửi khi chọn quiz AI.

## Xuất bản web và Windows

```bash
npm run build:web
npm --prefix desktop ci
npm --prefix desktop run package:win
```

Web nằm trong `dist/`, installer nằm trong `desktop/release/`. Cấu hình `EXPO_PUBLIC_API_URL` trước khi build bản kết nối máy chủ online. GitHub Actions tạo cả EXE và ZIP web khi push `main`; tải tại artifact `Vien-Du-Windows` của workflow **Build Windows app**.

Xem [hướng dẫn vận hành và phạm vi MVP](docs/WEB_DESKTOP.md) để triển khai backend, dùng production export hoặc đóng gói chéo từ macOS.
