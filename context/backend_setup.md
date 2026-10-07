# Pomodoro Focus

Ứng dụng Expo SDK 57 và backend Fastify/PostgreSQL. Checklist triển khai và những điểm cần cấu hình thực tế ở [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md).

## Chạy trên điện thoại bằng Expo Go (ưu tiên)

Cài dependency một lần tại thư mục gốc:

```bash
npm ci
npm --prefix backend ci
npm --prefix backend run db:generate
npm run mobile:local
```

Lệnh cuối tự chạy backend local và Expo ở chế độ **Expo Go / LAN**, tự lấy IP Wi-Fi của máy và truyền địa chỉ API cho app. Quét QR bằng Expo Go trên Android hoặc Camera trên iPhone. Điện thoại và máy tính cùng Wi-Fi; cho phép truy cập mạng local nếu hệ điều hành hỏi. Có thể kiểm tra API từ điện thoại bằng `http://<IP-máy>:3000/health`. Nếu có nhiều card mạng, chạy `MOBILE_HOST=<IP-Wi-Fi> npm run mobile:local`.

Backend local dùng PostgreSQL PGlite lưu trên máy, Redis giả lập dành riêng phát triển và tài liệu lưu tại `backend/.local-data/` với URL ký. Không cần Docker/S3 để thử đăng ký, học, quiz, lịch sử và upload tài liệu. Không dùng chế độ này cho production; production dùng PostgreSQL/Redis/S3 thật theo phần dưới. Sinh quiz AI vẫn cần khóa OpenAI ở backend.

PGlite mở cổng `127.0.0.1:15433`, database `postgres`. Khi dùng PGlite, đặt `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:15433/postgres?connection_limit=1&sslmode=disable` trong `backend/.env`; datasource trong `prisma/schema.prisma` vẫn dùng provider `postgresql`. Chạy backend bằng `npm --prefix backend run dev:local`.

Để đồng bộ schema local, dừng `dev:local`, chạy `npm --prefix backend run db:local` ở một terminal; tại terminal khác chạy `cd backend && npx prisma db push`. Sau đó dừng `db:local` và chạy lại `dev:local`. Không chạy Prisma CLI đồng thời với API trên PGlite vì socket chia sẻ một connection và có thể trùng prepared statement. Metadata migration local nằm trong schema `local_runtime`, tách khỏi bảng ứng dụng ở `public`.

Ứng dụng dùng SecureStore, Crypto, DocumentPicker, Haptics và AsyncStorage bundled của Expo SDK 57; **không cần development build cho các thay đổi này**. Expo Go trên điện thoại phải hỗ trợ SDK 57. Chặn app thật ở cấp hệ điều hành là tính năng khác, cần native module/development build và chưa được tích hợp.

Không dùng bản web để xác nhận hành vi native. Export iOS/Android chỉ xác minh bundle, việc hoạt động trên điện thoại thật cần bạn quét QR và thử các bước.

## Chạy backend với Docker

Cần Node 24 và Docker Compose. Trong thư mục `backend/`:

```bash
cp .env.example .env
```

Thay `JWT_SECRET` bằng giá trị ngẫu nhiên ít nhất 32 ký tự, ví dụ tạo bằng `openssl rand -hex 32`. Sau đó:

```bash
docker compose up --build
```

Compose tự chạy migration và seed trước khi khởi động API. PostgreSQL/Redis chỉ bind loopback trên host; API ở cổng 3000, MinIO ở cổng 9000, console MinIO ở cổng 9001. Credential MinIO trong env/Compose chỉ dùng local; production dùng IAM/secrets riêng. Bucket được tạo tự động và giữ private.

Nếu không dùng container cho API:

```bash
cd backend
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Cần có PostgreSQL, Redis và S3/MinIO đang chạy đúng env. Backend pin Prisma 6.19; không nâng sang Prisma major khác mà chưa migrate API/schema.

## Chạy mobile

Tại thư mục gốc:

```bash
cp .env.example .env
npm ci
npx expo start --go --lan
```

Đặt `EXPO_PUBLIC_API_URL`:

- Web/iOS simulator: `http://localhost:3000/api/v1`.
- Android emulator: `http://10.0.2.2:3000/api/v1`.
- Điện thoại thật: `http://<IP-LAN-của-máy>:3000/api/v1`, hai thiết bị cùng mạng.

Web luôn dùng `http://localhost:3000/api/v1`, kể cả khi `EXPO_PUBLIC_API_URL` chứa IP LAN cũ. Native ưu tiên `EXPO_PUBLIC_API_URL`; URL chỉ có host/cổng sẽ tự thêm `/api/v1`. Khi biến này thiếu hoặc trống, dùng fallback `http://localhost:3000/api/v1`; không tự lấy IP Metro. Kiểm tra `.env.local` vì nó ưu tiên hơn `.env`. Sau khi đổi URL, reload toàn bộ app.

Backend phải listen trên `HOST=0.0.0.0` để điện thoại truy cập qua LAN. CORS hiện đăng ký ngay sau khi khởi tạo Fastify, phản hồi mọi origin và cho phép credentials ở mọi môi trường theo cấu hình yêu cầu. `CORS_ORIGIN` hiện không được dùng. Preflight được plugin kết thúc với HTTP 204 trước các hook xác thực/rate limit; hỗ trợ `PATCH` và header `X-Requested-With`.

Nếu đọc tài liệu từ điện thoại, đổi `S3_PUBLIC_ENDPOINT` thành `http://<IP-LAN>:9000`. `S3_ENDPOINT` trong container vẫn là `http://minio:9000`; URL ký cho client dùng endpoint public. Production dùng HTTPS cho API và storage.

Tạo tài khoản email ở màn hình đăng nhập, nhập mục tiêu, chọn chủ đề, tài liệu và danh sách ứng dụng gây xao nhãng, đặt timer. Quiz lấy từ API khi timer hoàn thành; dừng sớm đi thẳng tới tổng kết. Tài liệu được tải trước khi bắt đầu timer. Có thể retry lưu sau lỗi mạng và tiếp tục draft sau khi đăng nhập lại cùng tài khoản. Refresh token lưu ở Keychain/Keystore; web dùng bộ nhớ nên cần đăng nhập lại khi reload.

Bản hiện tại **ghi nhận rời ứng dụng**, chưa chặn app thật. Các module dùng ở đây có trong Expo Go SDK 57. Chỉ cần development build khi thêm module native không bundled. Không tạo hoặc sửa ios/android bằng tay.

## API và tích hợp

Base URL: `/api/v1`. Request có `Authorization: Bearer <access_token>` trừ register/login/oauth/refresh. Danh sách endpoint theo đặc tả, thêm `client_id` UUID tùy chọn trên POST sessions để retry không tạo trùng. `/health`, `/metrics`, `/ws/v1` nằm ngoài prefix `/api/v1`.

- API OAuth nhận `id_token` đã được cấp bởi Google/Apple và kiểm tra JWKS; cấu hình `GOOGLE_CLIENT_ID`/`APPLE_CLIENT_ID`. Chưa có nút OAuth native trong ứng dụng.
- AI nhận `document_ids` thuộc người gọi; hỗ trợ PDF, JPEG/PNG/WebP, TXT/Markdown; model cấu hình qua `OPENAI_MODEL`. `OPENAI_API_KEY` chỉ đặt ở backend. Client bấm tạo AI đồng ý gửi tài liệu tới dịch vụ; request `store=false`. Thiếu key trả 503, quiz seed vẫn hoạt động.
- Upload sử dụng multipart (`name` trước `file`) tối đa 1 file/lần. PDF 20 MB, ảnh 10 MB, text 5 MB. URL đọc ký có hạn 1 giờ; GET session detail cấp lại URL. PDF/text không có thumbnail.
- Quiz gửi câu trả lời sau khi POST session; điểm hiển thị tổng kết lấy lại từ server. Các trường điểm trong POST session được validate theo hợp đồng; các lần chấm `/quizzes/answer` tính lại từ câu trả lời đã lưu.
- WebSocket `/ws/v1?token=...`: JSON `{event,payload}` theo đặc tả. Tick advisory mỗi 30 giây, timer local là deadline chuẩn. Client không cần socket hoạt động để hoàn tất phiên.
- Log request JSON không ghi token/body/query. Reverse proxy cũng cần loại query token của WebSocket khỏi access logs.
- `/metrics` cần `METRICS_TOKEN` ít nhất 32 ký tự và Bearer token này. Counter/latency mỗi process, active_sessions từ Redis. Prometheus scrape và dashboard/alert cần cấu hình ở hạ tầng.

## Kiểm tra

Kiểm tra đồng hồ và thời gian tạm dừng cảnh báo: `npm run test:mobile` (Node 24).

```bash
npm run lint
npm run typecheck
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run build
npx expo-doctor
npx expo export --platform ios --platform android
```

Integration tests chạy PostgreSQL PGlite tạm tại `127.0.0.1:15432`, Prisma queries/migration thật, Redis giả lập và S3/AI test double. Không cần Docker hoặc khóa dịch vụ; môi trường chạy test phải cho bind localhost. Không chạy song song nhiều suite API dùng cùng cổng. Những test này không thay thế kiểm tra S3/OAuth/OpenAI production và E2E mobile.

CI chạy lint/typecheck/tests/bundle iOS/Android và build Docker; không tự publish/deploy. Script k6 ở `backend/scripts/load-test.js` nhận `API_URL`, `API_TOKENS` (JSON mảng access token staging), `VUS`, `DURATION`. Mặc định 5 VU/30 giây; dùng đủ tài khoản để không vi phạm rate limit. Mục tiêu 1000 RPS cần workload nhiều người dùng và hạ tầng staging phù hợp, chưa được đo ở máy này.

Nguồn tham khảo triển khai: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Expo Router authentication](https://docs.expo.dev/router/advanced/authentication/), [OpenAI file inputs](https://developers.openai.com/api/docs/guides/file-inputs), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Prisma 6 migrations](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/development-and-production).
