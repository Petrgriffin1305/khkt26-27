# Viễn Du Desktop

Ứng dụng chính dùng chung web app 3D với bản trình duyệt. Xem [hướng dẫn web/Windows](../docs/WEB_DESKTOP.md).

```bash
npm run build:web
npm --prefix desktop ci
npm --prefix desktop start
npm --prefix desktop run package:win
```

## Guard thử nghiệm cũ

# PomoFocus Desktop MVP

Package Electron riêng, không thuộc Expo bundle. Chạy trên Windows để đồng hồ Focus đóng các executable đã chọn; Linux/macOS vẫn chạy đồng hồ nhưng Guard trả `unsupported`.

```bash
npm --prefix desktop ci
npm --prefix desktop run typecheck
npm --prefix desktop test
npm --prefix desktop run start:guard
```

Đóng ứng dụng bằng `taskkill /F /IM` có thể mất dữ liệu chưa lưu. Giao diện bắt buộc xác nhận trước khi bắt đầu. Guard chỉ nhận discord.exe/chrome.exe/steam.exe, quét ngay và mỗi 3 giây; không ngăn khởi chạy tức thời, không tự nâng quyền admin. Một image name có thể gồm nhiều process. UI hiển thị lỗi nếu không quét/đóng được.

Pause dừng đồng hồ nhưng Guard tiếp tục. Kết thúc, hết giờ, renderer crash hoặc thoát app đều stop/drain Guard. Nếu hệ thống ngủ qua deadline, Guard kiểm tra trạng thái Focus trước khi kill tiếp. Không chạy nền sau khi app thoát hoặc tự phục hồi phiên.

Test dùng process runner giả lập: không kill ứng dụng thật. Giao diện desktop hiện là Focus controller local, chưa có đăng nhập/quiz/session sync với backend hoặc survey. Không hiểu việc chạy desktop là chặn ứng dụng trên điện thoại. Trên Windows, lưu công việc rồi tự thử Start → Pause → Resume → Stop và Start → hết giờ; kiểm tra app được chọn có thể mở lại sau Stop.
