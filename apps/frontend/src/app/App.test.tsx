import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "@/app/App";
import { router } from "@/app/router";
import type { SessionPayload } from "@/features/auth/types";

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function stubSession(session: SessionPayload) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(jsonResponse({ success: true, data: session }))),
  );
}

describe("landing page", () => {
  afterEach(async () => {
    await act(async () => {
      await router.navigate("/");
    });
    vi.unstubAllGlobals();
  });

  it("shows the product story and GitHub connection paths for a signed-out visitor", async () => {
    stubSession({ authenticated: false, user: null });
    render(<App />);

    expect(await screen.findAllByRole("link", { name: "Scribecode" })).not.toHaveLength(0);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("See the system");
    expect(screen.getByRole("heading", { name: "From repository to understanding." })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /Connect GitHub/i })
        .some((link) => link.getAttribute("href") === "/api/v1/auth/github"),
    ).toBe(true);
    expect(screen.getByLabelText("Personal access token")).toBeInTheDocument();
    expect(screen.getByLabelText("Or paste a public repo")).toBeInTheDocument();
  });

  it("takes a signed-in visitor to their repositories", async () => {
    stubSession({
      authenticated: true,
      user: { id: "1", login: "alex", name: "Alex", email: null, avatarUrl: null, connected: true },
    });
    render(<App />);

    expect(await screen.findByRole("link", { name: /Open workspace/i })).toHaveAttribute("href", "/repositories");
    expect(screen.getByRole("link", { name: /Choose a repository/i })).toHaveAttribute("href", "/repositories");
    expect(screen.queryByLabelText("Personal access token")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Or paste a public repo")).toBeInTheDocument();
  });

  it("does not show an active connection action while the session loads", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<App />);

    expect(screen.getAllByText("Checking session…").length).toBeGreaterThan(0);
    expect(
      screen
        .queryAllByRole("link", { name: /Connect GitHub/i })
        .some((link) => link.getAttribute("href") === "/api/v1/auth/github"),
    ).toBe(false);
  });

  it("keeps the OAuth error visible on return from GitHub", async () => {
    stubSession({ authenticated: false, user: null });
    await act(async () => {
      await router.navigate("/?authError=oauth_failed");
    });
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not complete the GitHub sign-in");
  });
});
