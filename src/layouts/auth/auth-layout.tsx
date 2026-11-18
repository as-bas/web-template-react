import { Outlet } from "react-router";
import { AppLogo } from "@/components/common/app-logo";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import { APP_NAME } from "@/config/app";
import { useDocumentTitle } from "@/hooks/use-document-title";

// Guest pages (login, ...): logo and switchers on top, the page centered.
export function AuthLayout() {
  useDocumentTitle();

  return (
    <div className="flex min-h-svh flex-col bg-muted px-6 py-8 sm:px-12">
      <header className="flex items-center justify-between gap-4">
        <AppLogo />
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>
      <main className="flex flex-1 items-center py-12">
        <div className="mx-auto w-full max-w-sm">
          <Outlet />
        </div>
      </main>
      <footer className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  );
}
