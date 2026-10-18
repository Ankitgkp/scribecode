import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { AppHeader } from "@/components/AppHeader";
import { ThemeProvider } from "@/app/theme-context";
import { SessionContext } from "@/features/auth/session-context";
import {
  RepositoryWorkspaceContext,
  type RepositoryWorkspace,
} from "@/features/repositories/repository-workspace-context";

const user = { id: "1", login: "alex", name: "Alex", email: null, avatarUrl: null, connected: true };
const session = {
  status: "authenticated" as const,
  user,
  connectWithToken: async () => {},
  signOut: async () => {},
  refresh: async () => {},
};

const repository = {
  id: "1",
  owner: "alex",
  name: "project",
  fullName: "alex/project",
  description: "An example project",
  defaultBranch: "main",
  language: "TypeScript",
  isPrivate: false,
  updatedAt: "2026-10-18T00:00:00Z",
};

describe("AppHeader repository controls", () => {
  it("shows the repository and sync action on an open workspace", () => {
    const sync = vi.fn(async () => {});
    const workspace: RepositoryWorkspace = {
      repository: { status: "success", data: repository, error: null, reload: () => {} },
      syncToken: 0,
      syncing: false,
      syncError: null,
      sync,
    };

    render(
      <MemoryRouter initialEntries={["/repositories/alex/project"]}>
        <ThemeProvider>
          <SessionContext.Provider value={session}>
            <RepositoryWorkspaceContext.Provider value={workspace}>
              <AppHeader />
            </RepositoryWorkspaceContext.Provider>
          </SessionContext.Provider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByText("alex/project")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to repositories" })).toHaveAttribute("href", "/repositories");
    fireEvent.click(screen.getByRole("button", { name: "Sync project" }));
    expect(sync).toHaveBeenCalledOnce();
  });

  it("hides repository controls outside a workspace", () => {
    render(
      <MemoryRouter initialEntries={["/repositories"]}>
        <ThemeProvider>
          <SessionContext.Provider value={session}>
            <AppHeader />
          </SessionContext.Provider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: "Sync project" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.queryByText("alex/project")).not.toBeInTheDocument();
  });

  it("toggles between light and dark modes from the navbar", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ThemeProvider>
          <SessionContext.Provider value={session}>
            <AppHeader />
          </SessionContext.Provider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement).not.toHaveClass("dark");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
    expect(window.localStorage.getItem("scribecode-theme")).toBe("light");

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(document.documentElement).toHaveClass("dark");
  });
});
