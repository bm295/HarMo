# Nông trại của bạn

Tài liệu này ghi lại mô tả nghiệp vụ cơ bản về mảnh đất và các khu vực chức năng mà người chơi sở hữu trong game.

## 1. Mảnh đất ban đầu

Người chơi sở hữu một mảnh đất ngay từ đầu game. Khi bắt đầu, khu đất chưa có nhiều thứ, nhưng đã có sẵn các khu vực và công trình cơ bản sau:

- 1 căn nhà nhỏ, là nơi người chơi sinh sống.
- 1 chuồng gà.
- 1 chuồng bò và cừu.
- 1 chuồng nhỏ dành cho con ngựa của người chơi.
- 1 ao cá.
- 1 nơi chứa gỗ.
- 1 khoảng vườn rộng để trồng trọt.

## 2. Các vật dụng trong nhà

Trong căn nhà ban đầu, người chơi có sẵn các vật dụng sau:

- 1 chiếc giường.
- 1 kệ sách.
- 1 thùng đựng dụng cụ.
- 1 cái tivi.
- 1 cuốn nhật ký.

### 2.1. Chiếc giường

- Dùng để ngủ.
- Sau khi nâng cấp nhà lên cấp 3, người chơi sẽ có thêm 1 giường đôi cho vợ và con trai.

### 2.2. Kệ sách

- Dùng để thay đổi các nút điều khiển mặc định của game nếu người chơi không thích cấu hình mặc định.

### 2.3. Cuốn nhật ký

- Dùng để lưu trò chơi khi người chơi muốn dừng lại.
- Trong tài liệu gốc có ghi chú rằng tính năng này không quá quan trọng khi chơi bằng chương trình giả lập.

### 2.4. Nhà bếp

- Sau khi nâng cấp nhà lên cấp 3, người chơi sẽ có thêm nhà bếp.
- Người chơi có thể nấu ăn tại đây.

### 2.5. Tivi

- Dùng để xem thông tin trong game.
- Người chơi có thể xem:
  - Dự báo thời tiết.
  - Thông báo các sự kiện quan trọng.
  - Chương trình Shopping Channel phát vào ngày thứ Bảy hằng tuần để mua đồ.

### 2.6. Thùng dụng cụ

- Dùng để đựng dụng cụ lao động, hạt giống và một số vật phẩm khác.
- Khi bắt đầu game, toàn bộ dụng cụ lao động của người chơi nằm trong thùng này.

## 3. Chuồng gà

- Người chơi có thể nuôi 5 hoặc 10 con gà trong chuồng này.
- Sau khi nâng cấp chuồng, số lượng gà có thể nuôi tăng lên 10 con.
- Trong chuồng có nhiều máng ăn để chứa thức ăn cho gà.
- Thức ăn cho gà có thể mua tại trại gà (Poultry Farm).
- Nếu trại gà đóng cửa mà người chơi hết thức ăn, có thể dùng ngô (corn) để làm thức ăn thay thế.
- Tỷ lệ quy đổi: 1 quả ngô tương đương 10 phần thức ăn cho gà.

## 4. Chuồng bò và cừu

- Chuồng có thể nuôi tổng cộng tối đa 10 con bò và cừu. Sau khi nâng cấp, sức chứa tăng lên 20 con.
- Trong chuồng có các máng để đựng thức ăn cho bò và cừu.
- Người chơi có thể mua thức ăn cho bò tại trại bò Green Ranch và cho thức ăn vào máng.
- Người chơi cũng có thể mua hạt giống cỏ ở siêu thị, trồng và thu hoạch cỏ để làm thức ăn cho bò và cừu.

## 5. Chuồng ngựa

- Vào mùa đông đầu tiên, người chơi nhận được một con ngựa.
- Chuồng là nơi trú cho ngựa, đặc biệt khi trời mưa.

## 6. Ao cá

- Người chơi có thể nuôi cá trong ao.
- Thức ăn cho cá được bán tại siêu thị.
- Người chơi có thể lấy nước từ ao để đổ vào bình tưới cây.

## 7. Nhà chứa gỗ và hàng rào

- Nhà chứa gỗ dùng để cất số gỗ người chơi thu được. Người chơi bấm phím `X` để cất gỗ vào đây.
- Gỗ trong nhà chứa có thể dùng để xây hàng rào.
- Khi thả bò, cừu hoặc gà ra ngoài, hàng rào giúp bảo vệ chúng khỏi chó hoang.

## 8. Yêu cầu sẵn sàng cho TDD

### RQ-FARM-001: Mở khóa khu sinh hoạt gia đình khi nhà đạt cấp 3

- **Mục tiêu nghiệp vụ:** Khi người chơi nâng cấp nhà lên cấp 3, căn nhà phải phản ánh đúng giai đoạn sinh hoạt gia đình đầy đủ hơn.
- **Actor / workflow:** Người chơi vào nhà, mở menu nâng cấp và hoàn tất nâng cấp nhà lên cấp 3.
- **Tiền điều kiện:** Nhà đang ở cấp 2 hoặc thấp hơn; người chơi có đủ tiền và gỗ để nâng cấp.
- **Hành vi mong đợi:**
  - Sau khi nâng cấp thành công, nhà phải hiển thị thêm giường đôi cho vợ và con trai.
  - Nhà phải mở khóa khu bếp để người chơi có thể nấu ăn.
- **Hành vi lỗi:**
  - Nếu chưa đủ tiền hoặc gỗ thì không được nâng cấp.
  - Nếu nhà chưa đạt cấp 3 thì khu bếp vẫn phải bị khóa.
- **Biên / ranh giới:**
  - Cấp 1 và cấp 2 không được hiển thị giường đôi hoặc nhà bếp.
  - Cấp 3 là mức tối đa cho luồng này.
- **Tiêu chí chấp nhận:**
  - Khi nhà cấp 3, trong nhà phải có giường đôi và nút vào nhà bếp.
  - Khi nhà dưới cấp 3, các mục này phải không xuất hiện.
  - Thử mở bếp khi nhà chưa cấp 3 phải bị chặn.
- **Bằng chứng nguồn:**
  - Tài liệu gốc do người dùng cung cấp trong cuộc trao đổi này.
  - Code hiện tại đã có các dấu hiệu tương ứng trong giao diện nhà và kiểm thử.
- **Khu vực code dự kiến:** `src/app/app.component.ts`, `src/app/app.component.html`, `src/app/app.component.spec.ts`
- **Kịch bản test đầu tiên:** Kiểm tra rằng nhà cấp 3 hiển thị giường đôi và bếp, còn nhà cấp 1 không hiển thị chúng.
- **Trạng thái:** `READY_FOR_TDD`
