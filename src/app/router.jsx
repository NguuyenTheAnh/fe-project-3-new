import { createBrowserRouter } from "react-router-dom";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireRole from "@/components/auth/RequireRole";
import AdminLayout from "@/layouts/AdminLayout";
import InstructorLayout from "@/layouts/InstructorLayout";
import PublicLayout from "@/layouts/PublicLayout";
import RootLayout from "@/layouts/RootLayout";
import StudentLayout from "@/layouts/StudentLayout";
import AdminHome from "@/pages/admin/AdminHome";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminCurriculum from "@/pages/admin/AdminCurriculum";
import AdminTags from "@/pages/admin/AdminTags";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import InstructorCourses from "@/pages/instructor/InstructorCourses";
import InstructorCurriculum from "@/pages/instructor/InstructorCurriculum";
import InstructorHome from "@/pages/instructor/InstructorHome";
import CourseDetail from "@/pages/public/CourseDetail";
import Home from "@/pages/public/Home";
import Search from "@/pages/public/Search";
import Learn from "@/pages/student/Learn";
import MyLearning from "@/pages/student/MyLearning";

function NotFound() {
  return (
    <div className="p-6 text-2xl font-semibold tracking-tight text-slate-600">
      Không tìm thấy trang (404)
      <div className="mt-2 text-sm font-normal">
        Trang bạn yêu cầu không tồn tại.
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "search", element: <Search /> },
          { path: "courses/:courseId", element: <CourseDetail /> },
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
        ],
      },
      {
        path: "me",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["ROLE_STUDENT"]}>
              <StudentLayout />
            </RequireRole>
          </RequireAuth>
        ),
        children: [{ path: "learning", element: <MyLearning /> }],
      },
      {
        path: "learn/:courseId",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["ROLE_STUDENT"]}>
              <StudentLayout />
            </RequireRole>
          </RequireAuth>
        ),
        children: [{ index: true, element: <Learn /> }],
      },
      {
        path: "instructor",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["ROLE_INSTRUCTOR"]}>
              <InstructorLayout />
            </RequireRole>
          </RequireAuth>
        ),
        children: [
          { index: true, element: <InstructorHome /> },
          { path: "courses", element: <InstructorCourses /> },
          {
            path: "courses/:courseId/curriculum",
            element: <InstructorCurriculum />,
          },
        ],
      },
      {
        path: "admin",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["ROLE_ADMIN"]}>
              <AdminLayout />
            </RequireRole>
          </RequireAuth>
        ),
        children: [
          { index: true, element: <AdminHome /> },
          { path: "courses", element: <AdminCourses /> },
          { path: "courses/:courseId/curriculum", element: <AdminCurriculum /> },
          { path: "categories", element: <AdminCategories /> },
          { path: "tags", element: <AdminTags /> },
        ],
      },
    ],
  },
]);
