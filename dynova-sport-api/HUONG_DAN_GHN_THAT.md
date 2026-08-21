# Cấu hình Giao Hàng Nhanh (GHN) thật cho Dynova Sport

Bản này đã kết nối luồng GHN thật qua Laravel. Bạn chỉ cần dùng Token / Shop ID của tài khoản GHN của chính cửa hàng.

## 1. Tạo tài khoản và cửa hàng GHN

Production:
- https://khachhang.ghn.vn/
- https://5sao.ghn.vn/

Môi trường thử nghiệm (staging):
- https://5sao.ghn.dev/

Sau khi đăng nhập:
1. Vào khu vực **Chủ cửa hàng**.
2. Chọn **Xem / Copy Token API, Client ID, Shop ID**.
3. Vào **Quản lý cửa hàng** và cập nhật đầy đủ địa chỉ lấy hàng của shop.

Tài liệu GHN chính thức:
- https://api.ghn.vn/home/docs/detail?id=83

## 2. Điền cấu hình backend

Mở file `dynova-sport-api/.env` và thêm/sửa:

```env
GHN_BASE_URL=https://online-gateway.ghn.vn
GHN_TOKEN=TOKEN_THAT_CUA_BAN
GHN_SHOP_ID=SHOP_ID_CUA_BAN
GHN_CLIENT_ID=CLIENT_ID_CUA_BAN

# Có thể để trống. Nếu điền, đây là DistrictID nơi shop lấy hàng.
GHN_FROM_DISTRICT_ID=

# 2 = Hàng nhẹ. Phù hợp mặc định với quần áo/giày/phụ kiện thể thao.
GHN_SERVICE_TYPE_ID=2

# 1 = shop/người gửi trả phí vận chuyển cho GHN.
# Website vẫn có thể thu phí ship từ khách trong tổng đơn hàng.
GHN_PAYMENT_TYPE_ID=1

# Cho khách xem hàng nhưng không thử hàng.
GHN_REQUIRED_NOTE=CHOXEMHANGKHONGTHU

# Thông số mặc định dùng để tính cước khi sản phẩm chưa có cân nặng/kích thước riêng.
GHN_DEFAULT_ITEM_WEIGHT=300
GHN_DEFAULT_LENGTH=20
GHN_DEFAULT_WIDTH=15
GHN_DEFAULT_HEIGHT=10
GHN_MAX_INSURANCE_VALUE=5000000
GHN_TIMEOUT=15

# Tự đặt một chuỗi bí mật dài và khó đoán để bảo vệ webhook.
GHN_WEBHOOK_SECRET=THAY_BANG_CHUOI_BI_MAT_CUA_BAN
```

Tạo secret nhanh trong PowerShell:

```powershell
[guid]::NewGuid().ToString("N")
```

Nếu muốn dùng GHN staging, đổi:

```env
GHN_BASE_URL=https://dev-online-gateway.ghn.vn
```

Token/Shop ID phải lấy đúng cùng môi trường staging hoặc production.

## 3. Cập nhật Laravel

Mở PowerShell tại thư mục backend:

```powershell
cd F:\My-Front-end\DATN_Nhom5\dynova-sport-api
composer install
php artisan migrate
php artisan config:clear
php artisan cache:clear
php artisan serve
```

Không cần `php artisan migrate:fresh` nếu bạn muốn giữ dữ liệu hiện tại.

## 4. Kiểm tra kết nối GHN

Kiểm tra trạng thái cấu hình:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/shipping/status
```

Nếu đúng sẽ có `configured: true`.

Kiểm tra Token thật bằng API tỉnh/thành:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/shipping/provinces
```

Nếu trả về danh sách tỉnh/thành thì Token đang gọi được GHN.

Nếu báo 401 / Token không hợp lệ:
- kiểm tra `GHN_TOKEN`;
- kiểm tra Token có đúng môi trường production/staging;
- chạy lại `php artisan config:clear`.

Nếu báo Shop ID không hợp lệ:
- kiểm tra `GHN_SHOP_ID` có thuộc đúng tài khoản/Token;
- kiểm tra cửa hàng GHN đã có địa chỉ lấy hàng.

## 5. Luồng vận chuyển sau khi cấu hình

### Khách đặt hàng

1. Checkout tải Tỉnh/Quận/Phường trực tiếp từ GHN.
2. Khách chọn địa chỉ.
3. Website gọi GHN để tính phí vận chuyển thật.
4. Laravel tính lại giá sản phẩm, voucher, tồn kho và phí ship ở server trước khi lưu đơn.
5. Đơn mới ở trạng thái `pending`.

### Admin xử lý

1. Admin chuyển `pending` -> `confirmed`.
2. Khi admin chuyển `confirmed` -> `shipping`, Laravel tự gọi API **Create Order** của GHN.
3. GHN trả về `order_code` (mã vận đơn).
4. Mã vận đơn, trạng thái GHN, phí thực tế và ngày giao dự kiến được lưu vào database.
5. Không cần admin gõ mã vận đơn bằng tay.

Tài liệu Create Order:
- https://api.ghn.vn/home/docs/detail?id=82

### Khách theo dõi

Trang chi tiết đơn hàng hiển thị:
- mã vận đơn GHN;
- trạng thái hiện tại;
- thời gian giao dự kiến;
- toàn bộ các mốc trong `log` của GHN như lấy hàng, vào kho, trung chuyển, đang giao, giao thành công...;
- khi trang đang mở và đơn đang giao, frontend tự đồng bộ lại khoảng mỗi 60 giây.

Laravel cũng đồng bộ trạng thái khi khách/admin mở chi tiết đơn. Khi GHN báo `delivered`, đơn nội bộ tự chuyển sang `completed`; đơn COD cũng được đánh dấu đã thanh toán.

Tài liệu Order Detail:
- https://api.ghn.vn/home/docs/detail?id=66

Danh sách trạng thái GHN:
- https://api.ghn.vn/home/docs/detail?id=85

## 6. Bật webhook để GHN chủ động đẩy trạng thái

Webhook của dự án:

```text
POST https://TEN-MIEN-CUA-BAN/api/webhooks/ghn/GHN_WEBHOOK_SECRET
```

Ví dụ nếu secret là `abc123`:

```text
https://shop.example.com/api/webhooks/ghn/abc123
```

Theo tài liệu GHN, khi đăng ký callback bạn cần cung cấp cho GHN:
- Client ID;
- URL webhook;
- môi trường Staging/Production;
- tên công ty/cửa hàng.

Tài liệu callback:
- https://api.ghn.vn/home/docs/detail?id=84

### Khi đang chạy localhost

GHN không thể gọi trực tiếp URL `127.0.0.1`. Để thử webhook ở máy cá nhân, bạn cần public backend bằng một tunnel HTTPS, ví dụ ngrok hoặc Cloudflare Tunnel.

Ví dụ với ngrok sau khi backend chạy cổng 8000:

```powershell
ngrok http 8000
```

Sau đó lấy URL HTTPS được cấp và ghép:

```text
https://xxxx.ngrok-free.app/api/webhooks/ghn/GHN_WEBHOOK_SECRET
```

Nếu chưa cấu hình webhook thì tracking vẫn hoạt động: trang chi tiết đơn sẽ gọi API Order Detail của GHN để đồng bộ trạng thái khi mở trang và khoảng mỗi 60 giây trong lúc đang giao.

## 7. Kiểm tra thực tế từ đầu đến cuối

1. Bật MySQL/XAMPP.
2. Chạy backend bằng `php artisan serve`.
3. Chạy frontend bằng `npm run dev`.
4. Đăng nhập tài khoản khách.
5. Thêm sản phẩm có variant vào giỏ.
6. Checkout và chọn địa chỉ từ dropdown GHN.
7. Nhấn **Tính phí** và kiểm tra phí GHN trả về.
8. Đặt hàng.
9. Đăng nhập Admin, xác nhận đơn.
10. Chuyển đơn sang **Đang giao**.
11. Kiểm tra mã vận đơn GHN xuất hiện trong trang Admin và tài khoản GHN.
12. Vào tài khoản khách -> Đơn hàng -> Chi tiết để xem hành trình giao hàng.

## 8. Lưu ý quan trọng

- Không đưa `GHN_TOKEN` hoặc secret thật lên GitHub.
- Không commit file `.env`.
- Frontend không được chứa Token GHN; toàn bộ request có Token chạy qua Laravel backend.
- Giá sản phẩm, voucher, tồn kho và phí giao hàng được backend kiểm tra lại khi tạo đơn.
- Website có thể miễn phí ship cho khách theo ngưỡng cấu hình; phí GHN thực tế vẫn được lưu riêng ở `ghn_carrier_fee` để admin theo dõi chi phí cửa hàng.
- Với COD, GHN có giới hạn theo API. Backend sẽ chặn nếu đơn COD vượt giới hạn đang hỗ trợ thay vì tự cắt số tiền thu hộ.
