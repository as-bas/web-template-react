import { Outlet } from "react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { AppSidebar } from "@/layouts/dashboard/app-sidebar";
import { PageHeader } from "@/layouts/dashboard/page-header";

// Signed-in app shell: left sidebar + page header + page content.
export function DashboardLayout() {
  useDocumentTitle();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader />
        <main className="flex flex-1 flex-col gap-4 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
