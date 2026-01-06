import { Outlet } from "react-router-dom";

export default function DashboardLayout({ sidebar }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-64 shrink-0">
            <div className="sticky top-24 rounded-xl border bg-background p-3">
              {sidebar}
            </div>
          </aside>
          <main className="flex-1 min-w-0">
            <div className="rounded-xl border bg-background p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
