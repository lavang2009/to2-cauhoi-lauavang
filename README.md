# Tổ 2 — Địa lí 12: Lũ lụt & Lũ quét

Website trình chiếu tương tác Next.js, thiết kế theo màu sắc logo Tổ 2.

## Chạy ở máy cá nhân
1. Cài Node.js LTS (khuyến nghị Node 20 hoặc 22).
2. Giải nén thư mục.
3. Mở terminal tại thư mục dự án và chạy:
   ```bash
   npm install
   npm run dev
   ```
4. Mở http://localhost:3000

## Deploy lên Vercel
1. Đưa toàn bộ nội dung thư mục lên một GitHub repository.
2. Vào Vercel → Add New → Project → import repository.
3. Framework preset: Next.js; Build command `npm run build`; Output directory để mặc định.
4. Nhấn Deploy.

Không cần biến môi trường. Âm báo đúng/sai được tạo bằng Web Audio API trong trình duyệt, không tải tệp âm thanh bên ngoài.

## Điều khiển trình chiếu
- Nút TRƯỚC / TIẾP ở thanh dưới.
- Phím `←` / `→`, `PageUp` / `PageDown`, phím cách.
- Phím `F` hoặc nút Toàn màn hình.
- Nút Âm thanh để bật/tắt âm báo.
- Chọn phương án rồi nhấn Kiểm tra đáp án để xem dấu đúng/sai và giải thích.
