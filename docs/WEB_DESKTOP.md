# Viễn Du — web app và Windows

Giao diện chính dùng cảnh tàu 3D cartoon bằng Three.js. Web và Electron dùng chung bản export Expo; không phải hai sản phẩm riêng. Chế độ khách lưu cá nhân trên thiết bị, tài khoản dùng API để đồng bộ và tham gia đoàn.

## Chạy web

Dùng Node 24 LTS và npm 11 như GitHub Actions; npm 10 có thể từ chối lockfile khi giải quyết peer dependency.

```bash
npm ci
npm run web
```

Bản production:

```bash
# Đặt EXPO_PUBLIC_API_URL trong .env hoặc môi trường build.
# Ví dụ https://api.example.com/api/v1 (không chứa khóa bí mật).
npm run build:web
npx expo serve --port 8081
```

Đưa thư mục `dist/` lên máy chủ HTTPS có fallback về `index.html` cho SPA. URL API được nhúng khi build; đổi URL cần build lại. Sau lần tải production đầu tiên và khi service worker đã lưu xong bundle, web có thể mở lại khi offline. Service worker chỉ cache giao diện/assets, không cache API hoặc dữ liệu đăng nhập. Bản desktop chứa toàn bộ bundle nên mở được khi offline.

## Chạy backend

```bash
npm --prefix backend ci
npm --prefix backend run db:generate
npm --prefix backend run dev:local
```

Runtime local tự áp dụng migration ban đầu và migration hành trình vào PGlite; chỉ dành cho phát triển. Production dùng PostgreSQL/Redis và biến môi trường tại `backend/.env.example`:

```bash
npm --prefix backend run db:migrate
npm --prefix backend run db:generate
npm --prefix backend run db:seed
npm --prefix backend run build
npm --prefix backend start
```

`GEMINI_API_KEY` chỉ nằm trên backend. Không có key thì quiz tĩnh vẫn dùng được; lỗi quiz không hủy phiên học.

## Windows .exe

```bash
npm run build:web
npm --prefix desktop ci
npm --prefix desktop start
npm --prefix desktop run package:win
```

Installer ở `desktop/release/`. Workflow `.github/workflows/windows.yml` chạy trên Windows, kiểm tra lint/typecheck/tests rồi tạo artifact `Vien-Du-Windows`. Đặt repository variable `EXPO_PUBLIC_API_URL` trước khi build bản dùng API online. Bản chưa ký chứng thư sẽ hiển thị nhà phát hành chưa xác minh trên Windows.

Đóng gói installer chưa ký từ macOS khi không có Wine:

```bash
npm --prefix desktop run package:win -- -c.win.signAndEditExecutable=false
```

Lệnh này bỏ cả chỉnh sửa tài nguyên EXE, nên bản đóng gói chéo dùng icon Electron mặc định. Workflow trên Windows không dùng tùy chọn đó. GitHub Actions chạy khi push `main` và tạo ZIP web cùng phiên bản với installer; backend được kiểm tra trong job riêng. File build lớn được lưu tại artifact Actions thay vì đưa vào lịch sử Git.

Electron dùng origin `viendu://app`, renderer sandbox, context isolation, CSP và không có quyền Node/IPC cho giao diện. Module Guard cũ còn là thử nghiệm riêng (`start:guard`); ứng dụng Viễn Du chỉ hỗ trợ phân loại gián đoạn, không tự đóng chương trình đang mở.

## Quy tắc đã triển khai

- Thời gian gợi ý 15/25/45/60 phút và ô tùy chỉnh 1–240 phút tại ga chính lẫn tấm vé; chặn số thập phân và giá trị ngoài giới hạn.
- Nút 2D/3D tại ga chính, bản đồ và ngay trong phiên học. Bản đồ nhìn từ trên xuống có đầu tàu, số toa theo thành viên thực tế, chọn toa xem tên/màu, phóng to/thu nhỏ, tìm tàu và hai tuyến núi/bờ biển. Góc nhìn không thay đổi đồng hồ. Vị trí phiên cá nhân có xem trước thời gian học chưa lưu; tiến độ đoàn dùng số đã được máy chủ xác nhận.
- 12 chủ đề học, gồm khoa học, ngôn ngữ, lịch sử, nghệ thuật và kỹ năng học; mỗi chủ đề có 3 câu hỏi tĩnh sau khi chạy seed.
- Cá nhân, toa với 4 màu/3 trang trí, 5 trạm, ngã rẽ có bình chọn 24 giờ.
- Nhóm riêng tối đa 6 thành viên; tạo, mời, thu hồi, gia nhập, rời và chuyển quyền.
- Phiên học không có nút tạm nghỉ. Rời cửa sổ hoặc đổi sang trang khác trong ứng dụng sẽ giữ thời gian chờ phân loại; đọc tài liệu được tính, xao nhãng bị loại. Nối lại 120 giây vẫn là thời gian học. Phiên cũ đã lưu ở trạng thái nghỉ có thể tiếp tục để không mất dữ liệu.
- Phần học hợp lệ được lưu cả khi kết thúc sớm. Chuyển cửa sổ dưới 3 giây được coi là nhiễu; tải lại ứng dụng luôn chờ phân loại khoảng chưa rõ.
- Sương khám phá xuất hiện ngay từ đầu phiên ở cả 2D/3D: vùng rõ quanh tàu lớn dần theo phần học được ghi nhận. Sương nối lại sau xao nhãng là lớp riêng; không xóa vùng đã khám phá. Góc 2D giữ tàu cố định và cho cảnh vật trôi quanh tàu.
- Cho chọn mọi loại tệp, nhiều tệp cùng lúc. Word DOCX, PowerPoint PPTX, Excel XLSX/XLS, PDF, OpenDocument và các định dạng văn bản phổ biến được đọc ngay trên thiết bị. Giới hạn 20 MB/tệp, 10 tệp/chuyến và tổng 50.000 ký tự. Định dạng chưa có bộ đọc (ví dụ DOC/PPT cũ, ảnh, video) được ghi tên và báo chưa trích xuất; không đưa dữ liệu nhị phân vào quiz. PDF worker dùng file cùng origin, không tải từ CDN.
- Hàng đợi offline có mã phiên cố định; retry không cấp trùng. Máy chủ kiểm tra thời gian, chồng phiên, quyền đoàn, cap 60 phút/ngày theo múi giờ đoàn, giữ phần lẻ và dư tại đích.
- Đoàn chỉ thấy toa và tiến độ chung, không có mục tiêu, tài liệu, quiz hoặc log gián đoạn của người khác.
- Quiz tĩnh/Gemini là tùy chọn; kết quả được chấm trên máy chủ và ghi một lần.
- Web Locks ngăn hai cửa sổ cùng sửa trạng thái cá nhân. Có xuất bản sao dữ liệu riêng.
- Cảnh 3D và bộ đọc tài liệu tải riêng; giới hạn pixel ratio, tự dừng khi ngoài viewport/ẩn cửa sổ, hỗ trợ reduced motion và ảnh SVG khi WebGL không khả dụng. Không có nút dừng hiệu ứng trong giao diện.
- Danh tính tài khoản được giữ khi mở lại offline, yêu cầu đăng nhập lại trước khi đồng bộ nếu hết phiên. Đăng xuất dọn phiên đăng nhập kể cả khi mất mạng; dữ liệu hành trình vẫn tách theo chủ sở hữu. Dữ liệu lưu bị hỏng có màn hình xuất bản sao và khôi phục, không âm thầm ghi đè.

## Giới hạn phát hành cần biết

Đây là MVP cá nhân và nhóm bất đồng bộ trong mục 11.1 của kế hoạch. Phòng chờ trực tiếp, bonus phối hợp, tín hiệu hỗ trợ và spike chặn app là các mốc tiếp theo trong tài liệu gốc.

Backend MVP dùng một aggregate JSONB có row lock để quyết toán thành viên và ledger trong giao dịch. Phù hợp pilot nhóm nhỏ; cần phân tách aggregate theo journey và lập chính sách lưu/xóa dữ liệu trước khi mở rộng quy mô. Kiểm chứng thời gian dựa trên tự khai báo, không phải chống gian lận tuyệt đối. Quiz/AI live cần key; Windows installer cần thử trên máy Windows thật.
