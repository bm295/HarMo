# Mộc Lan Farm Story

Web game nông trại viết hoàn toàn bằng Angular, lấy cảm hứng từ dòng game nông trại nhập vai cổ điển. Người chơi cuốc đất, gieo hạt, tưới cây, thu hoạch, giao lưu với dân làng và khôi phục nông trại qua từng mùa.

## Chạy dự án

```bash
npm install
npm start
```

Mở `http://localhost:4200`.

## Cách chơi

1. Chọn **Cuốc**, sau đó bấm vào ô đất trống.
2. Chọn **Hạt củ cải** để gieo và **Bình tưới** để tưới mỗi ngày.
3. Chọn **Đi ngủ** để sang ngày. Cây trưởng thành sau ba lần được tưới.
4. Chọn **Tay không** để thu hoạch, sau đó bấm **Thùng hàng** để bán.
5. Dùng **Rìu** chặt gỗ, ghé cửa hàng mua hạt và trò chuyện với Ellie.

## Căn nhà

Bấm vào căn nhà ngoài nông trại để bước vào không gian sinh hoạt:

- **Giường đơn** giúp ngủ qua đêm, hồi thể lực và chuyển sang ngày mới.
- **Kệ sách** đổi giữa ba bộ phím điều khiển; lựa chọn được lưu cùng tiến trình.
- **Nhật ký** lưu và tải nhanh một ô save ngay trong trình duyệt.
- **Tivi** phát dự báo ngày mai, lịch lễ hội và Shopping Channel vào mỗi Thứ Bảy.
- **Thùng dụng cụ** cất toàn bộ công cụ, hạt giống và tài nguyên ban đầu.
- Nâng nhà lên **cấp 3** để mở khóa nhà bếp, giường đôi và góc gia đình.

Muốn nâng cấp nhà, hãy tích lũy tiền và gỗ rồi chọn **Nâng cấp** trên bảng trong nhà.

## Lưu và tải game

Mở **cuốn nhật ký** trong nhà để lưu nhanh vào trình duyệt. Ngoài ra, menu `☰` cho phép:

- **Lưu game xuống máy** tải một file `.save.json` về ổ cứng.
- **Tải file save** đọc lại file đã lưu, không cần máy chủ hay tài khoản.

Toàn bộ tiến trình nằm trong file JSON; trình duyệt không tự động tải dữ liệu lên mạng.


## Ellie · AI Lab

Bấm **Trò chuyện Ellie · AI Lab** ở nông trại để đếm token, xem context, so sánh tìm kiếm embeddings với từ khóa và hỏi Ellie dựa trên trạng thái hiện tại. Phần AI chỉ tư vấn, không thay đổi luật hay tiến trình game.

Cài thêm `npm ci --prefix server`, chép `server/.env.example` thành `server/.env`, chạy `npm run server` trong terminal riêng rồi `npm start`. Điền `OPENAI_API_KEY` trên server nếu muốn gọi embeddings và model thật (có phí). Tokenizer và xem context dùng được không cần key. Yêu cầu Node.js >=20.12.

Xem [hướng dẫn và bài thực hành AI](docs/ai-fundamentals.md). Kiểm tra backend bằng `npm run test:ai`.
