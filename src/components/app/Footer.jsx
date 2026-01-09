import { Link } from "react-router-dom";
import Logo from "@/components/app/Logo";

const linkClassName =
  "block text-sm text-slate-600 leading-6 hover:text-[#E11D48] transition";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Về HUSTemy
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <Link to="#" className={linkClassName}>
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link to="#" className={linkClassName}>
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to="#" className={linkClassName}>
                  Điều khoản
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Dành cho học viên
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <Link to="/search" className={linkClassName}>
                  Tìm khóa học
                </Link>
              </li>
              <li>
                <Link to="/me/learning" className={linkClassName}>
                  Khóa học của tôi
                </Link>
              </li>
              <li>
                <Link to="#" className={linkClassName}>
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Dành cho giảng viên
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <Link to="/instructor" className={linkClassName}>
                  Bảng điều khiển
                </Link>
              </li>
              <li>
                <Link to="#" className={linkClassName}>
                  Tạo khóa học
                </Link>
              </li>
              <li>
                <Link to="#" className={linkClassName}>
                  Hướng dẫn giảng dạy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <Logo />
              <p className="text-sm text-slate-600">
                Học nhanh hơn, giỏi hơn mỗi ngày.
              </p>
            </div>
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} HUSTemy. Bảo lưu mọi quyền.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
