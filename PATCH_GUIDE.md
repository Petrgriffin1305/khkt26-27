# Patch tích hợp mobile và backend

Nguồn đối chiếu: https://github.com/Petrgriffin1305/khkt26-27, branch `main`, commit `04af57e54d2d092bc43741ffbe2878c04b644be8` (04/10/2026).

File phát hành: `patches/khkt-mobile-backend.patch`. Đây là patch đầy đủ từ commit nguồn đến bản đã tích hợp backend/mobile của workspace. Bản tích hợp dùng branch riêng `integrate-mobile-backend`; không sửa branch `main` trên GitHub. Patch không chứa database local, file người dùng upload, `.env`, token hoặc `node_modules`.

## Các thay đổi được gộp

- Giữ icon vector và map ứng dụng của commit `04af57e`; chỉnh icon Spotify thành glyph có trong phiên bản SDK 57, kiểm tra tên icon bằng TypeScript.
- Giữ cảnh báo và mô phỏng sao nhãng; Expo Go chỉ biết người dùng rời app, không biết ứng dụng thật họ mở. Chỉ hiển thị tên app ở sự kiện mô phỏng. Nút mô phỏng chỉ có trong development; không gửi sự kiện mô phỏng lên WebSocket.
- Log gián đoạn, thời gian tạm dừng và trạng thái cảnh báo được lưu trong draft theo tài khoản. Đồng hồ tạm dừng khi cảnh báo hiển thị; thời gian ở màn cảnh báo được loại khỏi thời gian tập trung, kể cả khi app được mở lại. WebSocket là tín hiệu phụ; timer local và phiên đã lưu quyết định kết quả.
- Chức năng quiz và tổng kết trong commit `241724a` được tích hợp bằng luồng API thật hiện có: đáp án/giải thích, chấm điểm server, lưu phiên, lịch sử và khôi phục tiến trình. Không chuyển về dữ liệu quiz mẫu hoặc lịch sử chỉ lưu RAM của upstream.
- Thêm backend, upload, xác thực, persistence, cấu hình local cho Expo Go và CI theo IMPLEMENTATION_CHECKLIST.md.
- Branch `tangkhatnk-patch-1` cũ hơn `main`, có file gốc chứa dấu xung đột `<<<<<<<`; không đưa các file lỗi đó vào patch.

## Áp dụng trên branch mới

Từ repository Git đã clone, lưu file patch ở nơi truy cập được. Dùng đường dẫn tuyệt đối đến patch ở bước dưới:

```bash
git fetch origin
git switch -c integrate-mobile-backend 04af57e54d2d092bc43741ffbe2878c04b644be8
git apply --check /absolute/path/khkt-mobile-backend.patch
git apply /absolute/path/khkt-mobile-backend.patch
npm ci
npm --prefix backend ci
npm --prefix backend run db:generate
npm run lint
npm run typecheck
npm run test:mobile
npm --prefix backend run typecheck
npm --prefix backend test
npm run mobile:local
```

Quét QR bằng Expo Go trên điện thoại cùng Wi-Fi. Xem README.md để cấu hình LAN và các dịch vụ production. Chỉ commit/push branch tích hợp sau khi bạn đã kiểm tra. Nếu remote có thêm commit, vẫn áp dụng patch lên commit gốc nêu trên rồi merge branch mới vào branch bạn muốn; không áp dụng cưỡng ép lên `main` đã thay đổi.

## Giới hạn kiểm chứng

Kiểm tra tự động và bundle không thay thế chạy trên điện thoại thật. AI/OAuth cần credential; chặn ứng dụng ở cấp hệ điều hành cần native implementation ngoài Expo Go. Xem checklist để biết phần chưa hoàn tất.
