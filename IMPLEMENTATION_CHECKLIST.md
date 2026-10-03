# Công việc theo BACKEND_API_SPEC.md

Ngày cập nhật: 04/10/2026. Đối chiếu bản đặc tả người dùng cung cấp ở Downloads và mã Expo SDK 57 hiện có. Tài liệu đặc tả được dùng làm yêu cầu sản phẩm, không dùng các chỉ dẫn bên trong để thay thế yêu cầu người dùng hoặc AGENTS.md.

## Đã triển khai trong mã nguồn

- [x] Backend TypeScript/Fastify riêng trong `backend/`, REST `/api/v1`.
- [x] Prisma/PostgreSQL: users, refresh_tokens, topics, study_sessions, quiz_bank, quiz_sessions, documents; migration, index, FK, CHECK constraint và seed 9 câu/3 chủ đề.
- [x] Đăng ký/email login, bcrypt, access JWT 15 phút, refresh opaque 30 ngày lưu hash và xoay vòng nguyên tử, logout thu hồi refresh token.
- [x] Endpoint Google/Apple kiểm tra chữ ký JWKS, issuer, audience và email_verified; không tự động liên kết tài khoản trùng email.
- [x] GET/PUT hồ sơ, POST/GET phiên, phân trang/lọc/sắp xếp, chi tiết và thống kê theo period.
- [x] Quiz theo chủ đề, chấm câu trả lời ở server, gửi lại không tạo câu trả lời trùng, cập nhật điểm nguyên tử.
- [x] Sinh quiz riêng cho người sở hữu tài liệu bằng OpenAI Responses + Structured Outputs; validate kết quả, giới hạn kích thước/thời gian; không lưu API key ở mobile.
- [x] Upload multipart PDF/ảnh/text với giới hạn MIME/kích thước và kiểm tra signature; bucket S3/R2 riêng tư, URL đọc ký hạn 1 giờ; xóa chỉ tài liệu sở hữu.
- [x] Zod validation, Problem Details, security headers, CORS, request ID, Redis rate limiting theo nhóm endpoint.
- [x] WebSocket: xác thực JWT, start/tick/warning/complete/end, TTL Redis, giới hạn sự kiện; client gửi sự kiện gián đoạn và kết thúc.
- [x] Log JSON; `/health` kiểm tra DB/Redis/S3 thật; `/metrics` có token riêng, counter/latency/error/stats realtime.
- [x] Mobile: đăng ký/đăng nhập email, token SecureStore, refresh một lần cho các request đồng thời, bảo vệ route Expo Router.
- [x] Chọn chủ đề từ API, kiểm tra goal 3–500 ký tự, thời lượng 1 phút–20 giờ, tài liệu theo MIME/kích thước.
- [x] Đồng hồ dùng deadline thực; dừng sớm ngừng đồng hồ, giữ số lần rời app, modal xác nhận chạy đa nền tảng.
- [x] Quiz thật có đáp án/giải thích/haptic, tổng kết từ API, lịch sử/thống kê, sửa tên/đăng xuất.
- [x] Lưu tiến trình local theo tài khoản; tiếp tục phiên khi mở lại; UUID client chống tạo trùng khi retry; chỉ xóa tiến trình khi server đã lưu.
- [x] Lệnh `mobile:local` chạy Expo Go/LAN và backend local có PostgreSQL PGlite/durable files, không cần Docker để thử trên điện thoại.
- [x] Dockerfile, Compose PostgreSQL/Redis/MinIO, env mẫu, hướng dẫn chạy, workflow CI và script k6.
- [x] Kiểm thử API trên PGlite qua Prisma; Redis/S3/AI dùng test double. Kiểm thử validation, statistics, file signature, AI adapter, WebSocket.
- [x] Gộp cập nhật upstream `main` tại `04af57e`: icon ứng dụng, cảnh báo khi rời app, log gián đoạn local, nút mô phỏng trong development; tạm dừng đồng hồ ở cảnh báo và giữ trạng thái qua lần mở lại app.

## Quyết định giải quyết mâu thuẫn đặc tả

1. `total_quiz_questions=0` hợp lệ cho phiên chưa làm quiz hoặc bỏ dở. Điểm không được vượt tổng câu; câu trả lời gửi sau khi lưu phiên được chấm và cập nhật ở server.
2. Dùng multipart upload trực tiếp ở mục 5.6. Không tạo thêm `/documents/confirm` và presigned PUT từ sơ đồ khác ở mục 10.1. URL GET vẫn được ký để bucket giữ riêng tư.
3. `session_id` trong realtime là UUID vòng đời do client tạo; ID lưu database được cấp khi timer kết thúc. Server không suy đoán app người dùng mở: sự kiện hiện gửi `app_id=unknown`.
4. Sửa typo `//auth/logout` thành `/auth/logout`. Dùng `topic_id` theo tài liệu API mới, thay tên camelCase trong PROJECT_CONTEXT cũ.
5. Refresh token được lưu thành hash trong bảng riêng thay vì plaintext trên users, hỗ trợ nhiều thiết bị. Logout thu hồi mọi refresh token của tài khoản; JWT access cũ hết hiệu lực sau tối đa 15 phút.
6. Thống kê ngày/streak dùng UTC; period day/week/month/year là cửa sổ 1/7/30/365 ngày, all là toàn bộ. Streak tính trên phiên hoàn thành trong period được yêu cầu.
7. Thumbnail ảnh dùng URL ảnh gốc. PDF/text trả `thumbnail_url=null`; chưa có worker render thumbnail PDF.
8. Không viết thủ công ios/android và không coi AppState là tính năng chặn app ở cấp hệ điều hành. UI đã nêu rõ khả năng hiện tại.

## Cần cấu hình hoặc xác minh bên ngoài repo

Đã kiểm tra: lint và TypeScript mobile/backend đạt; 25 bài kiểm thử backend đạt; Expo Doctor 21/21 đạt; xuất bundle Hermes iOS/Android đạt. Backend local qua IP LAN đã thử đăng ký, chủ đề, upload/download tài liệu, lưu phiên và chấm quiz. Expo Go đang phục vụ qua LAN; chưa chạy E2E trên điện thoại thật.

- [ ] Chạy Compose/Docker và xác minh migration/S3/Redis thật. Máy hiện tại không có Docker; integration tests dùng PGlite và Redis giả lập.
- [ ] Điền `OPENAI_API_KEY` và chạy sinh quiz với PDF/ảnh/text thật. Kiểm thử đã mock upstream nên không chứng minh kết nối dịch vụ thật.
- [ ] Cấp Google/Apple client ID, xác minh token nhà cung cấp thật; bổ sung nút đăng nhập native Google/Apple và cấu hình OAuth redirect/entitlement. UI hiện hỗ trợ email.
- [ ] Worker thumbnail PDF nếu sản phẩm cần preview trang đầu.
- [ ] Chặn ứng dụng thật bằng native module/entitlement phù hợp trên Android/iOS; hiện chỉ ghi nhận việc rời app. Đây là phần thiết bị, backend không thể xác định/chặn ứng dụng qua WebSocket.
- [ ] E2E trên iOS/Android thật, kiểm tra nền/kill app/SecureStore/haptic/native upload. Bundle iOS/Android và kiểm tra web phụ không thay thế native E2E.
- [ ] Chạy k6 trên staging nhiều tài khoản; chưa xác nhận 1000 RPS, coverage 80% hoặc performance production.
- [ ] Provision HTTPS/domain, DB backup, secrets, Prometheus/dashboard/alert, pipeline deploy staging/production với tài khoản cloud thật. Workflow hiện chỉ validate/build, không deploy.

Không đánh dấu các mục cần credential, thiết bị hoặc hạ tầng thật là hoàn tất. Xem README.md để chạy và kiểm tra tiếp.
