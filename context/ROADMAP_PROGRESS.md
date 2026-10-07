# Tiến độ Roadmap PROCESS_SPEC 1.4

Ngày cập nhật: 07/10/2026. Theo lựa chọn người dùng trong chat: SDK `@google/genai`, model mặc định `gemini-3.8-flash`. Blueprint legacy trong PROCESS_SPEC giữ để đối chiếu; source dùng lựa chọn đã duyệt, không gọi `gemini-1.5-flash`.

1. SDK/model đã chốt. Desktop MVP có UI Focus local riêng, không đóng gói toàn bộ Expo app.
2. Đã thêm Gemini request/output validation, structured-output adapter, timeout/error handling và tests mock.
3. Đã thêm POST `/api/v1/quiz/generate`, lookup topic, transaction lưu private questions, UUID DB, tests API/chấm điểm/ownership. Route OpenAI cũ giữ nguyên.
4. Đã nối frontend Gemini qua DTO adapter, nhập/paste documentText, confidence Low/Medium/High trước commit/reveal, persist và migration draft cũ. Confidence hiện lưu local như MVP; chưa dùng cho export research server.
5. Đã tạo package desktop riêng, Windows Guard với platform guard, executable allowlist, execFile không shell, chống scan chồng, abort/drain và mocked tests.
6. Đã nối Electron main/preload/renderer với Focus controller, IPC sender validation, start/pause/resume/stop/deadline, cleanup khi đóng/crash/quit. Kiểm thử Windows thật còn chờ máy/VM Windows.
7. Kiểm tra đạt: lint mobile, typecheck mobile/backend/desktop, build backend/desktop; 63 tests backend/state, 9 tests desktop và 5 tests focusClock. Backend env hiện chưa cấu hình GEMINI_API_KEY; live Gemini và thử Guard trên Windows thật còn chưa xác minh. Tests Guard dùng runner giả lập, không kill ứng dụng thật.

## Cách thử Gemini

Đặt `GEMINI_API_KEY` trong `backend/.env` (không commit key). `GEMINI_MODEL=gemini-3.8-flash` là mặc định. Khởi động backend theo luồng local hiện tại, đăng nhập app, nhập chủ đề/văn bản ở bước mục tiêu. Hoàn thành Focus → chọn “Tạo quiz với Gemini” trước khi commit đáp án. Chọn option → Low/Medium/High → xác nhận → xem giải thích → đồng bộ sang tổng kết.

Chỉ nhập chủ đề cũng hợp lệ. Văn bản có 10–50.000 ký tự nếu có; frontend không OCR/parse PDF. Nút AI tài liệu OpenAI cũ vẫn là luồng riêng cho uploaded files. Generate không tự retry để tránh tạo nhiều bộ câu hỏi/chi phí; nút bị khóa khi request chạy.

## Phạm vi chưa thuộc Roadmap 1.4

SessionSurvey, admin CSV và confidence persisted server ở Phần 3 là hạng mục backend bổ sung; chưa triển khai trong 7 bước core này. Schema strict survey yêu cầu AI helpfulness dù phiên Stop chưa có AI quiz vẫn cần quyết định applicability/nullable trước khi nối trigger cho mọi phiên. Không báo đã hoàn thành survey/export.
