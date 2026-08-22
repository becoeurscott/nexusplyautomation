import { ZernioApiError } from "@/lib/zernio/client";

/**
 * Turns any thrown error into something a customer can actually act on.
 *
 * Two reasons this exists rather than rendering `error.message`:
 *
 *  1. Raw provider errors name our upstream vendors, and carry endpoint paths,
 *     status codes and JSON bodies. Customers are never meant to learn which
 *     services sit behind the product.
 *  2. "Request failed with status 502" tells a school administrator nothing.
 *     They need to know whether to retry, wait, or contact us.
 *
 * The real error is still logged server-side, so nothing is lost for debugging.
 */
export function friendlyError(error: unknown, context: string): string {
  console.error(`[${context}]`, error);

  if (error instanceof ZernioApiError) {
    const status = error.status;
    if (status === 401 || status === 403) {
      return "We couldn't reach your connected accounts. Our team has been notified — please try again shortly.";
    }
    if (status === 404) {
      return "We couldn't find that item. It may have been removed.";
    }
    if (status === 429) {
      return "That platform is asking us to slow down. Please wait a minute and try again.";
    }
    if (status >= 500) {
      return "One of the social platforms is having trouble right now. Please try again in a few minutes.";
    }
    return "That didn't go through. Please check your details and try again.";
  }

  if (error instanceof Error && /fetch|network|timeout|ECONN/i.test(error.message)) {
    return "We couldn't connect just now. Please check your internet and try again.";
  }

  return "Something went wrong on our side. Please try again — if it keeps happening, contact support.";
}
