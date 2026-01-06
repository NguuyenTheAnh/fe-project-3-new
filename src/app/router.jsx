import { createBrowserRouter } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import InstructorLayout from "@/layouts/InstructorLayout";
import PublicLayout from "@/layouts/PublicLayout";
import RootLayout from "@/layouts/RootLayout";
import StudentLayout from "@/layouts/StudentLayout";
import AdminHome from "@/pages/admin/AdminHome";
import InstructorCourses from "@/pages/instructor/InstructorCourses";
import InstructorHome from "@/pages/instructor/InstructorHome";
import CourseDetail from "@/pages/public/CourseDetail";
import Home from "@/pages/public/Home";
import Login from "@/pages/public/Login";
import Register from "@/pages/public/Register";
import Search from "@/pages/public/Search";
import Learn from "@/pages/student/Learn";
import MyLearning from "@/pages/student/MyLearning";

function NotFound() {
  return (
    <div className="p-6 text-2xl font-semibold text-muted-foreground">
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
          { path: "course/:courseId", element: <CourseDetail /> },
          { path: "login", element: <Login /> },
          { path: "register", element: <Register /> },
        ],
      },
      {
        path: "me",
        element: <StudentLayout />,
        children: [{ path: "learning", element: <MyLearning /> }],
      },
      {
        path: "learn/:courseId",
        element: <StudentLayout />,
        children: [{ index: true, element: <Learn /> }],
      },
      {
        path: "instructor",
        element: <InstructorLayout />,
        children: [
          { index: true, element: <InstructorHome /> },
          { path: "courses", element: <InstructorCourses /> },
        ],
      },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [{ index: true, element: <AdminHome /> }],
      },
    ],
  },
]);
