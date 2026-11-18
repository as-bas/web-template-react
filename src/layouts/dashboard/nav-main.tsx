import { useTranslation } from "react-i18next";
import { matchPath, NavLink, useLocation } from "react-router";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getSidebarNav } from "@/config/navigation";

// "/" only matches itself; other entries also match their sub-paths.
const isActive = (pathname: string, url: string) =>
  matchPath({ path: url, end: url === "/" }, pathname) !== null;

export function NavMain() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {getSidebarNav(t).map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              asChild
              isActive={isActive(pathname, item.url)}
              tooltip={item.title}
            >
              <NavLink to={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
