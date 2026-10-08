# Kế hoạch sản phẩm: Đoàn tàu viễn du

> Ngày lập: 07/10/2026. Trạng thái: đề xuất để thiết kế và triển khai, chưa phải tính năng đã có.
> Các ngưỡng, điểm thưởng và phạm vi dưới đây là mặc định đề xuất, cần kiểm chứng qua thử nghiệm người dùng.

## 1. Tầm nhìn

Biến việc học thành một cuộc phiêu lưu bằng tàu: mỗi người sở hữu một toa riêng, có thể đi một mình hoặc nối toa với bạn bè để khám phá thế giới chung.

Lời hứa sản phẩm: **“Mỗi phiên học làm toa của bạn trưởng thành và đưa cả đoàn đến vùng đất mới.”**

Ba động lực chính:

1. **Tiến bộ cá nhân:** nhìn thấy công sức, kiến thức và thành quả của mình.
2. **Khám phá:** muốn biết trạm tiếp theo có gì, lựa chọn tuyến đường và mở câu chuyện.
3. **Đồng hành:** cảm nhận bạn bè đang học cùng, có thể giúp nhau quay lại tập trung.

Điểm khác biệt: toa tàu là tài sản cá nhân bền vững; đoàn tàu là hành trình tập thể. Xao nhãng có ảnh hưởng rõ ràng và có đường phục hồi, tạo cơ hội hỗ trợ thay vì chỉ đếm lỗi.

## 2. Mục tiêu và nguyên tắc

### 2.1. Mục tiêu

- Tăng số phiên học có ích và tỷ lệ quay lại tập trung sau gián đoạn.
- Giúp nhóm nhỏ duy trì việc học dù khác môn, lịch và trình độ.
- Làm lịch sử học trở thành bản đồ thành quả có thể khám phá lại.
- Giữ chế độ cá nhân đầy đủ, có giá trị ngay từ phiên đầu.

### 2.2. Nguyên tắc bắt buộc

- Màn hình đang học yên tĩnh; tương tác khám phá, trang trí và xã hội diễn ra trước hoặc sau phiên.
- Không trừ thành quả đã kiếm được, làm hỏng toa hoặc xóa tiến độ nhóm vì xao nhãng.
- Tác động tập thể chỉ áp dụng khi nguồn sự kiện đủ rõ và đúng chế độ đã chọn.
- Không coi mất mạng, cuộc gọi, khóa màn hình hoặc mở tài liệu là bằng chứng xao nhãng tự động.
- Điểm quiz thấp dẫn tới hỗ trợ học lại; không làm đồng đội mất thưởng.
- Người nghỉ học không phải người gây sự cố. Chỉ thành viên đang tham gia chuyến trực tiếp mới ảnh hưởng nhịp phối hợp.
- Không công khai ứng dụng đã mở, tài liệu, điểm quiz hoặc bảng xếp hạng xao nhãng.
- Cho phép tạm nghỉ, kết thúc sớm và chuyển về học cá nhân.

## 3. Đối tượng và tình huống sử dụng

| Đối tượng | Nhu cầu | Trải nghiệm chính |
| --- | --- | --- |
| Người học một mình | Có động lực bắt đầu, nhìn thấy tiến bộ | Toa riêng, bản đồ cá nhân, các trạm học |
| Nhóm bạn 2–6 người | Cùng duy trì thói quen dù khác lịch | Đoàn riêng, đóng góp bất đồng bộ |
| Nhóm đang học cùng | Có cam kết và hỗ trợ quay lại | Chuyến khởi hành trực tiếp, nhịp phối hợp |
| Người dễ xao nhãng | Nhận biết và phục hồi sau gián đoạn | Mất lực kéo, nối lại toa, lời động viên |

MVP ưu tiên nhóm quen nhau, tham gia bằng lời mời. Ghép nhóm công khai và quản lý lớp học để giai đoạn sau.

## 4. Hệ thống thế giới

### 4.1. Cấu trúc

**Thế giới → vùng đất → tuyến đường → trạm → nhiệm vụ.**

- Vùng đất có chủ đề hình ảnh và câu chuyện ngắn.
- Tuyến đường nối các trạm, có thể có ngã rẽ.
- Trạm chứa mục tiêu khám phá chung; mỗi người tự đặt nội dung học.
- Nhiệm vụ học cung cấp tiến độ, nhiệm vụ khám phá mở câu chuyện và kỷ niệm.

Nội dung mẫu cho tuyến đầu:

| Trạm | Cảnh quan | Hoạt động | Thành quả |
| --- | --- | --- | --- |
| Ga Khởi đầu | Sân ga nhỏ | Tạo toa, hoàn thành phiên đầu | Biển tên toa |
| Đồng cỏ Gió | Đồng cỏ | Tích lũy đóng góp | Cờ đoàn tàu |
| Rừng Sương mù | Rừng | Thu thập mảnh bản đồ | Đoạn truyện, chọn ngã rẽ |
| Đèo Ánh sao | Núi hoặc ven biển theo lựa chọn | Mở đường qua chướng ngại | Cảnh cửa sổ mới |
| Thành phố Bình minh | Thành phố | Tổng kết hành trình | Ảnh đoàn, huy hiệu chuyến đi |

Ngã rẽ tạo hai biến thể cảnh quan trước khi nhập lại tuyến chính. MVP không cần hai chiến dịch nội dung hoàn toàn riêng.

### 4.2. Quy tắc khám phá

- Mở một trạm theo tiến độ được máy chủ ghi nhận.
- Câu chuyện do đội sản phẩm biên soạn ở MVP; nội dung quiz vẫn gắn tài liệu và chủ đề học.
- Mảnh bản đồ là phần thưởng khám phá, không giả làm bằng chứng hiểu bài.
- Ngã rẽ có thời hạn bỏ phiếu; hòa phiếu hoặc không có phiếu dùng tuyến mặc định công bố trước.
- Thành viên mới có thể xem nhật ký cũ nhưng không nhận lại vật phẩm cá nhân từ phiên người khác.
- Tại đích, tiến độ dư được lưu cho chặng tiếp theo; nếu hết tuyến thì lưu tại ga, không tự tiêu vào tuyến chưa chọn.

## 5. Toa cá nhân và đoàn tàu

### 5.1. Toa cá nhân

Một tài khoản có một toa chính trong MVP. Toa gồm biển tên, màu, avatar, nội thất, bộ sưu tập và trạng thái phiên hiện tại.

- Bàn học: mục tiêu đang thực hiện.
- Thư viện: tài liệu và ghi chú riêng.
- Kệ kỷ niệm: vật phẩm từ phiên học, quiz và hành trình.
- Cửa sổ: cảnh tại vị trí hiện tại.
- Hồ sơ toa: thống kê riêng và phần người dùng chọn chia sẻ.

Trang trí không tăng điểm học hoặc tạo lợi thế cho nhóm. Chưa có tiền thật hoặc giao dịch vật phẩm trong MVP.

### 5.2. Đoàn tàu

- Đoàn có tên, chủ đoàn, thành viên, tuyến hiện tại và nhật ký.
- Tối đa 6 thành viên; mỗi người chỉ thuộc một đoàn đang hoạt động ở MVP.
- Chủ đoàn quản lý lời mời và tuyến, không được đọc dữ liệu học riêng.
- Thành viên có thể rời đoàn; toa và thành quả cá nhân được giữ.
- Đóng góp đã ghi nhận thuộc lịch sử đoàn cũ, không mang sang đoàn mới để nhận thưởng hai lần.
- Rời đoàn trong chuyến trực tiếp được xử lý là rời chuyến hợp lệ, không gây lỗi cho nhóm.
- Khi chủ đoàn rời: chuyển quyền theo lựa chọn của họ hoặc quy tắc xác định trước; nếu đoàn rỗng thì lưu trữ.
- Lời mời hết hạn, có thể thu hồi, giới hạn số lần thử; việc gia nhập kiểm tra sức chứa trong giao dịch để tránh vượt 6 người.

## 6. Các chế độ

| Chế độ | Lịch học | Tiến độ chung | Tác động khi xao nhãng |
| --- | --- | --- | --- |
| Cá nhân | Tự chọn | Bản đồ riêng | Tạm dừng tiến độ toa |
| Nhóm bất đồng bộ | Mỗi người học giờ riêng | Cộng đóng góp sau phiên | Chỉ phần đóng góp người đó bị dừng |
| Khởi hành trực tiếp | Cùng vào một chuyến | Tiến độ cơ bản và thưởng phối hợp | Tạm giảm phần thưởng phối hợp |
| Thử thách phối hợp | Cùng cam kết trước | Mục tiêu chuỗi tập trung | Dừng tích lũy chuỗi; giữ phần đã đạt |

Chế độ cá nhân và nhóm bất đồng bộ thuộc MVP. Khởi hành trực tiếp là mốc tiếp theo, cần hoàn tất trước khi công bố tính năng tác động tập thể thời gian thực. Thử thách phối hợp là phần mở rộng.

## 7. Luồng trải nghiệm

### 7.1. Phiên cá nhân hoặc bất đồng bộ

1. Mở ga chính, xem toa và trạm đang khám phá.
2. Chọn đi riêng hoặc đóng góp cho đoàn.
3. Đặt mục tiêu, chủ đề, tài liệu, thời lượng và cấu hình hỗ trợ tập trung.
4. Xem vé: mục tiêu, thời lượng, điểm đến, cách ghi nhận gián đoạn.
5. Bắt đầu học: đồng hồ, toa, cảnh chuyển động nhẹ và nút tạm nghỉ.
6. Nếu gián đoạn: xác định nguyên nhân, tiếp tục hoặc nối lại toa.
7. Hết thời gian: làm quiz; nếu quiz lỗi thì lưu phiên và cho làm lại sau.
8. Tổng kết riêng: phút tập trung, kiến thức cần ôn, phần thưởng toa.
9. Ghi đóng góp vào đoàn, mở nội dung mới nếu đủ ngưỡng.

Quiz không chặn lưu thời gian học và đóng góp cơ bản. Phần thưởng kiến thức được xử lý riêng khi quiz hoàn thành.

### 7.2. Khởi hành trực tiếp

1. Tạo chuyến có giờ bắt đầu, thời lượng đề xuất và quy tắc phối hợp.
2. Thành viên vào phòng chờ, chọn mục tiêu và thời lượng riêng.
3. Máy chủ tạo thời điểm bắt đầu chung; thành viên đến muộn được tham gia từ lúc vào.
4. Theo dõi toa bản thân; nhóm nhận trạng thái tổng hợp và tiến độ đã xác nhận.
5. Thành viên kết thúc sớm hoặc hết thời gian rời tập người đang tham gia; không bị tính xao nhãng.
6. Cuối chuyến hiển thị thành quả chung, sau đó mỗi người xem quiz và tổng kết riêng.

### 7.3. Chuyển giữa cá nhân và nhóm

Người dùng có thể học cá nhân khi vẫn là thành viên đoàn. Chọn nơi ghi đóng góp lúc bắt đầu phiên và khóa lựa chọn trong phiên. Mỗi khoảng học chỉ cấp tiến độ khám phá cho một hành trình; kinh nghiệm toa cá nhân vẫn tăng ở cả hai chế độ.

## 8. Hỗ trợ tập trung và xao nhãng

### 8.1. Phân biệt năng lực hiện tại và mục tiêu

Mã hiện tại dùng `src/hooks/useDistractionMonitor.ts` để quan sát việc app xuống nền/inactive rồi trở lại sau hơn 3 giây. Sự kiện được gắn `appId: "unknown"`. Cơ chế này không xác định app bên ngoài và không chứng minh đã chặn app.

`src/app/focus-timer.tsx` có cảnh báo và nút mô phỏng. Sự kiện mô phỏng chỉ dùng kiểm tra giao diện, không cấp thưởng hoặc ảnh hưởng đoàn thật.

Quy tắc sản phẩm:

| Nguồn | Mức xác định | Hành vi |
| --- | --- | --- |
| App xuống nền, nguyên nhân chưa rõ | Chưa xác nhận | Trạng thái chờ; hỏi khi quay lại |
| Người dùng xác nhận đã xao nhãng | Tự khai báo | Áp dụng mất lực kéo trong chế độ hỗ trợ |
| Tín hiệu native được kiểm chứng | Đã xác nhận theo năng lực nền tảng | Có thể tự áp dụng theo cấu hình đã đồng ý |
| Mất mạng, thiếu heartbeat | Không xác định | Đánh dấu kết nối chưa rõ; không kết tội xao nhãng |
| Sự kiện mô phỏng | Kiểm thử | Chỉ chạy sandbox |

MVP gọi tính năng là **“Hỗ trợ tập trung”** và mô tả rõ năng lực thực tế. Chỉ dùng lời hứa “chặn app” tại nền tảng/cấu hình đã kiểm chứng khả năng chặn.

### 8.2. Máy trạng thái toa trong phiên

| Trạng thái | Nguyên nhân | Hành vi | Chuyển tiếp |
| --- | --- | --- | --- |
| Sẵn sàng | Chưa bắt đầu | Chọn mục tiêu | Đang tập trung |
| Đang tập trung | Phiên hoạt động | Tích lũy thời gian hợp lệ | Chờ xác nhận / mất lực kéo / nghỉ / hoàn tất |
| Chờ xác nhận | Rời app, chưa rõ nguyên nhân | Tạm treo ghi nhận khoảng chưa rõ | Xác nhận học hợp lệ hoặc xao nhãng |
| Mất lực kéo | Xao nhãng đã xác nhận | Dừng ghi nhận khoảng xao nhãng, hiển thị sương mù | Đang nối lại |
| Đang nối lại | Người dùng quay lại | Tích lũy 120 giây tập trung liên tục | Đang tập trung |
| Tạm nghỉ | Người dùng chủ động nghỉ | Dừng đồng hồ học, không gây lỗi phối hợp | Đang tập trung hoặc kết thúc |
| Hoàn tất / kết thúc sớm | Kết thúc phiên | Lưu phần học hợp lệ | Tổng kết |

Khả năng kết nối là trạng thái riêng (`online`, `offline`, `unknown`), không thay thế trạng thái học.

### 8.3. Chính sách thời gian

- Ngưỡng 3 giây hiện tại chỉ là bộ lọc nhiễu đầu vào, không phải bằng chứng xao nhãng.
- Khi quay lại, hiển thị ba lựa chọn: “Tôi dùng tài liệu học”, “Tôi bị xao nhãng”, “Tôi cần nghỉ”.
- Khoảng dùng tài liệu được người dùng xác nhận: ghi nhận cá nhân, đánh dấu tự khai báo.
- Khoảng xao nhãng hoặc nghỉ: loại khỏi thời gian tập trung; thời gian còn lại của mục tiêu được bảo toàn.
- Khoảng chưa phân loại: giữ pending, không cấp tiến độ tập thể cho tới khi giải quyết; không âm thầm coi là học hoặc lỗi.
- 120 giây nối lại vẫn là thời gian học hợp lệ và được tính vào tiến độ cơ bản; thưởng phối hợp chưa phục hồi trong khoảng này.
- Nếu xao nhãng lại lúc nối: đặt lại bộ đếm nối, không xóa phần học trước đó.
- Nếu phiên kết thúc trước đủ 120 giây: lưu thành quả; phiên sau bắt đầu bình thường, không mang hình phạt sang ngày mới.
- Người dùng nghỉ hợp lệ rồi quay lại không cần nối toa.

### 8.4. Hệ quả cá nhân và nhóm

**Cá nhân:** cảnh sương mù, tạm dừng đóng góp, lời mời quay lại; không mất vật phẩm.

**Bất đồng bộ:** chỉ đóng góp của người bị xao nhãng dừng. Những người khác tiếp tục; không công khai sự cố.

**Trực tiếp:** tiến độ cơ bản của mọi người đang học tiếp tục; tỷ lệ phối hợp giảm khi có toa mất lực kéo. Không kéo lùi quãng đường đã đi.

**Thử thách:** chuỗi chưa đạt tạm dừng; khi xao nhãng đã xác nhận thì bắt đầu lại đoạn chuỗi chưa hoàn tất. Các mốc đã đạt được giữ. Mất mạng chỉ tạm chờ xác minh, không tự đặt lại chuỗi.

### 8.5. Nối lại toa và hỗ trợ

- Thông điệp cá nhân: “Tập trung lại 2 phút để nối toa.”
- Thông điệp nhóm mặc định: “Một toa đang nối lại.” Không gắn tên.
- Trạng thái có tên chỉ chia sẻ khi người dùng chủ động bật và được giải thích trước chuyến.
- Tín hiệu hỗ trợ mặc định gửi tới hệ thống, chuyển tới người đang nối lại mà không lộ danh tính cho người gửi.
- Chỉ có biểu cảm/câu mẫu trong bản đầu; chưa có chat tự do.
- Giới hạn đề xuất: mỗi người gửi tối đa 1 tín hiệu mỗi 5 phút; người nhận tối đa 3 tín hiệu mỗi phiên.
- Hiển thị khi quay lại hoặc sau phiên; không bật thông báo liên tục trong giờ học.
- Cho phép tắt nhận tín hiệu và ẩn trạng thái xã hội.

## 9. Công thức tiến độ và cân bằng

### 9.1. Đơn vị cơ bản

- `F`: số giây tập trung hợp lệ đã xác nhận.
- Kinh nghiệm toa cá nhân: `floor(F / 60)`, kể cả phiên kết thúc sớm.
- Tiến độ khám phá cơ bản: 1 đơn vị cho mỗi phút hợp lệ.
- Giới hạn đóng góp chung đề xuất: 60 đơn vị/người/ngày theo múi giờ đoàn, cố định trong hành trình.
- Phần vượt giới hạn vẫn tăng thống kê và kinh nghiệm cá nhân.
- Không thưởng thêm chỉ vì đặt mục tiêu ngắn; không cộng cùng một phút cho hai hành trình.

Máy chủ ghi sổ theo khoảng thời gian/phiên với khóa duy nhất. Làm tròn trên tổng giây tích lũy của người dùng trong hành trình để các phiên ngắn không làm mất phần lẻ hoặc khai thác làm tròn.

### 9.2. Ngưỡng trạm

Ngưỡng khởi điểm đề xuất: `30 × min(N, 3)` đơn vị, với `N` là số thành viên chốt tại lúc mở chặng; cá nhân dùng `N = 1`.

- Nhóm 4–6 người không bắt tất cả cùng tham gia mới mở trạm.
- Ngưỡng được khóa trong chặng, thay đổi thành viên chỉ áp dụng chặng tiếp theo.
- Số 30 là giá trị thử nghiệm, cần điều chỉnh để phiên đầu đã có tiến bộ dễ thấy.
- Nếu nhóm ngừng hoạt động, người dùng được chuyển sang hành trình cá nhân; không chuyển lại các đóng góp đã tiêu của đoàn.

### 9.3. Thưởng phối hợp trực tiếp

Tại mỗi khoảng tính toán:

`bonus = base_units_in_interval × 0.2 × (focused_participants / active_participants)`

- Chỉ bật bonus khi có ít nhất 2 người đang tham gia và mọi người đã chọn chế độ có ảnh hưởng tập thể.
- Người nghỉ hợp lệ, hoàn tất hoặc rời chuyến không nằm trong mẫu số.
- Toa mất lực kéo hoặc đang nối lại nằm trong mẫu số, không nằm trong tử số.
- Khi có thành viên chưa rõ trạng thái/kết nối: treo bonus của khoảng đó, giữ tiến độ cơ bản đã biết; quyết toán sau đồng bộ.
- Bonus dùng phần dư chính xác, chỉ làm tròn khi cấp thưởng; không làm tròn mỗi nhịp.
- Không thưởng ngược cho thời gian mất lực kéo. Khoảng thiếu dữ liệu được giải quyết theo nguồn sự kiện, không theo tình trạng online đơn thuần.

Ví dụ: 4 người cùng học 10 phút tạo 40 đơn vị cơ bản và 8 bonus. Trong 10 phút kế tiếp, 1 người xao nhãng toàn bộ: 3 người còn lại tạo 30 đơn vị và `30 × 0.2 × 3/4 = 4.5` bonus. Người xao nhãng không mất 10 đơn vị đã có từ trước.

### 9.4. Quiz và thành quả

- Thời gian học cấp tiến độ hành trình; quiz cấp thành quả hiểu bài riêng.
- Câu sai tạo danh sách ôn tập hoặc đề xuất trạm học cá nhân.
- Mỗi phiên cấp một phần thưởng kiến thức tối đa; làm lại không cấp trùng.
- Không ép tất cả môn học dùng chung điểm số để so sánh thành viên.

## 10. Các màn hình

| Màn hình | Nội dung chính | Hành động |
| --- | --- | --- |
| Ga chính | Toa, trạm, đoàn, phiên chưa xong | Học ngay, xem hành trình |
| Toa của tôi | Nội thất, kỷ niệm, thống kê riêng | Trang trí, xem tài liệu |
| Bản đồ | Trạm, ngã rẽ, tiến độ | Xem nhiệm vụ, bỏ phiếu |
| Đoàn tàu | Thành viên, nhật ký, lời mời | Mời, rời, tạo chuyến |
| Vé học | Mục tiêu, tài liệu, thời gian | Xác nhận bắt đầu |
| Hỗ trợ tập trung | Năng lực thiết bị, app chọn, quy tắc | Cấu hình và xem giải thích |
| Phòng chờ | Người tham gia, giờ, quy tắc | Sẵn sàng, chọn học riêng |
| Phiên học | Đồng hồ, toa, cảnh, mục tiêu | Nghỉ, tiếp tục, kết thúc |
| Nối lại toa | Nguyên nhân, tiến độ phục hồi | Xác nhận và quay lại |
| Quiz | Câu hỏi và giải thích | Trả lời, ôn lại |
| Tổng kết | Công sức riêng và đóng góp chung | Xem phần thưởng, trạm mới |

Thiết kế mobile-first: thao tác chính trong tầm ngón tay; toa cuộn ngang ở màn hình đoàn, nội dung đọc cuộn dọc; không yêu cầu kéo bản đồ lớn để bắt đầu học. Có chế độ giảm chuyển động, nhãn trạng thái bằng chữ, tương phản rõ và hỗ trợ trình đọc màn hình. Không dùng màu làm dấu hiệu duy nhất.

## 11. Phạm vi phát hành

### 11.1. MVP: chứng minh vòng lặp cá nhân và nhóm

- [ ] Toa cá nhân và vài tùy chọn trang trí.
- [ ] Một tuyến 5 trạm, một ngã rẽ.
- [ ] Chế độ cá nhân đầy đủ.
- [ ] Đoàn riêng 2–6 người, lời mời, rời đoàn, chuyển quyền.
- [ ] Đóng góp bất đồng bộ, sổ tiến độ chống ghi trùng.
- [ ] Hỗ trợ tập trung, phân loại khoảng rời app, mất lực kéo, nối lại toa.
- [ ] Quiz hiện tại và phần thưởng riêng.
- [ ] Nhật ký đoàn, trạng thái quyền riêng tư.
- [ ] Lưu offline, đồng bộ lại, hiển thị phần chờ xác nhận.

MVP có ảnh hưởng tập thể qua phần đóng góp bị tạm dừng. Chưa quảng bá việc đoàn giảm tốc thời gian thực.

### 11.2. Mốc tiếp theo: đồng hành trực tiếp

- [ ] Phòng chờ và khởi hành chung.
- [ ] Trạng thái toa cập nhật theo sự kiện.
- [ ] Thưởng phối hợp và quyết toán khoảng chưa rõ.
- [ ] Tín hiệu hỗ trợ có giới hạn.
- [ ] Nhật ký nối lại ở dạng tổng hợp, theo quyền riêng tư.

### 11.3. Mở rộng

- [ ] Thử thách phối hợp tự nguyện.
- [ ] Nhiều vùng, tuyến phụ và bộ sưu tập.
- [ ] Trạm ôn tập cá nhân dựa trên kết quả học.
- [ ] Nghiên cứu native để xác định/chặn app trên từng nền tảng.
- [ ] Thông báo lời mời và lịch khởi hành theo cài đặt người dùng.

Chưa đưa vào bản đầu: ghép nhóm công khai, chat tự do, thế giới 3D, chợ vật phẩm, bảng xếp hạng lỗi, kinh tế nhiều tiền tệ.

## 12. Nền tảng hiện có và khoảng trống

| Phần hiện có | File | Cách phát triển |
| --- | --- | --- |
| Đặt mục tiêu, tài liệu | `src/app/index.tsx` | Giữ luồng học, thêm ngữ cảnh vé và hành trình |
| Chọn app, đặt thời gian | `src/app/app-blocker-setup.tsx`, `src/app/timer-setup.tsx` | Giải thích năng lực thật, gắn chế độ chuyến |
| Timer và cảnh báo | `src/app/focus-timer.tsx` | Gắn trạng thái toa và phân loại gián đoạn |
| Quan sát rời app | `src/hooks/useDistractionMonitor.ts` | Tách quan sát thô khỏi kết luận xao nhãng |
| Đồng hồ | `src/utils/focusClock.ts` | Mở rộng sổ khoảng học, nghỉ, pending và phục hồi |
| Realtime cá nhân | `src/hooks/useSessionRealtime.ts`, `backend/src/realtime.ts` | Thêm sự kiện có định danh, phòng chuyến, đồng bộ snapshot |
| Phiên học và người dùng | `src/services/contracts.ts`, `backend/prisma/schema.prisma` | Thêm quan hệ toa, đoàn, hành trình và đóng góp |
| Quiz, tổng kết, lịch sử | `src/app/quiz.tsx`, `src/app/session-summary.tsx`, `src/app/history.tsx` | Gắn thành quả và nhật ký khám phá |

Backend hiện dùng Fastify, Prisma/PostgreSQL và Redis. Realtime hiện là vòng đời phiên cá nhân; chưa có phòng đoàn hoặc mô hình thành viên.

Timer backend hiện dùng deadline, trong khi client có thông tin pause. Cần thống nhất cách quyết toán thời gian trước khi dùng timer làm nguồn tiến độ nhóm; không lấy một tín hiệu `session:complete` làm bằng chứng toàn bộ thời gian đã tập trung.

## 13. Kiến trúc đề xuất

### 13.1. Trách nhiệm

- Client: hiển thị, ghi sự kiện quan sát, phân loại theo người dùng, lưu hàng đợi offline.
- Máy chủ: xác thực thành viên, áp dụng quy tắc, quyết toán tiến độ, cấp thưởng và mở trạm.
- PostgreSQL: lưu trạng thái bền vững, sự kiện, đóng góp, phần thưởng.
- Redis: presence, phòng chuyến, cache và phát sự kiện; không là nơi duy nhất giữ tiến độ.
- Tách hiển thị đồng hồ khỏi việc ghi sổ; không gửi một request mỗi giây.

Mọi tính toán có `rules_version`; một chuyến giữ nguyên phiên bản quy tắc đã bắt đầu.

### 13.2. Tổ chức code dự kiến

- `src/app/`: các route cho ga, toa, bản đồ, đoàn, lời mời và phòng chờ.
- `src/components/train/`: toa, đoàn, trạng thái, cửa sổ cảnh quan.
- `src/components/adventure/`: trạm, bản đồ, thẻ nhiệm vụ, nhật ký.
- `src/services/`: hợp đồng API, đồng bộ và hàng đợi sự kiện.
- `src/store/`: trạng thái hành trình và snapshot đoàn; tránh gộp tất cả vào setup store.
- `src/utils/`: hàm thuần tính khoảng học, tiến độ và chuyển trạng thái.
- Backend: module đoàn, hành trình, phiên trực tiếp, sổ đóng góp và thưởng.

Đây là cấu trúc đề xuất, không phải cam kết thêm từng file ngay lập tức.

## 14. Mô hình dữ liệu đề xuất

| Entity | Trường/quan hệ chính | Ràng buộc |
| --- | --- | --- |
| Carriage | `id`, `user_id`, tên, giao diện | Một toa chính/user |
| ExpeditionGroup | Chủ đoàn, tên, múi giờ, trạng thái | Tối đa 6 thành viên đang hoạt động |
| GroupMembership | Đoàn, user, vai trò, thời điểm vào/rời | Một đoàn hoạt động/user ở MVP |
| GroupInvite | Hash token, hạn, người tạo, trạng thái | Có thu hồi; kiểm tra sức chứa khi dùng |
| RouteDefinition / StationDefinition | Nội dung, tuyến, ngưỡng, phiên bản | Nội dung có version |
| Journey | Chủ thể cá nhân hoặc đoàn, tuyến, chặng, ngưỡng | Chính xác một loại chủ thể |
| LiveTrip / TripParticipant | Journey, giờ, người, thời lượng, consent | Một phiên học hoạt động/user |
| FocusInterval | Session, bắt đầu/kết thúc, phân loại, nguồn | Khoảng không chồng lặp |
| DistractionObservation | Event ID, nguồn, nguyên nhân, độ rõ, xử lý | Quan sát chưa rõ không tự thành vi phạm |
| ContributionLedger | User, session, journey, đơn vị, rules version | Khóa idempotency; một khoảng ghi một lần |
| RewardGrant | User/đoàn, phần thưởng, nguồn | Duy nhất theo nguồn và loại thưởng |
| JourneyEvent | Journey, thứ tự, loại, payload công khai | Không chứa tên app/tài liệu riêng |
| RouteVote | Journey, ngã rẽ, user, lựa chọn | Một phiếu hiện hành/user/ngã rẽ |
| SupportSignal | Chuyến, người gửi/nhận, mẫu, thời điểm | Rate limit và quyền nhận |

Mở rộng StudySession bằng ngữ cảnh hành trình, chuyến trực tiếp và phiên bản quy tắc; giữ các trường cũ để tương thích. Các ràng buộc “một đoàn/phiên hoạt động” phải được đảm bảo ở DB hoặc giao dịch phù hợp, không chỉ kiểm tra trên UI.

## 15. API và sự kiện dự kiến

### 15.1. Nhóm API

| Nhóm | Nghiệp vụ |
| --- | --- |
| Toa | Xem, cập nhật trang trí và quyền chia sẻ |
| Đoàn | Tạo, xem, mời, gia nhập, rời, chuyển quyền |
| Hành trình | Xem snapshot, nhiệm vụ, nhật ký, bỏ phiếu |
| Phiên học | Bắt đầu, thêm sự kiện, phân loại khoảng, nghỉ, kết thúc |
| Chuyến trực tiếp | Tạo, vào, sẵn sàng, khởi hành, rời |
| Hỗ trợ | Gửi tín hiệu mẫu theo quyền và giới hạn |

### 15.2. Hợp đồng realtime

Sự kiện đề xuất: `trip:snapshot`, `trip:started`, `carriage:state_changed`, `journey:progress_updated`, `station:unlocked`, `support:received`, `trip:ended`.

Mỗi sự kiện chứa `event_id`, `aggregate_id`, `sequence`, `server_time`, `schema_version`. Command từ client có `command_id` để chống retry trùng.

- Xác thực quyền khi vào phòng và khi thực hiện command.
- Client bỏ qua sự kiện cũ; khi sequence bị thiếu thì tải snapshot.
- UI được dự báo tiến độ riêng; tiến độ nhóm phải phân biệt “đã xác nhận” và “đang đồng bộ”.
- Ghi ledger, mở trạm và cấp thưởng trong giao dịch; phát sự kiện sau commit bằng outbox hoặc cơ chế tương đương.
- Khi có nhiều backend instance, cần fan-out liên instance; không chỉ giữ danh sách socket trong một process.
- Hết hạn token, rời đoàn hoặc bị thu hồi quyền phải ngừng nhận sự kiện phòng.

## 16. Offline, đồng bộ và độ tin cậy

- Timer dùng thời điểm và sổ khoảng đã lưu, không phụ thuộc số lần render hoặc tick mạng.
- Hàng đợi sự kiện có định danh duy nhất và thứ tự; retry không cấp trùng.
- Khi restart, phục hồi phiên và yêu cầu phân loại khoảng chưa rõ nếu cần.
- Offline vẫn học cá nhân; đóng góp nhóm hiển thị pending cho đến quyết toán.
- Mất heartbeat không đồng nghĩa xao nhãng. Không gửi cảnh báo có tên người chỉ vì socket rớt.
- Chuyến trực tiếp treo phần bonus thiếu dữ liệu; đặt cửa sổ quyết toán đề xuất 24 giờ. Sau đó bonus không xác minh được sẽ không cấp, nhưng giữ đóng góp cơ bản đã được chấp nhận.
- Client không tự khai báo tổng điểm cuối cùng; máy chủ tính từ khoảng hợp lệ, kiểm tra chồng phiên, giới hạn thời gian và ngày đóng góp.
- Đồng hồ thiết bị thay đổi, sự kiện đến trễ hoặc thứ tự sai phải được đối soát; bằng chứng client vẫn có giới hạn tin cậy.
- Không quảng bá “chống gian lận tuyệt đối” khi MVP dựa vào tự khai báo.

## 17. Nghiên cứu khả năng chặn app

Đây là hạng mục nghiên cứu riêng, không phải điều kiện để xây thế giới tàu hoặc nhóm bất đồng bộ.

Mỗi nền tảng phải có bản thử trên thiết bị thật, xác minh:

1. Có xác định được ứng dụng đã chọn không?
2. Có thực sự ngăn mở/sử dụng, hay chỉ ghi nhận và nhắc?
3. Cần quyền, entitlement, extension hoặc native module nào?
4. Hoạt động thế nào khi khóa màn hình, cuộc gọi, restart, quyền bị thu hồi?
5. Có phù hợp quy định phân phối và nền tảng mục tiêu không?
6. Sự kiện trả về có đủ chính xác để ảnh hưởng nhóm không?

Chưa chọn thư viện hoặc cam kết cơ chế native cụ thể trong kế hoạch này. Cần đọc tài liệu nền tảng chính thức khi thực hiện spike.

Project hiện dùng Expo SDK 57. Trước khi viết code Expo/React Native phải đọc tài liệu khớp phiên bản. Native behavior đi qua cấu hình/config plugin theo AGENTS.md; module native bổ sung cần development build phù hợp thay vì mặc định dựa vào Expo Go.

Nguồn nền tảng đã đối chiếu khi lập plan:

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).
- [Expo documentation index và các lưu ý cho LLM](https://docs.expo.dev/llms.txt).
- Quy tắc dự án tại `AGENTS.md`.

## 18. Quyền riêng tư và quản trị nhóm

- Mặc định chia sẻ: tên toa, trang trí công khai và thành quả chung.
- Riêng tư: tài liệu, danh sách app chọn, log app, điểm quiz và chi tiết xao nhãng.
- Trạng thái phiên có tên cần lựa chọn chia sẻ riêng; việc gia nhập đoàn không tự cấp quyền xem toàn bộ.
- Consent cho tác động tập thể được lưu theo chuyến và phiên bản quy tắc.
- Không cho chủ đoàn ép bật theo dõi hoặc thay đổi quy tắc giữa chuyến.
- Nhật ký chung chỉ ghi sự kiện cần thiết, ưu tiên số liệu tổng hợp.
- Khi rời/xóa tài khoản: ngừng quyền truy cập, xử lý dữ liệu riêng; có thể giữ tổng tiến độ vô danh để đoàn không mất thành quả.
- Thời hạn lưu log quan sát và cơ chế xóa cần chốt trước phát hành; không lưu vô thời hạn mặc định.

## 19. Đo lường

| Chỉ số | Cách đo | Mục đích |
| --- | --- | --- |
| Hoàn thành phiên đầu | User hoàn thành focus / user bắt đầu | Đánh giá onboarding |
| Phút tập trung hợp lệ | Tổng thời gian sau phân loại | Đo giá trị học thực tế |
| Tỷ lệ nối lại | Sự cố xác nhận quay lại / sự cố xác nhận | Đánh giá phục hồi |
| Thời gian quay lại | Từ sự cố tới bắt đầu tập trung lại | Kiểm tra tác dụng lời nhắc |
| Tỷ lệ nhận diện sai | Khoảng chờ được xác nhận là học hợp lệ | Điều chỉnh phát hiện |
| Nhóm có hoạt động | Đoàn có ít nhất 2 người đóng góp/tuần | Đo giá trị đồng hành |
| Quay lại D7 | User học lại sau 7 ngày theo cohort | Đo duy trì |
| Tỷ lệ rời nhóm | Thành viên rời / thành viên hoạt động | Theo dõi áp lực xã hội |
| Tỷ lệ tắt tác động nhóm | User tắt hoặc chuyển chế độ | Đánh giá mức thoải mái |
| Sai lệch quyết toán | Trùng thưởng, sai ledger, pending quá hạn | Theo dõi độ tin cậy |

Không coi thời gian mở app hay số lần xem đồ trang trí là thành công học tập. Mục tiêu số cụ thể cần đặt sau khi có baseline; phân tách cohort cá nhân, nhóm và mức xác định sự kiện.

## 20. Lộ trình triển khai theo điều kiện hoàn thành

### Giai đoạn A — Chốt luật và thiết kế

- [ ] Chốt từ vựng, phạm vi, các công thức và quyền riêng tư.
- [ ] Wireframe ga, toa, vé, phiên học, nối toa, tổng kết và đoàn.
- [ ] Prototype một phiên cá nhân và một chuyến có xao nhãng.
- [ ] Kiểm tra người dùng có hiểu ảnh hưởng nhóm và phân biệt gián đoạn hợp lệ.

**Điều kiện qua mốc:** luồng hiểu được trên điện thoại, mọi chuyển trạng thái có kết quả xác định, không còn mơ hồ về năng lực chặn app.

### Giai đoạn B — Nền tảng cá nhân

- [ ] Tách quan sát rời app khỏi xao nhãng xác nhận.
- [ ] Xây sổ khoảng thời gian và phục hồi sau restart.
- [ ] Thêm toa, tuyến đầu, trạng thái mất lực kéo/nối lại.
- [ ] Gắn quiz và tổng kết; giữ tương thích lịch sử cũ.

**Điều kiện qua mốc:** không mất thời gian hợp lệ, không tính nhầm khoảng nghỉ, dùng được offline.

### Giai đoạn C — MVP nhóm bất đồng bộ

- [ ] Migration các entity đoàn, journey, ledger và reward.
- [ ] API lời mời, thành viên, đóng góp, nhật ký và bỏ phiếu.
- [ ] UI đoàn và snapshot tiến độ; xử lý retry, concurrent updates.
- [ ] Kiểm tra quyền riêng tư và chuyển cá nhân/nhóm.

**Điều kiện qua mốc:** nhóm nhỏ có thể hoàn tất tuyến; không cấp trùng hoặc lộ dữ liệu riêng.

### Giai đoạn D — Trực tiếp và ảnh hưởng tập thể

- [ ] Phòng chờ, lifecycle chuyến, fan-out realtime.
- [ ] Nhịp phối hợp, trạng thái chưa rõ và quyết toán bonus.
- [ ] Tín hiệu hỗ trợ, consent và giới hạn gửi.
- [ ] Kiểm thử nhiều thiết bị, background, mất mạng và reconnect.

**Điều kiện qua mốc:** một người xao nhãng chỉ ảnh hưởng phần phối hợp theo luật; mất mạng không gây kết luận sai.

### Giai đoạn E — Thử nghiệm và mở rộng

- [ ] Pilot các nhóm quen nhau; thu phản hồi áp lực, công bằng và động lực.
- [ ] Điều chỉnh ngưỡng trạm, thời gian nối và bonus bằng cấu hình có version.
- [ ] Quyết định thử thách phối hợp và đầu tư spike native.

Không ấn định lịch trước khi chốt thiết kế và năng lực theo dõi nền tảng. Có thể ước lượng từng giai đoạn sau khi phân rã ticket.

## 21. Kiểm thử và tiêu chí nghiệm thu

### 21.1. Tình huống quan trọng

| Tình huống | Kết quả mong đợi |
| --- | --- |
| Hoàn thành cá nhân | Cấp đúng kinh nghiệm và tiến độ, lưu quiz riêng |
| Hai người đóng góp đồng thời | Tổng ledger đúng; trạm mở đúng một lần |
| Retry kết thúc phiên | Không tăng điểm/thưởng lần hai |
| Rời app để đọc tài liệu | Chờ phân loại; không tự gây lỗi nhóm |
| Xao nhãng được xác nhận | Loại đúng khoảng, vào mất lực kéo |
| Nối lại 120 giây | Tính thời gian học, phục hồi trạng thái đúng |
| Xao nhãng khi đang nối | Reset bộ đếm nối, giữ phần đã học |
| Mất mạng/restart | Phục hồi, không gán lỗi, đồng bộ không trùng |
| Một người xao nhãng trực tiếp | Giữ base người khác; chỉ giảm bonus theo công thức |
| Nghỉ/kết thúc hợp lệ | Loại khỏi mẫu số phối hợp |
| Quiz không tải được | Vẫn lưu phiên và đóng góp cơ bản |
| Rời đoàn/chủ đoàn rời | Giữ toa, đóng góp cũ, chuyển quyền đúng |
| Dùng lời mời hết hạn/đoàn đầy | Từ chối an toàn, không vượt giới hạn |
| Truy cập journey người khác | Không đọc/sửa nếu thiếu quyền |
| Giả sự kiện native hoặc mô phỏng | Không được tự nâng độ tin cậy/cấp thưởng thật |
| Thay đổi đồng hồ hoặc gửi khoảng chồng | Đối soát/từ chối phần không hợp lệ |
| Qua ngày theo múi giờ đoàn | Áp dụng cap một lần theo ngày đúng |

### 21.2. Hình thức kiểm chứng

- Unit test cho máy trạng thái, sổ khoảng, cap, bonus và idempotency.
- Integration test cho membership, transaction ledger, thưởng và quyền phòng realtime.
- Kiểm tra thủ công trên Android/iOS thật cho background, cuộc gọi, tài liệu, restart và quyền.
- Kiểm tra giao diện màn hình nhỏ, giảm chuyển động và trình đọc màn hình.
- Chạy lint và typecheck theo AGENTS.md trước mỗi mốc code; bổ sung test backend/mobile phù hợp thay đổi.
- Test tải tập trung vào socket, fan-out và cập nhật đồng thời khi đã có lượng người thử dự kiến.

## 22. Rủi ro và hướng xử lý

| Rủi ro | Hướng xử lý |
| --- | --- |
| Nhận diện sai xao nhãng | Pending, phân loại và phân biệt nguồn sự kiện |
| Áp lực đổ lỗi trong nhóm | Ẩn danh mặc định, chỉ ảnh hưởng bonus, có nghỉ hợp lệ |
| Một người kéo cả đoàn | Cap đóng góp, ngưỡng theo nhóm và các mảnh khám phá đa dạng |
| Nhóm không hoạt động | Học cá nhân đầy đủ, rời đoàn dễ, không mất toa |
| Trang trí chiếm thời gian học | Trang trí sau phiên, không có thao tác liên tục trong timer |
| Phụ thuộc native làm chậm sản phẩm | Ra hỗ trợ tập trung trước, spike native độc lập |
| Trùng/sai tiến độ khi offline | Ledger, khóa duy nhất, transaction và snapshot |
| Nội dung thế giới tốn công | Tuyến ngắn, biến thể cảnh quan, nội dung biên soạn |
| Animation hao pin | Cảnh nhẹ, giảm chuyển động, dừng animation khi không hiển thị |

## 23. Các quyết định cần chốt trước triển khai

1. Phong cách hình ảnh: minh họa 2D, pixel hoặc tối giản; ưu tiên bản dễ đọc trên điện thoại.
2. Có giữ tên “Đoàn tàu viễn du” hay đặt thương hiệu khác?
3. MVP chỉ bất đồng bộ hay thêm trực tiếp ngay? Đề xuất phát hành theo hai mốc.
4. Chấp nhận tự khai báo ở chế độ hỗ trợ thế nào? Đề xuất có, ghi rõ nguồn, chưa làm thi đấu.
5. Có giữ thời gian nối 120 giây, cap 60 đơn vị/ngày và bonus tối đa 20%? Đây là thông số thử nghiệm.
6. Chính sách lưu/xóa log và chia sẻ trạng thái có tên.
7. Nền tảng ưu tiên cho nghiên cứu chặn app thực sự.

## 24. Checklist hoàn thành sản phẩm

- [ ] Một người có thể bắt đầu, gián đoạn, quay lại, hoàn thành và khám phá trạm mới.
- [ ] Nhóm 2–6 người có thể đóng góp khác giờ và khác môn.
- [ ] Toa cá nhân giữ nguyên khi đổi/rời đoàn.
- [ ] Xao nhãng ảnh hưởng đúng chế độ, mức xác định và consent.
- [ ] Công sức người khác và tiến độ đã đạt không bị xóa.
- [ ] Mạng yếu, restart và retry không làm mất hoặc nhân đôi thành quả.
- [ ] Quiz hỗ trợ hiểu bài và không trở thành hình phạt xã hội.
- [ ] Người dùng hiểu rõ app đang nhắc, theo dõi hay thực sự chặn.
- [ ] Lint, typecheck và các kiểm thử nghiệp vụ liên quan đạt trước phát hành.
