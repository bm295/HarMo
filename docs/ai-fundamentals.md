# Ellie AI Lab: tokens, context window, embeddings và inference

## Chạy

Yêu cầu Node.js >=20.12. Ở thư mục gốc:

```bash
npm ci
npm ci --prefix server
cp server/.env.example server/.env
npm run server
```

Mở terminal khác và chạy `npm start`, truy cập http://localhost:4200 rồi chọn **Trò chuyện Ellie · AI Lab** ở nông trại. Đếm token và xem context chạy không cần key. Để dùng **Hỏi Ellie**, điền `OPENAI_API_KEY` trong `server/.env`, khởi động lại server. Key chỉ ở backend; không đưa vào Angular, save game hay git. Mỗi lần Hỏi Ellie có thể phát sinh phí embeddings và sinh văn bản.

Model sinh cố định `gpt-4o-mini`, tokenizer `o200k_base` qua js-tiktoken; embedding model `text-embedding-3-small`. Nếu đổi model cần kiểm tra lại tokenizer, giới hạn và tham số, không chỉ sửa tên. Server bind loopback, giới hạn request 64 KiB và 4 request đồng thời; đây là môi trường học local. Trước khi cung cấp qua Internet cần xác thực, hạn mức theo người dùng và cấu hình origin/reverse proxy phù hợp.

## 1. Tokens

Nhập lần lượt `Hello farm`, `Ngày mai mưa`, `🌧️🌱` và bấm Đếm token. Quan sát ID và số token; không suy ra số token từ số từ hay số ký tự. Mỗi token hiển thị riêng có thể xuất hiện ký tự thay thế vì một ký tự Unicode có thể trải qua nhiều token; ghép toàn bộ ID và decode sẽ khôi phục đúng văn bản gốc.

Tokenizer phân tích câu nhập là thật. Ước lượng token của toàn bộ chat gồm số token nội dung cộng dự phòng framing; không phải bộ đếm billing chính xác. Usage từ provider sau inference là số đo thực tế để đối chiếu.

## 2. Context window

Hỏi vài lượt, sau đó giảm ngân sách từ 2048 xuống 1024 hoặc 512. Xem danh sách messages và số tin bị loại. Ngân sách thử nghiệm tối đa 8192 trong app không phải context window tối đa của model.

Bộ dựng giữ chỉ dẫn, snapshot hiện tại và câu hỏi; dành trước output budget; thêm tài liệu theo thứ hạng, sau đó các cặp hội thoại mới nhất vừa chỗ. Lịch sử cũ bị bỏ theo cặp user/assistant, không cắt giữa câu hay giữ câu trả lời thiếu câu hỏi. Nếu phần bắt buộc đã quá lớn, API trả 400 để người dùng chỉnh ngân sách. Không có tóm tắt lịch sử tự động. Màn hình giữ tối đa 40 tin trong bộ nhớ; đóng Lab sẽ xóa hội thoại. Không lưu chat vào file save.

**Xem context** không gọi embedding/inference nên chỉ dựng chỉ dẫn + snapshot + lịch sử + câu hỏi; kết quả Hỏi Ellie có thêm tài liệu truy xuất, và có thể giữ được ít lịch sử hơn. Màn hình hiển thị đúng messages dùng trong từng luồng.

## 3. Embeddings

Hỏi `Cây khô thì làm sao?` hoặc `Tôi mệt quá rồi`. So sánh thứ hạng semantic với số từ trùng. Tài liệu nhỏ gồm 5 đoạn theo chủ đề từ luật game hiện có; mỗi đoạn là một chunk. Server tạo vector bằng model embeddings thật, cache index trong bộ nhớ tới khi restart; query được embed bằng cùng model và so cosine. Không dùng vector giả hoặc gọi số đếm từ là embeddings.

Ba tài liệu gần nhất là ứng viên; xem nhãn tài liệu nào thực sự vừa context. Cosine không phải độ tin cậy/xác suất. Với dữ liệu ít chưa cần vector database. Index không được dùng để lưu hội thoại hay trạng thái game. Tập tài liệu cần cập nhật cùng luật game.

## 4. Inference

Hỏi `Ngày mai mưa, hôm nay tôi nên làm gì?` khi hôm nay nắng và còn cây chưa tưới. Ellie phải phân biệt thời tiết hiện tại và dự báo; mưa ngày mai không thay tưới hôm nay. Đối chiếu snapshot và đoạn crops trong context. Model có thể sai, luật game vẫn là nguồn quyết định.

Thử output budget 64 rồi 256; quan sát finish reason `length` nếu câu trả lời bị cắt. Thử temperature 0 và 1 với cùng context (xóa hội thoại giữa các lần); temperature không bảo đảm độ đúng và giá trị 0 không bảo đảm đầu ra giống hệt. Thời gian hiển thị là toàn bộ retrieval + inference, gồm mạng và lượt tạo index đầu tiên, không phải riêng tốc độ sinh token. Không có streaming hoặc đo time-to-first-token ở bản này.

Inference dùng model đã huấn luyện để sinh kết quả; không phải training. Việc giữ history trong request giúp model thấy cuộc hội thoại ở lượt đó, không tự cập nhật trọng số model.

## API và kiểm thử

- POST `/api/ai/tokenize`: `{ "text": "Ngày mai mưa" }`.
- POST `/api/ai/preview`: `{ question, state, history, contextBudget, outputBudget, temperature }`, không gọi provider.
- POST `/api/ai/chat`: cùng payload, có embeddings + inference thật. Thiếu key trả 503, không fallback sang câu thoại giả.
- `state` là snapshot allowlist do Angular dựng; không gửi tên người chơi hay toàn bộ save. Backend kiểm tra kiểu dữ liệu và độ dài, không tin lời client để thay đổi game.
- API từ model dùng văn bản thuần; Angular render qua interpolation, không thực thi HTML hay lệnh game.
- `npm run test:ai`: tokenizer, budget, complete pairs, vectors, provider contract, HTTP, validation, không sửa game. Tests dùng provider stub, không tiêu tiền và không xác nhận chất lượng model thật.
- `npm run build`; `npm test -- --watch=false --browsers=ChromeHeadless`: kiểm tra Angular và regression game.

Tham khảo API: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create và https://developers.openai.com/api/reference/resources/embeddings/methods/create.
