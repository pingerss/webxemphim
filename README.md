#  BE WebXemPhim - Backend API

Backend RESTful API cho hệ thống đặt vé xem phim trực tuyến, xây dựng với **Node.js + Express + MySQL + Redis**.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4 |
| Database | MySQL 8 + Sequelize ORM |
| Cache / Lock | Redis + ioredis |
| Job Queue | BullMQ |
| Auth | JWT (Access + Refresh Token) |
| Payment | VNPay |
| Upload | Multer + Cloudinary |
| Email | Nodemailer |
| Logging | Winston |

##  Cấu Trúc Thư Mục

```
src/
├── app.js                  # Express app config
├── server.js               # Entry point
├── config/                 # Cấu hình DB, Redis, Logger, Cloudinary, Mailer
├── models/                 # 19 Sequelize Models + associations
├── routes/                 # Route definitions (public, customer, admin)
├── controllers/            # Thin HTTP layer
│   └── admin/              # Admin-specific controllers
├── services/               # Business logic core
├── middlewares/            # Auth, Error, Upload, Validate
├── utils/                  # JWT, ApiResponse, AppError, Helpers
├── workers/                # BullMQ jobs (auto-expire booking)
└── database/               # migrate.js, seed.js
```

##  Cài Đặt & Chạy

### 1. Cài dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
```bash
# Sửa file .env với thông tin DB, Redis, VNPay của bạn
```

### 3. Tạo database MySQL
```sql
CREATE DATABASE webxemphim_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Migrate tables
```bash
npm run migrate
```

### 5. Seed dữ liệu mẫu
```bash
npm run seed
# Admin: admin@cinestar.vn / Admin@123
```

### 6. Khởi động server
```bash
npm run dev   # Development (nodemon)
npm start     # Production
```

## 📡 API Endpoints

### Public
| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/v1/movies` | Danh sách phim (filter: status, genre, search) |
| GET | `/api/v1/movies/now-showing` | Phim đang chiếu |
| GET | `/api/v1/movies/coming-soon` | Phim sắp chiếu |
| GET | `/api/v1/movies/:id` | Chi tiết phim |
| GET | `/api/v1/movies/:id/showtimes` | Lịch chiếu theo phim |
| GET | `/api/v1/showtimes/:id/seats` | Sơ đồ ghế real-time |
| GET | `/api/v1/cinemas` | Danh sách rạp |
| GET | `/api/v1/genres` | Danh sách thể loại |

### Authentication
| Method | URL | Mô tả |
|--------|-----|--------|
| POST | `/api/v1/auth/register` | Đăng ký |
| POST | `/api/v1/auth/login` | Đăng nhập |
| POST | `/api/v1/auth/refresh` | Làm mới token |
| POST | `/api/v1/auth/forgot-password` | Quên mật khẩu |
| POST | `/api/v1/auth/logout` | Đăng xuất |

### Customer (JWT required)
| Method | URL | Mô tả |
|--------|-----|--------|
| POST | `/api/v1/bookings/hold` | Giữ ghế 5 phút |
| POST | `/api/v1/bookings/checkout` | Tạo link VNPay, gia hạn 15' |
| GET | `/api/v1/bookings/my` | Lịch sử đặt vé |
| DELETE | `/api/v1/bookings/:id/cancel` | Hủy đơn |
| GET | `/api/v1/users/me` | Thông tin tài khoản |

### Admin (JWT + Admin role)
| Method | URL | Mô tả |
|--------|-----|--------|
| CRUD | `/api/v1/admin/movies` | Quản lý phim |
| CRUD | `/api/v1/admin/cinemas` | Quản lý rạp |
| CRUD | `/api/v1/admin/showtimes` | Quản lý lịch chiếu |
| POST | `/api/v1/admin/rooms/:id/seats/generate` | Tự động tạo ghế |
| GET | `/api/v1/admin/dashboard/stats` | Thống kê tổng quan |

## 🔑 Cơ Chế Giữ Ghế (Seat Locking)

```
Chọn ghế → POST /bookings/hold
    ↓
Redis SET NX(seat_lock:showtime_X:seat_Y, userId, EX 300)
    ↓ (nếu thành công)
DB Transaction: CREATE Booking + BookingTickets
    ↓
Thanh toán → POST /bookings/checkout  
    ↓
Redis EXPIRE key lên 900s (15 phút)
    ↓
VNPay IPN callback → Verify HMAC-SHA512 → UPDATE Booking status=paid
    ↓ (nếu quá hạn không thanh toán)
BullMQ Worker (mỗi 60s) → Expire overdue → Xóa Redis key
```
