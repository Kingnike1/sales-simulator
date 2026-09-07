import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Authentication is intentionally optional for the single-user MVP.
 * The application exposes only public simulation procedures today; a local
 * auth provider can be added later without coupling the request context to a
 * third-party identity service.
 */
export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<TrpcContext> {
  return { req: opts.req, res: opts.res, user: null };
}
