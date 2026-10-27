# Tổ 2 — Địa lí 12 KNTT: “Tôi là Lũ Lụt”

Website trình chiếu tương tác bằng Next.js, dùng logo Tổ 2 do người dùng cung cấp. Giao diện được thiết kế lại theo hướng trình chiếu học thuật: khung sân khấu rõ ràng, màu xanh địa lí, điểm nhấn vàng, minh hoạ địa hình–dòng chảy và hiệu ứng chuyển cảnh có giới hạn.

## Chạy tại máy tính

Cần Node.js 20.9 trở lên.

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Kiểm tra trước khi deploy

```bash
npm run typecheck
npm run build
```

Nếu repository đang có `package-lock.json` cũ, hãy chạy `npm install` rồi commit đồng thời `package.json` và `package-lock.json`. Điều này giúp Vercel không cài lại phiên bản phụ thuộc đã bị khóa trong lockfile cũ.

## Deploy trên Vercel

1. Tải toàn bộ mã nguồn lên repository GitHub.
2. Import repository tại https://vercel.com/new.
3. Giữ cấu hình framework Next.js, không cần biến môi trường.
4. Deploy và kiểm tra log cài đặt để đảm bảo phiên bản Next.js được cài là bản đã vá, không còn là `15.1.6`.

## Điều khiển

- Dùng nút **Trước** và **Tiếp**, hoặc phím mũi tên trái/phải.
- Phím cách/PageDown tiến slide khi câu đã hoàn tất; PageUp quay lại.
- Phím `F` bật/tắt toàn màn hình khi không đang thao tác trên nút.
- Slide ABCD phản hồi ngay. Phương án sai được đánh dấu đỏ, phương án đúng được đánh dấu xanh; các phương án chưa chọn vẫn mở để người khác thử.
- Mỗi slide Đúng/Sai có 4 nhận định A–D; bấm từng nhận định để hiện đáp án Đ/S và giải thích.
- Nút Tiếp chỉ hoạt động sau khi trả lời đúng câu ABCD, mở đủ 4 nhận định Đ/S, hoặc đã mở gợi ý trả lời ngắn. Nút Trước luôn hoạt động để người thuyết trình quay lại.
- Âm thanh được tổng hợp bằng Web Audio API; nút trên thanh đầu trang bật/tắt âm thanh.
- Trong chế độ toàn màn hình, thanh đầu trang và chi tiết phụ được ẩn để ưu tiên nội dung slide.
