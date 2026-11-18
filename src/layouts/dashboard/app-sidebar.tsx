import type { ComponentProps } from "react";
import { AppLogo } from "@/components/common/app-logo";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "@/layouts/dashboard/nav-main";
import { NavUser } from "@/layouts/dashboard/nav-user";

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-4 py-3">
        <AppLogo className="group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex gap-2 px-2 group-data-[collapsible=icon]:hidden">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
