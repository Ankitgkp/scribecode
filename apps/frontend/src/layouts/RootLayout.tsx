import { Outlet } from "react-router";

import { AppHeader } from "@/components/AppHeader";
import { APP_NAME } from "@/config/app";

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader />
      <main className="w-full flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-xs text-muted-foreground">
          {APP_NAME} — explore unfamiliar codebases visually.
        </div>
      </footer>
    </div>
  );
}
