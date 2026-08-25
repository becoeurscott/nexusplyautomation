import Stripe from "stripe";

let _stripe: Stripe | null = null;

function connect(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env locally or to your host's environment variables.",
    );
  }
  return new Stripe(key);
}

/**
 * Lazily-initialised Stripe client — same reasoning as the Proxy in
 * src/db/index.ts: nothing connects (or throws on a missing key) until the
 * first call, so `next build` can evaluate every route module without
 * STRIPE_SECRET_KEY being present.
 */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    if (!_stripe) _stripe = connect();
    const value = Reflect.get(_stripe, prop, receiver);
    return typeof value === "function" ? value.bind(_stripe) : value;
  },
});

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
