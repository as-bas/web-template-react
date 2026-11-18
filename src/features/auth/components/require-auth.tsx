import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "@/app/hooks";
import { FullPageLoader } from "@/components/common/full-page-loader";
import { selectAuthStatus } from "@/features/auth/auth-slice";

// Route guard: children render only for a signed-in user.
export function RequireAuth() {
  const status = useAppSelector(selectAuthStatus);
  const location = useLocation();

  if (status === "restoring") return <FullPageLoader />;
  if (status === "guest") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
