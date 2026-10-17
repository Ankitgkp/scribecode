import { describe, expect, it } from "vitest";

import { dependencyGraphQuerySchema } from "@/modules/graph/graph.schema";

describe("dependencyGraphQuerySchema", () => {
  it("defaults the limit and refresh flag", () => {
    expect(dependencyGraphQuerySchema.parse({})).toEqual({ limit: 60, refresh: false });
  });

  it("parses refresh flags coming from the query string", () => {
    expect(dependencyGraphQuerySchema.parse({ refresh: "true" }).refresh).toBe(true);
    expect(dependencyGraphQuerySchema.parse({ refresh: "false" }).refresh).toBe(false);
  });

  it("rejects a malformed refresh flag", () => {
    expect(() => dependencyGraphQuerySchema.parse({ refresh: "yes" })).toThrow();
  });

  it("coerces the limit and keeps it within bounds", () => {
    expect(dependencyGraphQuerySchema.parse({ limit: "120" }).limit).toBe(120);
    expect(() => dependencyGraphQuerySchema.parse({ limit: "9999" })).toThrow();
  });
});
