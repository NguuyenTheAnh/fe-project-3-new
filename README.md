# Learning Management System (LMS) - Frontend

Hệ thống quản lý học tập trực tuyến (Learning Management System) được xây dựng bằng React và Vite. Dự án cung cấp nền tảng hoàn chỉnh cho việc tạo, quản lý và học các khóa học trực tuyến.

## Tính năng chính

### Hệ thống đa vai trò

- **Admin**: Quản lý toàn bộ hệ thống (người dùng, khóa học, danh mục, báo cáo)
- **Instructor (Giảng viên)**: Tạo và quản lý khóa học, bài giảng, quiz, trả lời câu hỏi
- **Student (Học viên)**: Đăng ký khóa học, học tập, làm bài tập và đánh giá

### Quản lý khóa học

- Tạo và chỉnh sửa khóa học với nhiều bài giảng
- Hỗ trợ video, tài liệu, và nội dung đa phương tiện
- Tổ chức curriculum (chương, bài học)
- Hệ thống reorder (sắp xếp lại) nội dung
- Xem trước khóa học trước khi xuất bản

### Hệ thống Quiz & Bài tập

- Tạo quiz với nhiều loại câu hỏi
- Theo dõi kết quả và tiến độ học tập
- Quản lý ngân hàng câu hỏi
- Hệ thống chấm điểm tự động

### Q&A (Hỏi đáp)

- Học viên đặt câu hỏi trong khóa học
- Giảng viên và học viên khác có thể trả lời
- Hệ thống thông báo và theo dõi

### Đánh giá & Phản hồi

- Học viên đánh giá khóa học
- Hệ thống rating và review
- Quản lý phản hồi từ admin

### Thanh toán

- Giỏ hàng (Cart)
- Tích hợp cổng thanh toán VNPay
- Theo dõi đơn hàng và lịch sử giao dịch

### Dashboard & Báo cáo

- Dashboard cho từng vai trò
- Thống kê tiến độ học tập
- Báo cáo doanh thu (cho admin/instructor)
- Hệ thống report vi phạm

## Công nghệ sử dụng

### Core

- **React 19** - Thư viện UI
- **Vite 7** - Build tool và dev server
- **React Router DOM 7** - Routing
- **Axios** - HTTP client

### UI Components

- **Radix UI** - Accessible component primitives
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Shadcn/ui** - Re-usable components

### State & Context

- **React Context API** - AuthContext, CartContext
- **Custom Hooks** - useEnrollmentStatus, useFileUrl, useMyEnrollments

### Utilities

- **class-variance-authority** - CSS class variants
- **clsx & tailwind-merge** - Class name utilities
- **jwt-decode** - JWT token decoding

## Cấu trúc thư mục

```
fe-new/
├── public/               # Static assets
├── src/
│   ├── api/             # API client modules
│   │   ├── auth.api.js
│   │   ├── catalog.api.js
│   │   └── files.api.js
│   ├── app/
│   │   └── router.jsx   # Route configuration
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # React components
│   │   ├── app/         # App-level components
│   │   ├── auth/        # Authentication components
│   │   ├── catalog/     # Course catalog components
│   │   └── ui/          # Reusable UI components
│   ├── contexts/        # React contexts
│   │   ├── AuthContext.jsx
│   │   └── CartContext.jsx
│   ├── hooks/           # Custom React hooks
│   ├── layouts/         # Layout components
│   │   ├── AdminLayout.jsx
│   │   ├── InstructorLayout.jsx
│   │   ├── StudentLayout.jsx
│   │   └── PublicLayout.jsx
│   ├── lib/             # Utility libraries
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin pages
│   │   ├── auth/        # Login, Register
│   │   ├── instructor/  # Instructor pages
│   │   ├── public/      # Public pages
│   │   ├── shared/      # Shared pages
│   │   └── student/     # Student pages
│   ├── services/        # API service layer
│   │   ├── course.service.js
│   │   ├── quiz.service.js
│   │   ├── progress.service.js
│   │   └── ...
│   └── util/            # Utility functions
├── package.json
├── vite.config.js
└── README.md
```

## Cài đặt và Chạy dự án

### Yêu cầu

- Node.js 16+
- npm hoặc yarn

### Các bước cài đặt

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd fe-new
   ```

2. **Cài đặt dependencies**

   ```bash
   npm install
   ```

3. **Cấu hình môi trường**

   - Tạo file `.env` từ `.env.example`
   - Cấu hình API endpoint và các biến môi trường cần thiết

4. **Chạy development server**

   ```bash
   npm run dev
   ```

   Ứng dụng sẽ chạy tại `http://localhost:5173`

5. **Build cho production**

   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

## Scripts

| Command           | Mô tả                                  |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Chạy development server với hot reload |
| `npm run build`   | Build ứng dụng cho production          |
| `npm run preview` | Preview production build locally       |
| `npm run lint`    | Chạy ESLint để kiểm tra code           |

## Authentication

Dự án sử dụng JWT (JSON Web Token) để xác thực:

- Token được lưu trong localStorage
- AuthContext quản lý trạng thái đăng nhập
- Protected routes với RequireAuth và RequireRole components
- Tự động refresh token khi hết hạn

## Routing

Hệ thống routing được tổ chức theo vai trò:

- `/` - Trang chủ công khai
- `/login`, `/register` - Xác thực
- `/courses/:id` - Chi tiết khóa học
- `/search` - Tìm kiếm khóa học

**Student Routes** (`/student/*`)

- `/student/my-learning` - Khóa học của tôi
- `/student/learn/:courseId` - Học khóa học
- `/student/cart` - Giỏ hàng
- `/student/profile` - Hồ sơ cá nhân

**Instructor Routes** (`/instructor/*`)

- `/instructor/courses` - Quản lý khóa học
- `/instructor/curriculum/:courseId` - Quản lý nội dung khóa học
- `/instructor/questions` - Quản lý câu hỏi từ học viên

**Admin Routes** (`/admin/*`)

- `/admin/users` - Quản lý người dùng
- `/admin/courses` - Quản lý khóa học
- `/admin/categories` - Quản lý danh mục
- `/admin/reports` - Báo cáo và thống kê

## UI/UX

- Responsive design với Tailwind CSS
- Dark mode support (nếu có)
- Accessible components từ Radix UI
- Modern và clean interface
- Loading states và error handling
- Toast notifications

## API Integration

Dự án tích hợp với backend API:

- RESTful API
- Axios interceptors cho auth và error handling
- Service layer pattern cho clean architecture
- File upload support

## Testing

```bash
# Chạy tests (nếu có cấu hình)
npm run test
```

## Contributing

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## Code Style

- ESLint được cấu hình sẵn
- Sử dụng Prettier để format code
- Follow React best practices
- Component-based architecture

## Known Issues

- React Compiler chưa tương thích với SWC
- Xem issues tracker để biết thêm chi tiết

## Documentation

- [API Documentation](./API-be-lms.postman_collection.json) - Postman Collection
- [Dashboard Implementation](./DASHBOARD_IMPLEMENTATION.md) - Chi tiết implementation
- Các file txt chứa API specs và requirements

## License

Private project - All rights reserved

## Maintainers

- [Your Name/Team]

## Acknowledgments

- React Team
- Vite Team
- Radix UI
- Tailwind CSS Team
- All contributors

---

**Note**: Đây là dự án LMS frontend, cần backend API để hoạt động đầy đủ.
