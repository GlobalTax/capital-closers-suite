import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { CRMAssistant } from "@/components/assistant/CRMAssistant";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <ChangePasswordModal />
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <Topbar />
          <main className="flex-1 p-3 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      <CRMAssistant />
    </SidebarProvider>
  );
}
