# Archived email templates

Các template trong thư mục này không thuộc tập template đang hoạt động tại
`email/vi`. Chúng được giữ lại để tham khảo hoặc khôi phục khi luồng sản phẩm
tương ứng được triển khai.

Quyết định tinh gọn ngày 2026-08-17:

- Luồng đăng ký đang dùng `register_otp`; `verify_email` vẫn được giữ cho luồng
  xác minh địa chỉ email bằng liên kết.
- Thông báo phim sắp bắt đầu phù hợp với push/in-app hơn email.
- Email điểm thành viên được gộp vào trải nghiệm trong ứng dụng/voucher.
- Trạng thái thanh toán chờ và thành công được gộp vào email booking.
- Các thông báo marketing tổng quát dùng `promotion_event`.
- Các cảnh báo đăng nhập dùng `login_alert`.

Muốn khôi phục template, chuyển file về đúng nhóm tương ứng trong `email/vi`.

Ngày 2026-08-18, `register_otp` đã được khôi phục vào `email/vi/auth` để đáp
ứng contract `REGISTER_OTP` của notification service.
