import { useParams } from "react-router-dom";

export default function CourseDetail() {
  const { courseId } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Chi tiết khóa học</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {courseId ? `Mã khóa học: ${courseId}` : "Thông tin khóa học"}
      </p>
    </div>
  );
}
