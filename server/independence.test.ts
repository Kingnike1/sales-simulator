import { describe, expect, it } from "vitest";
import { createContext } from "./_core/context";

describe("autonomous runtime", () => {
  it("creates a public context without requiring a third-party identity service", async () => {
    const context = await createContext({
      req: { headers: {}, protocol: "http" } as never,
      res: {} as never,
      info: {} as never,
    });
    expect(context.user).toBeNull();
  });
});
