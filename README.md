# Tổ 2 — Địa lí 12: “Tôi là Lũ Lụt”

Website trình chiếu tương tác Next.js 15 / React 19, thiết kế phong cách bản đồ địa hình - thủy văn, dùng logo Tổ 2.

## Chạy ở máy cá nhân
1. Cài Node.js 20.9 trở lên (khuyến nghị bản LTS).
2. Mở terminal tại thư mục dự án.
3. Chạy `npm install`, tiếp theo `npm run dev`.
4. Mở http://localhost:3000.
5. Kiểm tra production bằng `npm run build` trước khi deploy.

## Deploy lên Vercel
1. Upload toàn bộ thư mục lên GitHub.
2. Import repository tại https://vercel.com/new.
3. Chọn framework Next.js và để build/output mặc định.
4. Trong thư mục dự án, chạy `npm install` để sinh lockfile mới; nếu có `package-lock.json` cũ thì không giữ bản đang khóa phụ thuộc cũ. Commit `package.json` và lockfile mới (nếu dùng GitHub làm nguồn deploy).
5. Deploy từ commit mới. Nếu dự án cũ từng bị chặn vì bảo mật, xem log xác nhận phiên bản Next.js được cài thuộc bản vá đang được Vercel chấp nhận.

## Điều khiển
- Các nút TRƯỚC / TIẾP ở chân trang.
- Phím `←` / `→`, `PageUp` / `PageDown` hoặc phím cách để đổi slide.
- Phím `F` hoặc nút PHÓNG TO để bật toàn màn hình. Trong chế độ này thanh đầu trang và chữ trang trí sẽ ẩn, chỉ còn nội dung và điều khiển thiết yếu.
- Trắc nghiệm: bấm đáp án để hiện đúng/sai ngay. Nếu sai, đáp án khác vẫn mở cho người tiếp theo; khi trả lời đúng, câu được khóa.
- Đúng/Sai: mỗi câu có đủ nhận định A–D; bấm từng thẻ để hiện Đ/S và giải thích riêng. Các câu được bố trí với các tổ hợp 1 đúng, 2 đúng, 3 đúng và 4 đúng.
- Âm báo được tạo bằng Web Audio API trong trình duyệt, không cần file âm thanh.

## Lưu ý
Không dùng backend hoặc biến môi trường. Âm báo cần thao tác đầu tiên của người dùng vì chính sách âm thanh của trình duyệt. Nên chạy `npm install` để sinh lockfile mới và `npm run build` trước lần deploy chính thức.
