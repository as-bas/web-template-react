import { ThemeProvider } from "next-themes";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router/dom";
import { router } from "@/app/router";
import { store } from "@/app/store";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_THEME } from "@/config/themes";

export function App() {
  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme={DEFAULT_THEME}
        enableSystem
      >
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </Provider>
  );
}
