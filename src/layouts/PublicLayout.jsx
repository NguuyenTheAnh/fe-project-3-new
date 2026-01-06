import { Outlet } from "react-router-dom";
import Footer from "@/components/app/Footer";
import Header from "@/components/app/Header";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
