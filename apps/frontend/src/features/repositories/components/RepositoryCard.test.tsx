import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { RepositoryCard } from "@/features/repositories/components/RepositoryCard";
import type { ConnectedRepository } from "@/features/repositories/types";

const repository: ConnectedRepository = {
  id: "repo-1",
  owner: "example",
  name: "my-app",
  fullName: "example/my-app",
  description: "An example application",
  defaultBranch: "main",
  language: "TypeScript",
  isPrivate: true,
  updatedAt: "2026-10-18T00:00:00.000Z",
};

describe("RepositoryCard", () => {
  it("shows real repository details and opens the workspace", () => {
    render(
      <MemoryRouter>
        <RepositoryCard repository={repository} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Explore example/my-app" })).toHaveAttribute(
      "href",
      "/repositories/example/my-app",
    );
    expect(screen.getByText("An example application")).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.queryByText(/stars|forks/i)).not.toBeInTheDocument();
  });
});
