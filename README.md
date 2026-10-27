# Tổ 2 — Địa lí 12: Lũ lụt & Lũ quét

Website trình chiếu tương tác Next.js, thiết kế theo màu sắc logo Tổ 2.

## Ghi chú bảo mật
- Đã thay `next@15.1.6` bằng dải `^15.5.9` để tránh khóa vào bản bị Vercel chặn vì CVE-2025-66478. Dải `^15.5.9` cho phép npm lấy bản vá mới hơn trong nhánh Next.js 15 khi cài đặt mới.
- React và React DOM dùng dải `^19.2.1` để tránh khóa vào phiên bản React cũ.
- Khi triển khai, kiểm tra lại log cài đặt để xác nhận chính xác phiên bản được resolve và xem cảnh báo bảo mật mới nhất của Vercel.

## Chạy ở máy cá nhân
1. Cài Node.js LTS (Node 20.9+ hoặc 22 LTS).
2. Mở terminal ở thư mục dự án và chạy:
   ```bash
   npm install
   npm run build
   npm run dev
   ```
3. Mở http://localhost:3000

## Deploy lên Vercel
1. Đưa nội dung bên trong thư mục dự án lên GitHub.
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

## Cảnh báo không chặn build
`Unknown env config "cache-dir"` là cảnh báo cấu hình npm trong môi trường build, không phải lỗi biên dịch Next.js. Nếu do biến môi trường tùy chỉnh của tài khoản/project Vercel, hãy gỡ cấu hình `npm_config_cache_dir`/`cache-dir` không hợp lệ. Cảnh báo `sharp` về install scripts cũng khác với lỗi bảo mật Next.js; theo dõi log deploy để biết có ảnh hưởng tối ưu ảnh hay không.
