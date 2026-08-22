import { router } from "./trpc";
import { creditsRouter } from "./routers/credits";
import { meRouter } from "./routers/me";
import { postsRouter } from "./routers/posts";
import { mediaRouter } from "./routers/media";
import { brandRouter } from "./routers/brand";

export const appRouter = router({
  me: meRouter,
  credits: creditsRouter,
  posts: postsRouter,
  media: mediaRouter,
  brand: brandRouter,
});

export type AppRouter = typeof appRouter;
