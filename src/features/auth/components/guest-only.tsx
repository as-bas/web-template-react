import type { Location } from "react-router";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "@/app/hooks";
import { FullPageLoader } from "@/components/common/full-page-loader";
import { selectAuthStatus } from "@/features/auth/auth-slice";

// Route guard: login & co. Signed-in users go back where they came from.
export function GuestOnly() {
  const status = useAppSelector(selectAuthStatus);
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;

  if (status === "restoring") return <FullPageLoader />;
  if (status === "authenticated") {
    return <Navigate to={from ?? "/"} replace />;
  }
  return <Outlet />;
}
