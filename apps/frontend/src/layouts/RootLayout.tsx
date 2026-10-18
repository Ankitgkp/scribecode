import { Outlet, useMatch, useSearchParams } from "react-router";

import { AppHeader } from "@/components/AppHeader";
import { APP_NAME } from "@/config/app";
import { useSession } from "@/features/auth/session-context";
import { cn } from "@/lib/utils";

export function RootLayout() {
  const repository = useMatch("/repositories/:owner/:name");
  const { status } = useSession();
  const [params] = useSearchParams();
  const focus =
    status === "authenticated" && Boolean(repository) && !["tour", "map", "explore"].includes(params.get("view") ?? "");
  return (
    <div
      className={cn("flex flex-col bg-background text-foreground", focus ? "h-dvh overflow-hidden" : "min-h-screen")}
    >
      <AppHeader />
      <main
        className={cn("w-full flex-1", focus ? "flex min-h-0 flex-col overflow-hidden px-2 py-2 sm:px-4" : "px-4 py-8")}
      >
        <Outlet />
      </main>
      {!focus ? (
        <footer className="border-t">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-xs text-muted-foreground">
            {APP_NAME} — explore unfamiliar codebases visually.
          </div>
        </footer>
      ) : null}
    </div>
  );
}
