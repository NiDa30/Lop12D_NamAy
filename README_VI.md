# Hướng Dẫn Chạy Kỷ Yếu Lớp (Class Gallery)

Dự án này là một trang web xem ảnh và video kỷ yếu, tự động lấy dữ liệu từ thư mục `Cloud` bên ngoài.

## 1. Yêu cầu cần có
Máy tính cần cài đặt **Node.js**. Nếu bạn chưa cài, hãy tải tại [nodejs.org](https://nodejs.org/) và cài đặt phiên bản LTS.

## 2. Cách chạy (Hàng ngày)
Mỗi khi muốn xem web, bạn làm các bước sau:

1. Mở **Command Prompt** (cmd) hoặc **PowerShell**.
2. Di chuyển vào thư mục dự án bằng lệnh:
   ```bash
   cd /d "D:\CLass\gallery"
   ```
   *(Lưu ý: Nếu bạn để folder ở ổ đĩa khác thì thay đổi đường dẫn tương ứng)*

3. Chạy lệnh khởi động:
   ```bash
   npm run dev
   ```

4. Sau khi thấy dòng chữ `Loca: http://localhost:5173/` hiện ra, hãy mở trình duyệt web (Chrome/Cốc Cốc/Edge) và truy cập địa chỉ:
   `http://localhost:5173`

## 3. Cài đặt lại (Nếu chuyển sang máy khác)
Nếu bạn copy thư mục này sang máy khác, bạn cần cài đặt các thư viện trước khi chạy lần đầu:

1. Mở terminal tại thư mục `gallery`.
2. Chạy lệnh:
   ```bash
   npm install
   ```
3. Sau khi cài xong thì chạy `npm run dev` như bình thường.

## Lưu ý quan trọng
- Thư mục ảnh gốc: `D:\CLass\Cloud`
- Web sẽ KHÔNG chạy được nếu bạn đổi tên hoặc xóa thư mục `Cloud`.
- Để thoát chương trình trong màn hình đen (terminal), ấn phím `Ctrl + C`.
