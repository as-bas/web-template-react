import { APP_NAME } from "@/config/app";
import { cn } from "@/lib/utils";

export function AppLogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      aria-hidden="true"
      className={cn("size-7 shrink-0", className)}
    />
  );
}

export function AppLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold", className)}>
      <AppLogoMark />
      <span className="truncate">{APP_NAME}</span>
    </span>
  );
}
