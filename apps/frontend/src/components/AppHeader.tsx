import { Link, NavLink } from "react-router";
import { Boxes, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/app";
import { useSession } from "@/features/auth/session-context";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/repositories", label: "Repositories", end: false },
] as const;

export function AppHeader() {
  const { status, user, signOut } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Boxes className="size-5" />
          <span>{APP_NAME}</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}

          {status === "authenticated" && user ? (
            <div className="ml-2 flex items-center gap-2 border-l pl-3">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-6 rounded-full" /> : null}
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.login}</span>
              <Button variant="ghost" size="icon-sm" aria-label="Sign out" onClick={() => void signOut()}>
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
