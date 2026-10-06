
# 📋 BACKEND TASK SPECIFICATION (CẬP NHẬT GỌN)

**Deadline hoàn thành:** Hết ngày Thứ 3 (06/10/2026)
**Mục tiêu:** Phục vụ kết nối Web App nộp sản phẩm KHKT hạn Thứ 5.

---

## 1. Endpoint Sinh Quiz AI bằng Google Gemini (`/api/quiz/generate`)

* **Mục tiêu:** Nhận tài liệu/chủ đề từ Frontend, gọi Google Gemini API để tự động sinh ra bộ câu hỏi trắc nghiệm chuẩn định dạng JSON.
* **Method & Path:** `POST /api/quiz/generate`
* **Package cần cài:** `@google/generative-ai`

### Request Body (JSON)

```json
{
  "topic": "Định luật Newton",
  "documentText": "Nội dung tài liệu vắn tắt nếu có...",
  "count": 5
}
```


### Yêu cầu kỹ thuật

* Sử dụng Model: `gemini-1.5-flash`.
* Cấu hình `generationConfig` sử dụng `responseMimeType: "application/json"` và định nghĩa `responseSchema` để bắt buộc Gemini trả về đúng cấu trúc Array JSON bên dưới.

### Response Trả Về (JSON)

**JSON**

```
{
  "success": true,
  "data": [
    {
      "id": "q1",
      "question": "Nội dung câu hỏi trắc nghiệm?",
      "options": [
        "A. Lựa chọn 1",
        "B. Lựa chọn 2",
        "C. Lựa chọn 3",
        "D. Lựa chọn 4"
      ],
      "correctAnswerIndex": 0,
      "explanation": "Giải thích ngắn gọn lý do đúng"
    }
  ]
}
```

2. Cập Nhật API Lưu Kết Quả Phiên Học (POST /api/session/save)

Cập nhật Schema/Model để lưu trữ thêm thông tin "Mức độ tự tin" của người dùng đối với từng câu trả lời trong Quiz (Siêu nhận thức - Metacognition).
Request Body (JSON)
JSON

{
  "userId": "123",
  "topic": "Định luật Newton",
  "studyDuration": 1500,      // giây
  "distractionCount": 3,      // số lần rời tab
  "quizAnswers": [
    {
      "questionId": "q1",
      "userAnswerIndex": 0,
      "confidenceLevel": "HIGH" // 'LOW' (Đoán) | 'MEDIUM' (Khá chắc) | 'HIG

### Response Trả Về

**JSON**

```
{
  "success": true,
  "sessionId": "sess_89123",
  "message": "Đã lưu kết quả phiên học thành công."
}
```
