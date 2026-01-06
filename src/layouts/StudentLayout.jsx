import { Outlet } from "react-router-dom";
import Header from "@/components/app/Header";

export default function StudentLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
}
