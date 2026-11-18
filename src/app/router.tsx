import { createBrowserRouter } from "react-router";
import { GuestOnly } from "@/features/auth/components/guest-only";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { AuthLayout } from "@/layouts/auth/auth-layout";
import { DashboardLayout } from "@/layouts/dashboard/dashboard-layout";
import { ChangePasswordPage } from "@/pages/change-password/change-password-page";
import { HomePage } from "@/pages/home/home-page";
import { LoginPage } from "@/pages/login/login-page";
import { NotFoundPage } from "@/pages/not-found/not-found-page";
import type { RouteHandle } from "@/types/router";

// Guard -> layout -> pages. A new layout is another branch at this level.
export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/login",
            element: <LoginPage />,
            handle: { title: (t) => t("Log in") } satisfies RouteHandle,
          },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/",
            element: <HomePage />,
            handle: {
              title: (t) => t("Home"),
              description: (t) => t("Signed in through the API"),
            } satisfies RouteHandle,
          },
          {
            path: "/change-password",
            element: <ChangePasswordPage />,
            handle: {
              title: (t) => t("Change password"),
              description: (t) => t("Other devices are signed out"),
            } satisfies RouteHandle,
          },
          // Unknown paths. Guests get the login redirect first.
          {
            path: "*",
            element: <NotFoundPage />,
            handle: { title: (t) => t("Page not found") } satisfies RouteHandle,
          },
        ],
      },
    ],
  },
]);
