# Sketch Report — Self-Study Support Application

## 1. Problem

Trong quá trình tự học, nhiều học sinh thường bị xao nhãng bởi các ứng dụng mạng xã hội, các thông báo từ nhiều nền tảng như mạng xã hội, mua sắm v.v, từ đó làm ảnh hưởng đến tiến độ và kết quả học tập.

Bên cạnh đó, việc một học sinh dành một khoảng thời gian nhất định cho việc học không đồng nghĩa với việc học sinh đó thực sự tập trung hoặc đạt được kết quả học tập tương ứng. Vì vậy, cần có một giải pháp không chỉ hỗ trợ học sinh duy trì một khoảng thời gian học tập có cấu trúc, mà còn hạn chế các tác nhân gây xao nhãng và đánh giá kết quả học tập sau phiên học.

---

## 2. Research Question

Liệu việc kết hợp phiên học có giới hạn thời gian, cơ chế kiểm soát xao nhãng và bài kiểm tra truy hồi kiến thức có cải thiện hiệu quả tự học của học sinh so với việc chỉ sử dụng phiên học có giới hạn thời gian hay không?

---

## 3. Hypothesis

Học sinh sử dụng hệ thống hỗ trợ tự học đề xuất, kết hợp phiên học có giới hạn thời gian, cơ chế kiểm soát xao nhãng và bài kiểm tra truy hồi kiến thức, sẽ đạt kết quả tự học tốt hơn so với học sinh chỉ sử dụng phiên học có giới hạn thời gian.

Trong nghiên cứu này, "kết quả tự học" được đánh giá thông qua:

- Tỷ lệ hoàn thành mục tiêu học tập.
- Số lần xảy ra hoặc cố gắng xảy ra hành vi xao nhãng.
- Điểm đánh giá kiến thức sau phiên học.

---

## 4. Objectives

Dự án hướng tới các mục tiêu sau:

1. Xây dựng một ứng dụng di động hỗ trợ học sinh thực hiện các phiên tự học có mục tiêu và thời lượng xác định.
2. Triển khai cơ chế hạn chế hoặc giám sát các ứng dụng/tác nhân gây xao nhãng trong quá trình học tập.
3. Triển khai một bài kiểm tra ngắn sau phiên học nhằm đánh giá khả năng truy hồi và vận dụng kiến thức liên quan đến nội dung học.
4. Thu thập các dữ liệu liên quan đến phiên học và sử dụng chúng để đánh giá hiệu quả của hệ thống.
5. So sánh kết quả của phiên học sử dụng hệ thống đề xuất với phiên học có giới hạn thời gian nhưng không sử dụng các cơ chế bổ sung.

---

## 5. Background / Rationale

Khi tự học trên thiết bị di động, học sinh có thể thường xuyên bị xao nhãng bởi mạng xã hội, trò chơi, thông báo, ứng dụng mua sắm và các nền tảng khác. Một buổi học được tổ chức bài bản với thời lượng xác định sẽ mang lại cho học sinh khoảng thời gian rõ ràng, chuyên biệt để đạt được một mục tiêu học tập cụ thể.

Tuy nhiên, chỉ hoàn thành một phiên học có giới hạn thời gian không đảm bảo rằng học sinh đã thực sự tiếp thu nội dung. Vì vậy, hệ thống đề xuất kết hợp ba thành phần:

1. **Timed Focus Session:** tạo một khoảng thời gian học tập có cấu trúc.
2. **Distraction Control:** giảm hoặc ghi nhận các yếu tố gây xao nhãng trong phiên học.
3. **Post-study Retrieval Practice:** yêu cầu học sinh chủ động truy hồi kiến thức thông qua một bài kiểm tra ngắn sau phiên học.

Sự kết hợp này tạo thành một vòng lặp:

**Goal Setting → Timed Focus → Distraction Control → Retrieval Practice → Session Evaluation**

Mục tiêu của hệ thống không phải là xác minh tuyệt đối rằng học sinh đã học trong toàn bộ phiên, mà là tạo ra một môi trường học tập có kiểm soát và sử dụng các chỉ số có thể đo được để đánh giá kết quả của phiên học.

---

## 6. Methodology

### 6.1. Overall Method

Phương pháp của hệ thống gồm:

**Timed Focus Session + Distraction Restriction/Monitoring + Post-study Retrieval Practice**

Trong đó:

- **Timed Focus Session** được lấy cảm hứng từ mô hình Pomodoro, sử dụng một phiên học có thời lượng xác định.
- **Distraction Control** nhằm hạn chế hoặc giám sát việc truy cập các ứng dụng gây xao nhãng trong phiên học.
- **Post-study Retrieval Practice** cung cấp một bài kiểm tra ngắn sau phiên học để đánh giá kết quả học tập.

### 6.2. Điều kiện đối chứng

Trong điều kiện đối chứng, học sinh thực hiện một phiên học có giới hạn thời gian bằng bộ đếm thời gian theo mô hình lấy cảm hứng từ Pomodoro. Trong phiên học này, hệ thống không áp dụng cơ chế kiểm soát xao nhãng và không sử dụng bài kiểm tra truy hồi kiến thức như một phần của can thiệp.

Sau khi kết thúc phiên học, học sinh vẫn thực hiện **cùng một bài đánh giá kiến thức chuẩn hóa** với nhóm/điều kiện thực nghiệm. Kết quả của bài đánh giá này được sử dụng để so sánh với điều kiện thực nghiệm.

Mục đích của điều kiện đối chứng là tạo ra một mốc tham chiếu, giúp xác định liệu việc bổ sung cơ chế kiểm soát xao nhãng và bài kiểm tra truy hồi kiến thức có tạo ra sự khác biệt về kết quả tự học hay không.

### 6.3. Experimental Condition

Học sinh thực hiện một phiên học có giới hạn thời gian, đồng thời sử dụng:

- Distraction Control.
- Post-study Retrieval Practice.

### 6.4. Experimental Procedure

Một phiên thực nghiệm cơ bản được thực hiện theo trình tự:

1. Học sinh xác định mục tiêu học tập, chủ đề/nội dung học và thời lượng phiên học.
2. Học sinh bắt đầu phiên học.
3. Hệ thống duy trì phiên học có giới hạn thời gian.
4. Trong phiên học, hệ thống hạn chế hoặc ghi nhận các hành vi sử dụng ứng dụng gây xao nhãng trong phạm vi khả năng của hệ điều hành Android.
5. Khi phiên học kết thúc, học sinh thực hiện một bài kiểm tra ngắn liên quan đến nội dung học.
6. Hệ thống ghi nhận các chỉ số của phiên học.
7. Kết quả giữa control condition và experimental condition được so sánh.

### 6.5. Important Measurement Principle

Hệ thống không thể trực tiếp xác minh tuyệt đối rằng học sinh đã học liên tục trong toàn bộ phiên. Vì vậy, nhóm sử dụng các chỉ số quan sát được như distraction frequency, task completion và knowledge assessment score làm các chỉ báo (measurable indicators) cho kết quả của phiên học.

---

## 7. Variables & Metrics

### 7.1. Independent Variable

**Study Condition**

- **Control:** Timed Study Only.
- **Experimental:** Timed Study + Distraction Control + Retrieval Practice.

### 7.2. Dependent Variables

#### 1. Task Completion Rate

Tỷ lệ mục tiêu học tập mà học sinh hoàn thành trong phiên.

Ví dụ:

> Mục tiêu: hoàn thành 10 bài tập
> Hoàn thành: 8 bài
> Task Completion Rate = 80%

#### 2. Distraction Frequency

Số lần phát hiện hoặc ghi nhận hành vi/cố gắng truy cập các ứng dụng hoặc tác nhân gây xao nhãng trong phiên học.

#### 3. Knowledge Assessment Score

Điểm của học sinh trong bài đánh giá kiến thức sau phiên học.

### 7.3. Optional Secondary Metrics

Nếu thời gian và điều kiện thực nghiệm cho phép, nhóm có thể thu thêm:

- Mức độ hài lòng của người dùng.
- Mức độ cảm nhận về sự tập trung.
- Thời gian cần để hoàn thành nhiệm vụ.
- Điểm kiểm tra lại sau một khoảng thời gian (delayed assessment) để khảo sát khả năng ghi nhớ.

Các chỉ số phụ không bắt buộc đối với MVP.

---

## 8. Proposed System / Architecture

Hệ thống gồm các thành phần chính:

```text
User
  │
  ▼
Study Goal Setup
  ├── Goal
  ├── Topic / Learning Content
  └── Duration
  │
  ▼
Focus Session
  ├── Timer
  └── Distraction Control
  │
  ▼
Session Ends
  │
  ▼
Post-study Quiz
  │
  ▼
Session Evaluation
  ├── Study Duration
  ├── Distraction Events
  ├── Task Completion
  └── Knowledge Assessment Score
  │
  ▼
Study History / Data Logging
```

### Proposed System Flow

**Set Goal → Start Focus Session → Control/Monitor Distraction → Complete Study Session → Post-study Quiz → Evaluate Session → Store Results**

---

## 9. MVP Features

| # | Feature                                | MVP cần làm gì?                                                                     |
| - | -------------------------------------- | -------------------------------------------------------------------------------------- |
| 1 | **Study Goal Setup**             | User nhập mục tiêu, chủ đề/nội dung học và thời lượng phiên học          |
| 2 | **Focus Session / Timer**        | Bắt đầu phiên học và countdown trong suốt thời gian đã chọn                 |
| 3 | **Distraction Control**          | Hạn chế hoặc phát hiện việc truy cập các app gây xao nhãng trong phiên học |
| 4 | **Post-study Quiz**              | Hết giờ → đưa ra một bài quiz ngắn liên quan đến nội dung học             |
| 5 | **Session Evaluation**           | Tổng hợp thời gian, distraction, mức hoàn thành mục tiêu và quiz score        |
| 6 | **Study History / Data Logging** | Lưu kết quả các phiên để theo dõi tiến trình và phục vụ phân tích       |

### MVP Scope Notes

- **Study Goal Setup** nên có ít nhất: Goal + Topic/Learning Content + Duration.
- **Post-study Quiz** trong MVP nên sử dụng question bank được chuẩn bị trước để đảm bảo độ ổn định và mức độ liên quan của câu hỏi.
- **AI-generated questions** được xem là tính năng mở rộng, không phải thành phần bắt buộc của MVP.
- **Distraction Control** cần được triển khai trong phạm vi quyền và khả năng của Android. Nếu việc chặn trực tiếp không ổn định, MVP có thể sử dụng cơ chế monitoring/warning làm phương án dự phòng.
- MVP tập trung vào chức năng cốt lõi thay vì các tính năng như tài khoản, cloud synchronization, gamification, social features hoặc hỗ trợ iOS.

---

## 10. Proposed Contribution / Novelty

Dự án đề xuất một hệ thống hỗ trợ tự học theo vòng lặp khép kín (**closed-loop self-study system**) thay vì chỉ cung cấp một bộ đếm thời gian hoặc một công cụ chặn ứng dụng.

Hệ thống tích hợp:

**Goal Setting → Timed Focus → Distraction Control → Retrieval-based Assessment → Session Evaluation**

Sự tích hợp này cho phép hệ thống:

- Hỗ trợ giảm các tác nhân gây xao nhãng trong lúc học.
- Thu thập dữ liệu về hành vi trong phiên học.
- Đánh giá kết quả học tập sau phiên học.
- Tạo cơ sở để so sánh hiệu quả của hệ thống với timed study alone.

Điểm đóng góp của dự án tập trung vào **sự kết hợp và vòng lặp phản hồi của các thành phần**, thay vì tuyên bố rằng từng công nghệ thành phần là hoàn toàn mới.

---

## 11. Expected Outcomes

Nhóm kỳ vọng rằng hệ thống đề xuất có thể:

1. Giảm số lần xảy ra hoặc cố gắng xảy ra distraction trong một phiên học.
2. Tăng tỷ lệ hoàn thành mục tiêu học tập đã đặt ra.
3. Cải thiện điểm đánh giá kiến thức sau phiên học so với điều kiện chỉ sử dụng timed study.
4. Cung cấp dữ liệu định lượng để học sinh và nhóm nghiên cứu đánh giá chất lượng của từng phiên học.

Các kết quả trên là **kỳ vọng cần được kiểm chứng bằng thực nghiệm**, không phải kết luận được giả định trước.

---

## 12. Limitations

### 12.1. Technical Limitation

Khả năng hạn chế hoặc giám sát các ứng dụng khác phụ thuộc vào quyền và khả năng mà hệ điều hành Android cung cấp. Do đó, hệ thống không thể đảm bảo ngăn chặn tuyệt đối mọi hình thức xao nhãng.

### 12.2. Behavioral Limitation

Hệ thống không thể trực tiếp xác minh rằng học sinh đã thực sự học liên tục trong toàn bộ thời gian của phiên. Người dùng vẫn có thể sử dụng thiết bị hoặc nguồn xao nhãng khác mà hệ thống không quan sát được.

### 12.3. Measurement Limitation

Distraction frequency, task completion và quiz score là các chỉ báo có thể đo được nhưng không phản ánh toàn bộ quá trình học tập hoặc năng lực học tập của học sinh.

### 12.4. Experimental Limitation

Kết quả có thể bị giới hạn bởi:

- Số lượng người tham gia.
- Thời gian thực nghiệm.
- Đặc điểm của mẫu học sinh tham gia.
- Nội dung và độ khó của bài đánh giá.
- Điều kiện và thiết bị được sử dụng trong thử nghiệm.

---

# 13. Future Development

Các tính năng có thể được phát triển trong các phiên bản sau của hệ thống:

- AI-generated questions based on learning materials.
- Adaptive difficulty based on previous quiz performance.
- Personalized study recommendations.
- More advanced learning analytics.
- Cross-platform support.
- Cloud synchronization.
- Gamification.

Các tính năng trên **không thuộc phạm vi MVP hiện tại** và chỉ được triển khai sau khi core MVP đã hoạt động ổn định.

---

# 14. One-line Project Concept

> `Một hệ thống tự học khép kín trên thiết bị di động, kết hợp các phiên tập trung có giới hạn thời gian, cơ chế kiểm soát yếu tố gây xao nhãng và hoạt động ôn tập tái hiện kiến thức sau khi học, nhằm hỗ trợ và đo lường kết quả tự học của sinh viên.`
