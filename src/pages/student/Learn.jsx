import { useParams } from "react-router-dom";

export default function Learn() {
  const { courseId } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Học</h1>
      <p className="mt-2 text-sm text-slate-600">
        {courseId ? `Đang học khóa ${courseId}` : "Khu vực học tập"}
      </p>
    </div>
  );
}
