import Sidebar from "@/components/admin/Sidebar";
import MobileTabBar from "@/components/admin/MobileTabBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 pb-[calc(112px+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
