# DỰ ÁN: NEXT.JS MOVIE WEB (MS-CINEMA)
**Tài liệu bàn giao Context dành cho AI Assistant**

Đường dẫn hiện tại của dự án: `c:\Users\nguye\Documents\web\ms-cinema`
Framework: React 19 / Next.js 16 (App Router)
Styling: Tailwind CSS V4

---

## 1. CÁC TÍNH NĂNG ĐÃ HOÀN THIỆN (KHÔNG SỬA LẠI HOẶC LÀM PHÁ VỠ LOGIC NÀY)

### Hệ thống Authentication & Database (Firebase)
- Đã gắn Firebase Auth (Provider Google) chạy ổn định.
- Cơ sở dữ liệu: `Firebase Firestore`. (Sử dụng Firestore để lưu trữ thông tin bình luận, user).
- Các rules bảo mật hiện tại đã được config để phát triển (dev).

### Hệ thống Bình luận (Comments System) - `src/app/phim/[slug]/page.jsx`
- **Real-time Engine**: Tất cả bình luận, số lượt Thích và Phản hồi đều được fetch và lưu trực tiếp từ Firebase Firestore.
- **Smart Sorting (Trending)**: Các bình luận có nhiều lượt thích và phản hồi (reply) sẽ được tự động xếp lên đầu (giống Facebook/TikTok).
- **Time Logic**: Timestamp sử dụng `Date.now()` thật, đi kèm hàm `formatTimeAgo()` hỗ trợ render dạng: "Vừa xong", "1 phút trước", "3 giờ trước" thay vì lưu Text tĩnh.
- **Chống Layout Shift (Jumping)**: 
  - Chỉ ưu tiên hiển thị hiệu ứng đổi số khi user bấm Thả tim, không re-order comment ngay lập tức để tránh làm tụt/nhảy mắt người dùng đang đọc.
  - Phân trang: Mặc định hiển thị 5 comments đầu. Sử dụng nút "Xem thêm bình luận".
- **Hiệu ứng "Ẩn bớt"**: Nút Ẩn bớt sử dụng `behavior: 'instant', block: 'end'`. Tuyệt đối không dùng smooth-scroll làm văng màn hình lên cao. Hệ thống đã làm hoàn thiện phần neo (snap) ngay dưới 5 bình luận trên cùng.

---

## 2. CẤU HÌNH HỆ THỐNG ĐÃ HOÀN TẤT
- `next.config.mjs`: Đã được thiết lập mảng `remotePatterns` cấp quyền cho tất cả các hostname (`https://**` và `http://**`) để tránh lỗi cross-origin từ `next/image`.
- Cấu hình mạng: App được bind vào IP nội mạng (0.0.0.0) và mở port TCP 3000 bằng Windows Firewall. Chạy ngon lành trên các thiết bị quét Local IP.
- Đã thiết lập `Git` (`MS-cinema.git`) mới sạch sẽ và Force push.

---

## 3. NHIỆM VỤ TIẾP THEO YÊU CẦU AI MỚI LÀM TIẾP (TODO)

### Hoàn thiện Image Optimization (`next/image`)
- API đã hỗ trợ `next/image` và component `MovieCard.jsx` (**đã được cập nhật** sang thẻ `<Image>`).
- Nhiệm vụ của bạn: Tìm tất cả các thẻ `<img>` truyền thống còn sót ở các file liệt kê dưới đây và **chuyển đổi chúng thành `<Image>` của Next.js**, đảm bảo xử lý thuộc tính `fill`, `width`, `height`, hoặc `sizes` logic nhất để **Layout gốc không bị bể vỡ**.

**Danh sách các file cần chuyển đổi `<img>` sang `<Image>`:**
1. `src/components/TopNav.jsx` (Ảnh Avatar Profile User & Logo)
2. `src/components/Hero.jsx` (Banner ngang và dọc màn hình Home)
3. `src/app/nguoi-dung/page.jsx` (Ảnh trang thông tin cá nhân)
4. `src/app/phim/[slug]/page.jsx` (Ảnh poster phim nhỏ và mục "Có thể bạn sẽ thích")

---
*Lưu ý cho AI mới: User yêu thích phong cách viết code ngắn gọn, không dư thừa, giao diện Tối Giản/Bóng Bẩy (Apple-inspired Style, Glassmorphism, Micro-interactions). Luôn tuân thủ quy tắc dùng Tiếng Việt khi phản hồi, và Tiếng Anh khi commment trong code.*
