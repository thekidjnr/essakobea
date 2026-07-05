import Sidebar from "@/components/admin/Sidebar";
import MobileTabBar from "@/components/admin/MobileTabBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-mist">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto pb-24 md:pb-0">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
