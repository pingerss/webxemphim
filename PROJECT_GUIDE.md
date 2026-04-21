# 📖 HƯỚNG DẪN HIỂU DỰ ÁN BE_WEBXEMPHIM
> Tài liệu này giải thích từng folder, từng file, từng hàm trong dự án Backend hệ thống đặt vé xem phim.

---

## 🗺️ BỨC TRANH TỔNG QUAN

Khi một user vào web đặt vé xem phim, luồng dữ liệu đi như sau:

```
Người dùng (Browser/App)
        ↓  gửi HTTP Request (GET, POST, PUT, DELETE...)
    ROUTES  ← Bộ phận "lễ tân" - nhận request và chuyển đúng nơi
        ↓
 MIDDLEWARE ← Bộ phận "bảo vệ" - kiểm tra token, validate dữ liệu
        ↓
 CONTROLLER ← Bộ phận "quản lý ca" - nhận việc, chia việc
        ↓
   SERVICE  ← Bộ phận "chuyên môn" - xử lý logic nghiệp vụ thật sự
        ↓
    MODELS  ← Bộ phận "kho dữ liệu" - giao tiếp với MySQL
        ↓
   DATABASE ← MySQL trên TiDB Cloud - nơi lưu trữ thật sự
```

Ngoài ra còn có:
- **REDIS**: Bộ nhớ tạm tốc độ cao (lưu "ghế đang giữ", cache)
- **WORKERS**: Tác nhân chạy ngầm (tự động hủy đơn hết hạn)
- **UTILS**: Công cụ dùng chung

---

## 📁 CẤU TRÚC THƯ MỤC ĐẦY ĐỦ

```
BE_WebXemPhim/
├── .env                    ← Biến môi trường (mật khẩu, API key...)
├── .env.example            ← Mẫu .env để người khác biết cần điền gì
├── .gitignore              ← Danh sách file không đưa lên Git
├── package.json            ← Danh sách thư viện cần cài + script lệnh
├── README.md               ← Hướng dẫn cài đặt ngắn
├── PROJECT_GUIDE.md        ← File này - tài liệu chi tiết
└── src/                    ← Toàn bộ source code nằm đây
    ├── server.js           ← Điểm khởi động duy nhất của app
    ├── app.js              ← Cấu hình Express (middleware toàn cục)
    ├── config/             ← Cấu hình kết nối các dịch vụ bên ngoài
    ├── models/             ← Định nghĩa cấu trúc bảng database
    ├── routes/             ← Định nghĩa các đường dẫn API (URL)
    ├── controllers/        ← Nhận request, gọi service, trả response
    ├── services/           ← Logic nghiệp vụ (trái tim của app)
    ├── middlewares/        ← Các lớp xử lý giữa request và controller
    ├── utils/              ← Hàm tiện ích dùng nhiều nơi
    ├── workers/            ← Công việc chạy nền tự động
    └── database/           ← Script tạo bảng và nhét dữ liệu mẫu
```

---

## 🚀 FILE KHỞI ĐỘNG

### `src/server.js` - Điểm khởi động duy nhất
**Vai trò**: Như công tắc bật toàn bộ hệ thống. Chạy `npm run dev` thì file này chạy đầu tiên.

```
Khi bật server:
1. Kết nối MySQL (TiDB Cloud)
2. Kết nối Redis (Upstash)
3. Khởi động Workers (tác nhân chạy nền)
4. Mở cổng lắng nghe HTTP (mặc định port 3000)
```

**Các hàm:**
- `bootstrap()` — Hàm async chạy toàn bộ quá trình khởi động theo thứ tự. Nếu bất kỳ bước nào lỗi → in lỗi và tắt app luôn (`process.exit(1)`).

---

### `src/app.js` - Cấu hình Express
**Vai trò**: "Trang bị vũ khí" cho Express trước khi nhận request.

**Các middleware được gắn (theo thứ tự chạy):**

| Thứ tự | Middleware | Làm gì |
|--------|-----------|--------|
| 1 | `helmet()` | Thêm HTTP headers bảo mật (chống XSS, clickjacking...) |
| 2 | `cors()` | Cho phép Frontend (localhost:3001) gọi API |
| 3 | `rateLimit()` | Giới hạn 100 request/15 phút/IP (chống spam) |
| 4 | `express.json()` | Đọc body JSON từ request |
| 5 | `compression()` | Nén response (gzip) cho nhanh hơn |
| 6 | `morgan()` | In log mỗi request ra terminal |

**Routes:**
- `GET /health` → Kiểm tra server còn sống không (trả `{ status: 'OK' }`)
- `app.use('/api', routes)` → Chuyển tất cả request `/api/...` vào router chính

---

## ⚙️ FOLDER `config/` - Kết nối dịch vụ

### `config/database.js` - Kết nối MySQL
**Vai trò**: Tạo 1 kết nối duy nhất đến MySQL, dùng chung toàn app.

**Kỹ thuật quan trọng:**
- **Connection Pool**: Không mở/đóng kết nối mỗi lần query. Duy trì sẵn 10 kết nối → nhanh hơn nhiều.
- **SSL tự động**: Nếu host có `tidbcloud.com` → bật TLS (bắt buộc với TiDB Cloud).
- **timezone +07:00**: Đảm bảo mọi datetime lưu theo giờ Việt Nam.

**Hàm xuất ra:**
- `sequelize` — Đối tượng kết nối, dùng để query database ở khắp nơi.
- `connectDB()` — Hàm test kết nối (chạy `SELECT 1+1` xem có lỗi không).

---

### `config/redis.js` - Kết nối Redis
**Vai trò**: Kết nối đến Upstash Redis (bộ nhớ tạm tốc độ cao).

**Redis dùng để làm gì trong dự án này?**
1. **Khóa ghế** — Khi user chọn ghế, lưu vào Redis 5 phút với key `seat_lock:showtime_X:seat_Y`
2. **Gia hạn khóa** — Khi user bấm thanh toán, gia hạn lên 15 phút
3. **Bộ đếm thời gian** — TTL (Time-To-Live) tự động xóa key khi hết giờ

**Hàm xuất ra:**
- `connectRedis()` — Khởi tạo kết nối, tự bật TLS nếu host là Upstash.
- `getRedisClient()` — Lấy client đã kết nối để dùng ở nơi khác. Throw lỗi nếu chưa connect.

---

### `config/logger.js` - Ghi log
**Vai trò**: In thông tin ra terminal và lưu vào file log.

**2 loại log:**
- Console → hiển thị màu sắc, dễ đọc khi dev
- File `logs/combined.log` → lưu tất cả
- File `logs/error.log` → chỉ lưu lỗi

**Dùng như thế nào:**
```javascript
const logger = require('../config/logger');
logger.info('Thông tin bình thường');
logger.error('Có lỗi xảy ra');
logger.warn('Cảnh báo');
```

---

### `config/cloudinary.js` - Upload ảnh
**Vai trò**: Cấu hình dịch vụ Cloudinary để upload poster phim, avatar user lên cloud.

---

### `config/mailer.js` - Gửi email
**Vai trò**: Cấu hình Nodemailer để gửi email (xác nhận đặt vé, quên mật khẩu).
- Dùng Gmail SMTP.
- Tự test kết nối khi khởi động, in warn nếu lỗi cấu hình.

---

## 🗄️ FOLDER `models/` - Cấu trúc Database

> **Quan trọng**: Mỗi file model = 1 bảng trong MySQL. Sequelize tự tạo bảng dựa vào định nghĩa này.

### `models/index.js` - File trung tâm (QUAN TRỌNG NHẤT)
**Vai trò**: Import TẤT CẢ models và khai báo mối quan hệ (associations) giữa các bảng.

**Tại sao cần file này?**
- Nếu không khai báo associations, Sequelize không biết `Movie` liên quan `Genre` như thế nào
- Các quan hệ được khai báo ở đây một lần, dùng được ở khắp nơi

**Các quan hệ trong dự án:**

```
MembershipTier ─── 1:N ──→ User
       (hạng thành viên)        (người dùng)

Director ─── 1:N ──→ Movie
   (đạo diễn)         (phim)

Movie ─── N:N ──→ Genre      (qua bảng movie_genres)
Movie ─── N:N ──→ Actor      (qua bảng movie_actors)
Movie ─── 1:N ──→ Showtime   (1 phim có nhiều suất chiếu)
Movie ─── 1:N ──→ MovieReview

Cinema ─── 1:N ──→ Room      (1 rạp cố định có nhiều phòng)
Room   ─── 1:N ──→ Seat      (1 phòng có nhiều ghế)
Room   ─── 1:N ──→ Showtime

Showtime ─── 1:N ──→ Booking (1 suất có nhiều đơn đặt)

Booking ─── 1:N ──→ BookingTicket  (1 đơn có nhiều vé/ghế)
Booking ─── 1:N ──→ BookingCombo   (1 đơn có nhiều combo)
Booking ─── 1:1 ──→ Payment        (1 đơn có 1 kết quả TT)

Promotion ─── 1:N ──→ Voucher      (1 KM có nhiều mã)
```

> ⚠️ **Lưu ý thiết kế**: Hệ thống chỉ quản lý **1 rạp duy nhất** (id=1). `Cinema` model vẫn tồn tại trong DB nhưng không có CRUD nhiều rạp. Admin chỉ quản lý **phòng chiếu** bên trong rạp đó.

---

### `models/User.js` - Bảng `users`
**Lưu thông tin người dùng.**

| Cột | Kiểu | Ý nghĩa |
|-----|------|---------|
| `id` | INT | Khóa chính tự tăng |
| `full_name` | VARCHAR | Họ tên |
| `email` | VARCHAR UNIQUE | Email đăng nhập |
| `password_hash` | VARCHAR | Mật khẩu đã mã hóa bằng BCrypt (NULL nếu đăng nhập Google) |
| `role` | ENUM | `admin` hoặc `customer` — dùng để phân quyền |
| `is_active` | BOOLEAN | FALSE = tài khoản bị khóa |
| `loyalty_points` | INT | Điểm tích lũy |
| `google_id` | VARCHAR | ID từ Google OAuth |
| `refresh_token` | TEXT | Lưu refresh token để logout từ nhiều thiết bị |

**Quan trọng - Scope:**
- `User.findByPk(id)` → KHÔNG trả `password_hash` và `refresh_token` (bảo mật)
- `User.scope('withPassword').findOne(...)` → Mới trả password (dùng khi login để so sánh)

---

### `models/Movie.js` - Bảng `movies`
**Lưu thông tin phim.**

| Cột | Ý nghĩa |
|-----|---------|
| `status` | `coming_soon` / `now_showing` / `ended` — trạng thái chiếu |
| `duration` | Thời lượng phim (phút) — dùng để tính giờ kết thúc suất chiếu |
| `age_rating` | `P` / `C13` / `C16` / `C18` — giới hạn độ tuổi |
| `avg_rating` | Điểm đánh giá trung bình (tự tính khi có review mới) |

---

### `models/Showtime.js` - Bảng `showtimes` ⭐ TRUNG TÂM
**Bảng quan trọng nhất — nối Phim với Phòng chiếu, lưu lịch chiếu.**

| Cột | Ý nghĩa |
|-----|---------|
| `movie_id` | Phim nào |
| `room_id` | Phòng chiếu nào |
| `start_time` | Giờ bắt đầu chiếu |
| `end_time` | Giờ kết thúc (= start + duration + cleaning_time) |
| `base_price` | Giá vé cơ bản (VND) — ghế VIP sẽ nhân thêm hệ số |
| `cleaning_time_mins` | Thời gian dọn rạp giữa 2 suất (mặc định 15 phút) |

---

### `models/Booking.js` - Bảng `bookings` ⭐ TRUNG TÂM
**Lưu đơn đặt vé của khách hàng.**

| Cột | Ý nghĩa |
|-----|---------|
| `booking_code` | Mã đơn hàng dạng `CS-XXXXXXXX` |
| `status` | `pending` → `paid` hoặc `cancelled` hoặc `expired` |
| `hold_expires_at` | Thời hạn giữ ghế (5 phút khi chọn, 15 phút khi checkout) |
| `subtotal` | Tổng tiền trước giảm giá |
| `discount_amount` | Số tiền được giảm |
| `total_amount` | Số tiền thật sự phải trả |

---

### `models/Seat.js` - Bảng `seats`
**Mỗi ghế = 1 dòng. Ghế A1 phòng 1 rạp 1 = 1 dòng.**

| Cột | Ý nghĩa |
|-----|---------|
| `room_id` | Thuộc phòng nào |
| `row_label` | Hàng: `A`, `B`, `C`... |
| `col_number` | Cột: `1`, `2`, `3`... |
| `seat_name` | Tên ghế: `A1`, `B5`... |
| `seat_type_id` | Loại ghế (thường/VIP/couple) |

---

### `models/SeatType.js` - Bảng `seat_types`
**Định nghĩa các loại ghế và hệ số giá.**

Ví dụ:
- Thường: `price_multiplier = 1.0` → giá = base_price × 1.0
- VIP: `price_multiplier = 1.5` → giá = base_price × 1.5
- Couple: `price_multiplier = 2.0` → giá = base_price × 2.0

---

### `models/BookingDetail.js` - 2 bảng `booking_tickets` và `booking_combos`
**Chi tiết của 1 đơn hàng:**
- `BookingTicket` — Mỗi ghế trong đơn = 1 dòng (lưu giá tại thời điểm đặt)
- `BookingCombo` — Mỗi loại combo trong đơn = 1 dòng

---

### `models/Payment.js` - Bảng `payments`
**Lưu kết quả giao dịch từ VNPay.**

| Cột | Ý nghĩa |
|-----|---------|
| `status` | `pending` → `success` hoặc `failed` hoặc `refunded` |
| `transaction_id` | Mã giao dịch của VNPay |
| `provider_response` | JSON đầy đủ VNPay trả về (lưu để đối soát) |

---

### Các models còn lại:
- `MembershipTier.js` — Hạng thành viên (Bạch Kim/Vàng/Kim Cương)
- `Genre.js` — Thể loại phim (Hành động, Kinh dị...)
- `Director.js` — Đạo diễn
- `Actor.js` — Diễn viên
- `MovieMeta.js` — 2 bảng junction: `movie_genres` và `movie_actors` (quan hệ N-N)
- `MovieReview.js` — Đánh giá phim của khách hàng (rating 1-10 + bình luận)
- `Cinema.js` — Rạp chiếu phim (chỉ 1 bản ghi id=1, không CRUD)
- `Room.js` — Phòng chiếu trong rạp (Standard/IMAX...) — Admin quản lý
- `Combo.js` — Bắp nước combo
- `Promotion.js` — Chương trình khuyến mãi
- `Voucher.js` — Mã giảm giá cụ thể (liên kết với Promotion)

---

## 🛣️ FOLDER `routes/` - Định nghĩa URL API

### `routes/index.js` - Router tổng
**Vai trò**: "Bảng điều phối" — gom tất cả sub-router lại, thêm prefix `/v1`.

Ví dụ: Request `GET /api/v1/movies` sẽ đi vào `movie.routes.js`

---

### `routes/auth.routes.js` - Xác thực
| URL | Method | Middleware | Ý nghĩa |
|-----|--------|-----------|---------|
| `/auth/register` | POST | validate | Đăng ký tài khoản mới |
| `/auth/login` | POST | validate | Đăng nhập, nhận token |
| `/auth/refresh` | POST | — | Làm mới access token hết hạn |
| `/auth/logout` | POST | authenticate | Đăng xuất (xóa refresh token) |
| `/auth/me` | GET | authenticate | Lấy thông tin user đang đăng nhập |
| `/auth/forgot-password` | POST | — | Gửi link reset mật khẩu qua email |
| `/auth/reset-password` | POST | — | Đặt mật khẩu mới với token trong email |

---

### `routes/movie.routes.js` - Phim (Public)
| URL | Method | Ý nghĩa |
|-----|--------|---------|
| `/movies` | GET | Danh sách phim, filter theo `status` / `genre_id` / `search` / `page` / `limit` |
| `/movies/now-showing` | GET | Phim đang chiếu |
| `/movies/coming-soon` | GET | Phim sắp chiếu |
| `/movies/:id` | GET | Chi tiết 1 phim (kèm đạo diễn, thể loại, diễn viên) |
| `/movies/:id/showtimes` | GET | Lịch chiếu của phim — filter theo `?date=YYYY-MM-DD` |
| `/movies/:id/reviews` | GET | Danh sách đánh giá |
| `/movies/:id/reviews` | POST | Thêm đánh giá (cần đăng nhập) |

---

### `routes/showtime.routes.js` - Suất chiếu
| URL | Method | Ý nghĩa |
|-----|--------|---------|
| `/showtimes` | GET | Danh sách suất chiếu — filter: `?movie_id` / `?room_id` / `?date=YYYY-MM-DD` |
| `/showtimes/:id` | GET | Chi tiết 1 suất chiếu |
| `/showtimes/:id/seats` | GET | **Sơ đồ ghế real-time** — trạng thái từng ghế (available/held/booked) |

---

### `routes/booking.routes.js` - Đặt vé (Cần đăng nhập)
| URL | Method | Ý nghĩa |
|-----|--------|---------|
| `/bookings/hold` | POST | **Giữ ghế 5 phút** (bước 1 đặt vé) |
| `/bookings/checkout` | POST | **Tạo link VNPay** (bước 2 — gia hạn 15 phút) |
| `/bookings/my` | GET | Lịch sử đặt vé của tôi |
| `/bookings/:id` | GET | Chi tiết 1 đơn |
| `/bookings/:id/cancel` | DELETE | Hủy đơn (chỉ được hủy khi chưa thanh toán) |

---

### `routes/payment.routes.js` - Thanh toán VNPay
| URL | Method | Ý nghĩa |
|-----|--------|---------|
| `/payments/vnpay/return` | GET | VNPay redirect về đây sau khi user trả tiền (hiển thị kết quả) |
| `/payments/vnpay/ipn` | POST | VNPay gọi ngầm đến đây để xác nhận giao dịch (server-to-server) |

> **Lưu ý**: 2 URL này KHÔNG cần JWT — VNPay server gọi vào, không phải user.

---

### `routes/admin.routes.js` - Quản trị (Cần đăng nhập + role Admin)
Tất cả URL dạng `/admin/...` — bảo vệ bởi `authenticate + authorize('admin')`.

**Movies** — CRUD quản lý phim, upload poster/backdrop:
```
GET    /admin/movies
GET    /admin/movies/:id
POST   /admin/movies          (form-data: title, duration, poster, backdrop...)
PUT    /admin/movies/:id
DELETE /admin/movies/:id
```

**Rooms & Seats** — Chỉ quản lý phòng (không CRUD rạp vì chỉ có 1 rạp):
```
GET    /admin/rooms                      → Danh sách phòng
POST   /admin/rooms                      → Thêm phòng mới
PUT    /admin/rooms/:id                  → Sửa phòng
DELETE /admin/rooms/:id                  → Xóa phòng (soft)
GET    /admin/rooms/:id/seats            → Xem ghế của phòng
POST   /admin/rooms/:id/seats/generate   → Tạo tự động ma trận ghế
```

**Showtimes** — Tạo lịch chiếu (có kiểm tra trùng giờ cùng phòng):
```
GET    /admin/showtimes
POST   /admin/showtimes
PUT    /admin/showtimes/:id
DELETE /admin/showtimes/:id
```

**Users** — Quản lý tài khoản:
```
GET  /admin/users
PUT  /admin/users/:id/toggle    → Khóa/Mở tài khoản
PUT  /admin/users/:id/role      → Đổi role
```

**Combos**, **Promotions**, **Dashboard**: CRUD bình thường.

---

## 🎮 FOLDER `controllers/` - Nhận và Trả Request

> **Nguyên tắc**: Controller KHÔNG xử lý logic nghiệp vụ. Chỉ:
> 1. Lấy dữ liệu từ `req` (body, params, query)
> 2. Gọi Service tương ứng
> 3. Trả kết quả qua `ApiResponse`
> 4. Nếu lỗi → `next(err)` để error middleware xử lý

### `controllers/auth.controller.js`
| Hàm | Làm gì |
|-----|-------|
| `register(req, res, next)` | Lấy `{full_name, email, password}` từ body → gọi `AuthService.register()` |
| `login(req, res, next)` | Lấy `{email, password}` → gọi `AuthService.login()` |
| `refreshToken(req, res, next)` | Lấy `refresh_token` từ body → gọi `AuthService.refreshToken()` |
| `logout(req, res, next)` | Lấy `req.user.id` (từ middleware auth) → gọi `AuthService.logout()` |
| `getMe(req, res)` | Trả thẳng `req.user` (đã được middleware điền vào) |
| `forgotPassword(req, res, next)` | Lấy email → gọi service → gửi email |
| `resetPassword(req, res, next)` | Lấy token + mật khẩu mới → gọi service |

---

### `controllers/booking.controller.js`
| Hàm | Làm gì |
|-----|-------|
| `holdSeats(req, res, next)` | Nhận `{showtime_id, seat_ids, combo_items}` → gọi `BookingService.holdSeats()` |
| `checkout(req, res, next)` | Nhận `{booking_id, voucher_code}` → gọi `BookingService.checkout()` → trả URL VNPay |
| `getMyBookings(req, res, next)` | Lấy lịch sử đặt vé của user đang login |
| `getById(req, res, next)` | Chi tiết 1 đơn — kiểm tra đơn phải của user đó |
| `cancel(req, res, next)` | Hủy đơn |

---

### `controllers/payment.controller.js`
| Hàm | Làm gì |
|-----|-------|
| `vnpayReturn(req, res, next)` | VNPay redirect về đây → verify chữ ký → redirect Frontend với kết quả |
| `vnpayIpn(req, res, next)` | VNPay IPN → verify → cập nhật trạng thái đơn → phải trả JSON `{RspCode:'00'}` |

---

### `controllers/cinema.controller.js` - Public cinema
| Hàm | URL | Làm gì |
|-----|-----|-------|
| `getInfo(req, res)` | `GET /cinemas/info` | Thông tin rạp duy nhất (id=1) |
| `getRooms(req, res)` | `GET /cinemas/rooms` | Danh sách phòng của rạp |

### `controllers/admin/adminCinema.controller.js` - Admin quản lý phòng
| Hàm | URL | Làm gì |
|-----|-----|-------|
| `getRooms` | `GET /admin/rooms` | Danh sách phòng |
| `createRoom` | `POST /admin/rooms` | Thêm phòng (cinema_id tự gán = 1) |
| `updateRoom` | `PUT /admin/rooms/:id` | Sửa thông tin phòng |
| `removeRoom` | `DELETE /admin/rooms/:id` | Xóa phòng (soft delete) |
| `getSeats` | `GET /admin/rooms/:id/seats` | Xem tất cả ghế của phòng |
| `generateSeats` | `POST /admin/rooms/:id/seats/generate` | Tạo tự động ma trận ghế |

### `controllers/admin/` - Các admin controller khác
Tương tự pattern trên nhưng cho Admin. Mỗi action thêm việc upload ảnh qua Cloudinary.

---

## 🧠 FOLDER `services/` - TRÁI TIM CỦA ỨNG DỤNG

> Đây là nơi xử lý TẤT CẢ logic nghiệp vụ. Nếu có bug, thường tìm ở đây.

### `services/auth.service.js` - Xác thực người dùng

**`register({ full_name, email, password })`**
```
1. Kiểm tra email đã tồn tại chưa → nếu có throw lỗi 409
2. Hash mật khẩu bằng BCrypt (cost factor 12 — an toàn, không thể reverse)
3. Tạo User mới trong DB
4. Tạo accessToken (hết hạn 7 ngày) và refreshToken (30 ngày)
5. Lưu refreshToken vào DB (để logout được)
6. Trả về { user, accessToken, refreshToken }
```

**`login({ email, password })`**
```
1. Tìm user theo email, lấy thêm password_hash (dùng scope withPassword)
2. Kiểm tra user tồn tại, không bị khóa, không phải tài khoản Google
3. So sánh password với hash bằng bcrypt.compare()
4. Nếu khớp → tạo tokens, lưu refreshToken vào DB
5. Trả về { user, accessToken, refreshToken }
```

**`refreshToken(token)`**
```
1. Verify JWT refresh token
2. Tìm user theo id trong token
3. So sánh token gửi lên với token lưu trong DB (tránh token bị đánh cắp)
4. Tạo token mới, lưu vào DB, trả về
```

**`forgotPassword(email)`**
```
1. Tìm user theo email (nếu không tìm thấy → vẫn return, không lộ thông tin)
2. Tạo reset token ngẫu nhiên (crypto.randomBytes)
3. Gửi email với link chứa token
```

---

### `services/movie.service.js` - Quản lý phim

**`getAll({ status, genre_id, search, page, limit })`**
```
Query với các filter:
- status: lọc phim đang chiếu/sắp chiếu
- genre_id: lọc theo thể loại
- search: tìm theo tên phim (LIKE %keyword%)
- page/limit: chia trang (offset = (page-1) * limit)
Include: Director + Genres
```

**`getById(id)`**
```
Tìm phim theo id, include đầy đủ:
- Director (đạo diễn)
- Genres (thể loại)
- Actors (diễn viên, kèm tên nhân vật + thứ tự)
```

**`getShowtimes(movieId, { date })`**
```
Lấy tất cả suất chiếu của phim:
- Filter theo ngày cụ thể (query 0h-24h của ngày đó)
- Không filter theo thành phố/rạp vì hệ thống chỉ có 1 rạp
Include: Room (tên phòng, loại phòng)
```

**`addReview(movieId, userId, { rating, comment })`**
```
1. Kiểm tra user đã review phim này chưa (1 user 1 review)
2. Tạo review mới
3. Tự động tính lại avg_rating và total_reviews của phim
```

---

### `services/showtime.service.js` - Suất chiếu ⭐

**`getSeatMap(showtimeId)`** — Hàm phức tạp nhất, kết hợp DB + Redis
```
1. Lấy tất cả ghế của phòng từ MySQL
2. Lấy danh sách ghế đã booked/pending từ MySQL (BookingTicket)
3. Với mỗi ghế, kiểm tra Redis xem có đang bị giữ không (key seat_lock:...)
4. Gán status cho từng ghế:
   - 'available': trống, chọn được
   - 'held': đang bị người khác giữ (key Redis còn sống)
   - 'booked': đã thanh toán xong (không thể chọn)
5. Tính giá từng ghế = base_price × price_multiplier
6. Trả về mảng ghế với đầy đủ thông tin
```

**`create({ movie_id, room_id, start_time, ... })`** — Tạo suất chiếu với kiểm tra xung đột
```
1. Lấy thông tin phim (cần duration)
2. Tính end_time = start_time + duration + cleaning_time
3. Query DB xem có suất chiếu nào ở room_id này mà thời gian bị overlap không:
   - Suất mới bắt đầu trong khoảng suất cũ
   - Suất mới kết thúc trong khoảng suất cũ
   - Suất mới bao trùm suất cũ
4. Nếu có conflict → throw lỗi 409 kèm thông tin suất bị trùng
5. Nếu ok → tạo Showtime mới
```

---

### `services/booking.service.js` - Đặt vé ⭐ PHỨC TẠP NHẤT

**`holdSeats(userId, { showtime_id, seat_ids, combo_items })`**

Đây là hàm giải quyết bài toán **tranh chấp ghế** — 2 người cùng chọn 1 ghế cùng lúc.

```
BƯỚC 1: Lock Redis (ngăn race condition cấp ứng dụng)
- Với mỗi ghế: Redis SET key NX EX 300
  * NX = chỉ set nếu key CHƯA tồn tại
  * EX 300 = tự xóa sau 300 giây (5 phút)
  * Nếu SET return NULL → ghế đang bị người khác giữ → throw lỗi 409
  * Nếu lỗi giữa chừng → nhả tất cả key đã lock

BƯỚC 2: Database Transaction (nguyên tử — all or nothing)
- Mở transaction MySQL
- SELECT ghế với LOCK FOR UPDATE (lock cấp DB, ngăn đọc đồng thời)
- Kiểm tra ghế thuộc đúng room của showtime
- Tính giá: base_price × price_multiplier của từng loại ghế
- Tạo Booking (status=pending, hold_expires_at=5 phút sau)
- Tạo BookingTickets (1 dòng/ghế)
- Tạo BookingCombos (nếu có combo)
- COMMIT
```

**`checkout(userId, { booking_id, voucher_code })`**
```
1. Tìm booking của user, kiểm tra còn trong thời hạn giữ
2. Nếu có voucher_code → gọi PromotionService.validateVoucher()
3. Tính discount, cập nhật total_amount
4. Gia hạn tất cả seat_lock Redis lên 900 giây (15 phút)
5. Cập nhật hold_expires_at trong DB
6. Tạo URL thanh toán VNPay
7. Trả về { booking, paymentUrl }
```

**`expireOverdueBookings()`** — Được gọi bởi Worker mỗi 60 giây
```
1. Query tất cả booking có status='pending' và hold_expires_at < now()
2. Với mỗi booking hết hạn:
   - Cập nhật status = 'expired'
   - Xóa tất cả seat_lock Redis → ghế trở về 'available'
3. Trả về số lượng booking đã expire
```

---

### `services/payment.service.js` - Thanh toán VNPay

**`createVnpayUrl({ bookingCode, amount, orderInfo, ipAddr })`**
```
Build URL thanh toán VNPay theo chuẩn VNPay 2.1.0:
1. Tạo các params bắt buộc (mã rạp, số tiền ×100, ngày tạo...)
2. Sắp xếp params theo thứ tự alphabet
3. Ký HMAC-SHA512 với VNPAY_HASH_SECRET
4. Ghép thành URL và trả về
```

**`handleVnpayIpn(query)`** — Xử lý callback server-to-server
```
ĐÂY LÀ NƠI CHÍNH THỨC CẬP NHẬT TRẠNG THÁI THANH TOÁN

1. Verify chữ ký HMAC-SHA512 (đảm bảo request từ VNPay, không phải ai giả mạo)
2. Tìm booking theo mã
3. Kiểm tra idempotency (nếu đã xử lý rồi → return luôn, tránh xử lý 2 lần)
4. Nếu vnp_ResponseCode = '00' → THÀNH CÔNG:
   - Tạo Payment record với status='success'
   - Cập nhật Booking status='paid'
   - (TODO: gửi email, cộng điểm tích lũy)
5. Nếu khác → THẤT BẠI:
   - Tạo Payment record với status='failed'
   - Gọi BookingService.cancel() → nhả ghế
6. Phải trả JSON { RspCode:'00' } cho VNPay biết đã nhận
```

---

### `services/promotion.service.js` - Khuyến mãi

**`validateVoucher(code, orderAmount)`**
```
1. Tìm voucher theo code (phân biệt hoa thường → tự toUpperCase)
2. Kiểm tra: hết hạn chưa, còn lượt dùng không
3. Kiểm tra promotion: còn active không, đơn hàng có đủ tối thiểu không
4. Tính discount:
   - percent: orderAmount × (discount_value / 100), cap tại max_discount_amount
   - fixed: trừ thẳng discount_value
5. Trả về { voucher, discountAmount, finalAmount }
```

**`generateVouchers(promotionId, { count, prefix })`**
```
Tạo hàng loạt voucher cho 1 promotion:
- Mỗi voucher code = prefix + 8 ký tự hex ngẫu nhiên
- bulkCreate() → chèn tất cả 1 lần cho hiệu quả
```

---

### `services/cinema.service.js` - Rạp & Phòng (1 rạp cố định)

> Hằng số `CINEMA_ID = 1` được cố định trong service — mọi thao tác đều gắn với rạp này.

**`getInfo()`** — Lấy thông tin rạp (id=1)

**`getRooms()`** — Danh sách phòng đang active của rạp

**`createRoom(payload)`** — Tạo phòng mới, tự gán `cinema_id = 1`

**`updateRoom(roomId, payload)`** — Cập nhật phòng (chỉ phòng thuộc rạp id=1)

**`removeRoom(roomId)`** — Soft delete phòng (`is_active = false`)

**`generateSeats(roomId, config)`**
```
Tự động tạo ma trận ghế từ cấu hình phòng:
1. Lấy Room (có total_rows, total_cols) — kiểm tra thuộc rạp id=1
2. Xóa ghế cũ (Seat.destroy)
3. Tạo nhãn hàng: A=65, B=66... theo ASCII (total_rows hàng)
4. Với mỗi ô (hàng × cột), quyết định loại ghế:
   - Hàng thuộc vip_rows (vd: ['G','H']) → seat_type = VIP
   - Cột thuộc couple_cols (vd: [11, 12]) → seat_type = Couple
   - Còn lại → seat_type mặc định (Thường)
5. bulkCreate() tất cả cùng lúc → hiệu quả hơn insert từng cái

Ví dụ phòng 8 hàng × 12 cột:
- vip_rows: ['G','H'] → 24 ghế VIP
- couple_cols: [11,12] → 16 ghế Couple
- Còn lại: 96 - 24 - 16 = 56 ghế Thường
```

---

## 🛡️ FOLDER `middlewares/` - Lớp Bảo Vệ

### `middlewares/auth.middleware.js` - Xác thực & Phân quyền

**`authenticate(req, res, next)`** — Chạy trước controller cần đăng nhập
```
1. Đọc header: Authorization: Bearer <token>
2. Nếu không có token → 401 Unauthorized
3. jwt.verify(token) → nếu lỗi → 401
4. Tìm user theo id trong token → nếu không có hoặc bị khóa → 401
5. Gán req.user = user (controller dùng req.user để lấy info)
6. next() → đi tiếp vào controller
```

**`authorize(...roles)`** — Chạy SAU authenticate
```
// Dùng như: router.delete('/...', authenticate, authorize('admin'), controller)
1. Kiểm tra req.user.role có trong danh sách roles cho phép không
2. Nếu không → 403 Forbidden
3. Nếu có → next()
```

---

### `middlewares/error.middleware.js` - Xử lý lỗi toàn cục
**Vai trò**: Bắt TẤT CẢ lỗi từ mọi controller/service (qua `next(err)`), format và trả về cho client.

```
Nếu lỗi là SequelizeValidationError → 422 với danh sách lỗi cụ thể
Nếu lỗi là AppError (lỗi chủ động throw) → dùng statusCode của nó
Còn lại → 500 Internal Server Error
Ở môi trường development: kèm stack trace để debug
```

---

### `middlewares/validate.middleware.js` - Kiểm tra dữ liệu đầu vào

```javascript
// Dùng cùng với express-validator:
const { body } = require('express-validator');

router.post('/register', 
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  ],
  validate,        // ← middleware này kiểm tra kết quả validation
  AuthController.register
);
// Nếu có lỗi validation → trả ngay 422, không vào controller
```

---

### `middlewares/upload.middleware.js` - Upload ảnh
- `upload` — Multer config (lưu file vào RAM, giới hạn 5MB, chỉ nhận ảnh)
- `uploadToCloudinary(buffer, folder)` — Đẩy ảnh từ RAM lên Cloudinary, trả về `secure_url`

---

## 🔧 FOLDER `utils/` - Công Cụ Dùng Chung

### `utils/AppError.js` - Lỗi có HTTP status
```javascript
// Thay vì throw new Error('Email đã tồn tại')
// Dùng:
throw new AppError('Email đã tồn tại', 409);
// errorHandler middleware sẽ trả đúng HTTP 409, không phải 500
```

---

### `utils/apiResponse.util.js` - Format response chuẩn
Đảm bảo TẤT CẢ response có cùng cấu trúc:
```json
{ "success": true, "message": "...", "data": {...} }
// hoặc
{ "success": false, "message": "..." }
```

| Hàm | Status | Dùng khi |
|-----|--------|---------|
| `success(res, data, msg)` | 200 | Lấy/sửa thành công |
| `created(res, data, msg)` | 201 | Tạo mới thành công |
| `notFound(res, msg)` | 404 | Không tìm thấy |
| `error(res, msg, code)` | 4xx/5xx | Lỗi |
| `paginated(res, data, pagination)` | 200 | Kết quả có phân trang |

---

### `utils/jwt.util.js` - Tạo và verify JWT
- `generateAccessToken({ id, role })` → JWT ngắn hạn (7 ngày)
- `generateRefreshToken({ id })` → JWT dài hạn (30 ngày)
- `verifyRefreshToken(token)` → Decode và verify refresh token

---

### `utils/helpers.util.js` - Các hàm tiện ích
- `generateBookingCode()` → Tạo mã dạng `CS-A1B2C3D4`
- `seatLockKey(showtimeId, seatId)` → Tạo Redis key `seat_lock:showtime_5:seat_23`
- `bookingHoldKey(bookingCode)` → Tạo Redis key `booking_hold:CS-XXXX`
- `parsePagination(query)` → Đọc `?page=2&limit=20` → `{ page:2, limit:20, offset:20 }`

---

## ⚡ FOLDER `workers/` - Tác Nhân Chạy Nền

### `workers/index.js` - BullMQ Workers

**Bài toán**: Nếu user chọn ghế nhưng không thanh toán → đơn phải tự hủy sau 15 phút.

**Giải pháp**: Dùng BullMQ tạo 1 job lặp lại mỗi 60 giây:
```
Mỗi phút:
1. Worker chạy hàm expireOverdueBookings()
2. Tìm tất cả booking có status='pending' và hold_expires_at đã qua
3. Cập nhật status='expired'
4. Xóa seat_lock Redis → ghế trống trở lại
```

---

## 🌱 FOLDER `database/` - Tạo và Seed Data

### `database/migrate.js`
```
npm run migrate
```
Chạy `sequelize.sync({ alter: false })`:
- Với mỗi model, tạo bảng trong MySQL nếu chưa tồn tại
- **Không xóa** dữ liệu có sẵn
- Không thay đổi bảng đã có (cần dùng alter/migration thật nếu cần thay đổi cấu trúc)

### `database/seed.js`
```
npm run seed
```
Nhét dữ liệu mẫu để test:
- 3 hạng thành viên (Bạch Kim, Vàng, Kim Cương)
- 1 admin user (admin@cinestar.vn / Admin@123)
- 7 thể loại phim
- 3 loại ghế (Thường, VIP, Couple)
- 1 rạp mẫu + 1 phòng mẫu

---

## 🔄 LUỒNG ĐẶT VÉ ĐẦY ĐỦ (End-to-End)

```
1. User xem phim: GET /api/v1/movies?status=now_showing
2. User xem suất chiếu: GET /api/v1/movies/5/showtimes?date=2026-05-01
3. User xem sơ đồ ghế: GET /api/v1/showtimes/12/seats
   → Trả về từng ghế với status: available/held/booked + giá

4. User chọn ghế A1, A2 → POST /api/v1/bookings/hold
   Body: { showtime_id: 12, seat_ids: [1, 2], combo_items: [{combo_id: 1, quantity: 2}] }
   → Redis: SET seat_lock:showtime_12:seat_1 = userId EX 300
   → Redis: SET seat_lock:showtime_12:seat_2 = userId EX 300
   → MySQL: INSERT bookings (status=pending, hold_expires_at=+5min)
   → Trả về: { booking_id, booking_code, hold_expires_at }

5. User nhập mã giảm giá → POST /api/v1/promotions/validate
   Body: { code: 'TET2025', amount: 150000 }
   → Kiểm tra voucher hợp lệ, tính discount

6. User bấm thanh toán → POST /api/v1/bookings/checkout
   Body: { booking_id: 123, voucher_code: 'TET2025' }
   → Redis: EXPIRE seat_lock:... 900 (gia hạn 15 phút)
   → MySQL: UPDATE bookings SET discount=30000, total=120000, hold_expires_at=+15min
   → Tạo URL VNPay
   → Trả về: { paymentUrl: 'https://sandbox.vnpayment.vn/...' }

7. User redirect đến VNPay, điền thẻ, thanh toán

8. VNPay IPN callback → POST /api/v1/payments/vnpay/ipn (server gọi ngầm)
   → Verify HMAC-SHA512
   → MySQL: INSERT payments (status=success)
   → MySQL: UPDATE bookings (status=paid)
   → Redis: key tự hết hạn (ghế đã booked trong DB rồi)

9. VNPay redirect user về → GET /api/v1/payments/vnpay/return
   → Verify signature
   → Redirect về Frontend: /booking/result?status=success&booking_code=CS-XXXX

10. User xem vé: GET /api/v1/bookings/CS-XXXX
```

---

## 💡 CÁC KHÁI NIỆM KỸ THUẬT CẦN HIỂU

### JWT (JSON Web Token)
- **Access Token**: Như thẻ ra vào, hết hạn sau 7 ngày. Gửi kèm mỗi request trong header `Authorization: Bearer <token>`
- **Refresh Token**: Như thẻ làm lại, hết hạn 30 ngày. Dùng để lấy access token mới khi hết hạn. Lưu trong DB.
- Khi logout: xóa refresh token trong DB → không thể lấy access token mới nữa

### BCrypt
- Thuật toán hash 1 chiều — không thể reverse về mật khẩu gốc
- Cost factor 12 = 2^12 = 4096 vòng lặp → chậm có chủ đích → brute force mất nhiều thời gian
- `bcrypt.hash(password, 12)` → tạo hash
- `bcrypt.compare(input, hash)` → kiểm tra mà không cần giải mã

### Redis SET NX
- `SET key value NX` → "Set nếu Not eXists" — atomic operation
- Nếu key chưa tồn tại: SET thành công, return "OK"
- Nếu key đã tồn tại: return NULL → ghế đang bị người khác giữ
- Không thể có race condition vì Redis xử lý single-threaded

### Database Transaction
- `BEGIN TRANSACTION` → Bắt đầu
- Thực hiện nhiều query
- `COMMIT` → Xác nhận tất cả cùng lúc
- Nếu có lỗi → `ROLLBACK` → hoàn tác toàn bộ
- Đảm bảo "all or nothing" — không có trạng thái dữ liệu nửa vời

### HMAC-SHA512 (VNPay)
- VNPay ký request bằng secret key chỉ bạn và VNPay biết
- Khi nhận IPN, bạn tính lại chữ ký và so sánh
- Nếu khớp → request thật từ VNPay
- Nếu không khớp → ai đó giả mạo → bỏ qua

---

## 📝 GHI CHÚ QUAN TRỌNG

1. **REDIS_HOST trong .env phải bỏ `https://`** — chỉ ghi hostname thuần
2. **DB_PORT cho TiDB Cloud là 4000**, không phải 3306
3. **Luôn chạy migrate trước seed**: bảng cần tồn tại trước khi nhét dữ liệu
4. **Môi trường development**: Sequelize log SQL ra console (tắt khi production)
5. **Admin account sau seed**: `admin@cinestar.vn` / `Admin@123`
6. **Health check**: `GET http://localhost:3000/health` — kiểm tra server còn sống
