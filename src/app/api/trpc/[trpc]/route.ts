import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/router";
import { createContext } from "@/server/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      // eslint-disable-next-line no-console
      console.error(`[trpc] ${path ?? "<unknown>"}:`, error);
    },
  });

export { handler as GET, handler as POST };
