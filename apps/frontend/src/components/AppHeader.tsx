import { type ComponentProps, type ElementType, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { Boxes, Moon, Sun } from "lucide-react";

import { useTheme } from "@/app/theme-context";
import CardNavSource from "@/components/CardNav";
import { APP_NAME } from "@/config/app";
import { githubOAuthUrl } from "@/features/auth/api";
import { useSession } from "@/features/auth/session-context";
import { useRepositoryWorkspace } from "@/features/repositories/repository-workspace-context";

type NavLinkProps = Omit<ComponentProps<"a">, "href"> & { href?: string };

type CardNavItem = {
  label: string;
  description?: string;
  links: { label: string; href?: string; ariaLabel?: string }[];
};

type CardNavProps = {
  ariaLabel: string;
  className?: string;
  logo: ReactNode;
  logoAlt: string;
  logoHref: string;
  items: CardNavItem[];
  cta?: { label: string; href?: string; onClick?: () => void };
  theme: "dark" | "light";
  surface: "glass" | "solid";
  openOn: "click" | "hover";
  cardEffect: "rise" | "unfold" | "fade";
  cardHeight: number;
  maxWidth: number;
  accentColor: string;
  linkComponent: ElementType;
  onLinkClick?: (link: CardNavItem["links"][number]) => void;
};

const CardNav = CardNavSource as unknown as (props: CardNavProps) => ReactNode;

function RouterLink({ href = "/", ...props }: NavLinkProps) {
  // API links must trigger a document navigation so OAuth can follow the
  // backend's redirect. React Router would otherwise handle them as app routes.
  if (/^(https?:)?\/\//.test(href) || href.startsWith("/api/")) {
    return <a href={href} {...props} />;
  }

  return <Link to={href} {...props} />;
}

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { status, user, signOut } = useSession();
  const home = useLocation().pathname === "/";
  const workspace = useRepositoryWorkspace();
  const activeRepository =
    workspace?.repository.status === "success" ? workspace.repository.data : null;

  const items = [
    {
      label: home ? "Explore Scribecode" : "Navigate",
      description: home
        ? "Move from unfamiliar files to the architecture behind them."
        : "Find the right view for your next question.",
      links: home
        ? [
            { label: "How it works", href: "#features" },
            { label: "File explanations", href: "#explain" },
            { label: "Architecture map", href: "#architecture" },
          ]
        : [
            { label: "Home", href: "/" },
            { label: "Repositories", href: "/repositories" },
          ],
    },
    activeRepository
      ? {
          label: activeRepository.fullName,
          description: activeRepository.description ?? "Open the repository workspace and trace its connections.",
          links: [
            { label: "Open project", href: `/repositories/${activeRepository.owner}/${activeRepository.name}` },
            { label: "Back to repositories", href: "/repositories" },
          ],
        }
      : {
          label: "Your workspace",
          description: "Connect a repository to explore its files, modules, and interview story.",
          links: [{ label: "Browse repositories", href: "/repositories" }],
        },
    {
      label: status === "authenticated" && user ? user.login : "GitHub connection",
      description:
        status === "authenticated" && user
          ? "Your connected GitHub account powers your repository workspace."
          : "Connect GitHub to start exploring a repository.",
      links:
        status === "authenticated" && user
          ? [{ label: "Sign out" }]
          : [{ label: "Connect GitHub", href: githubOAuthUrl() }],
    },
  ];

  const cta = activeRepository && workspace
    ? {
        label: workspace.syncing ? "Syncing…" : "Sync project",
        onClick: () => void workspace.sync(),
      }
    : status === "authenticated"
      ? { label: "Open workspace", href: "/repositories" }
      : status === "anonymous"
        ? { label: "Connect GitHub", href: githubOAuthUrl() }
        : undefined;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-40">
      <div className="pointer-events-auto mx-auto flex w-full max-w-[780px] items-center gap-2 px-3 sm:px-5">
        <CardNav
          ariaLabel="Scribecode navigation"
          className="scribecode-card-nav min-w-0 flex-1"
          logo={
            <span className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-7 place-items-center border border-current/30 bg-current/8 text-[#477842] dark:text-[#c8f39a]">
                <Boxes className="size-4" />
              </span>
              <span>{APP_NAME}</span>
            </span>
          }
          logoAlt={APP_NAME}
          logoHref="/"
          items={items}
          cta={cta}
          theme={theme}
          surface="glass"
          openOn="click"
          cardEffect="rise"
          cardHeight={148}
          maxWidth={720}
          accentColor="#c8f39a"
          linkComponent={RouterLink}
          onLinkClick={(link: { label: string }) => {
            if (link.label === "Sign out") void signOut();
          }}
        />
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="grid size-10 shrink-0 place-items-center rounded-[0.65rem] border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:bg-[#151a14]"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>
    </header>
  );
}
