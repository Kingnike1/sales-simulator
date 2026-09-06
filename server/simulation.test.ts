import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("simulation.focusNeeds", () => {
  it("returns the ten supported specific-training needs", async () => {
    const caller = appRouter.createCaller(createContext());
    const needs = await caller.simulation.focusNeeds();
    expect(needs).toHaveLength(10);
    expect(needs).toContain("Quer aumentar geração de leads");
    expect(needs).toContain("Está comparando concorrentes");
  });
});

describe("simulation input contracts", () => {
  it("rejects a specific training without a selected need", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.simulation.start({ mode: "specific", difficulty: "medium" })).rejects.toThrow("Selecione uma necessidade");
  });
});
