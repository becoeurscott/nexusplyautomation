import Image from "next/image";
import { Reveal } from "./reveal";
import { Section } from "./section";

/**
 * Real social proof — testimonials, customer logos, review ratings.
 *
 * Every component here renders `null` while its data array is empty, and the
 * arrays ship empty on purpose. NexusPly has no customers yet, so there is
 * nothing truthful to display; a placeholder testimonial or an invented user
 * count would be a fabricated endorsement, which we will not ship.
 *
 * These are wired into the page already, so turning proof on later is a data
 * change in this file and nothing else. Only add entries that correspond to a
 * real, attributable customer who has agreed to be quoted.
 */

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export type CustomerLogo = {
  name: string;
  src: string;
  width: number;
  height: number;
};

export type ReviewRating = {
  /** e.g. 4.5 */
  score: number;
  outOf: number;
  count: number;
  /** Where the rating comes from, e.g. "G2". Required — an unsourced score is not proof. */
  source: string;
  href?: string;
};

/* Empty until we have real, attributable proof. See the note above. */
export const TESTIMONIALS: Testimonial[] = [];
export const CUSTOMER_LOGOS: CustomerLogo[] = [];
export const REVIEW_RATING: ReviewRating | null = null;

export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;
  return (
    <Section title="What our customers say">
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={Math.min(i * 0.05, 0.3)}>
            <figure className="nx-card nx-card--soft h-full p-6">
              <blockquote className="text-sm leading-relaxed text-slate-300">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold text-white">{t.name}</span>
                <span className="block text-xs text-slate-500">{t.role}</span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function LogoWall() {
  if (CUSTOMER_LOGOS.length === 0) return null;
  return (
    <Reveal className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
        Businesses using NexusPly
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70">
        {CUSTOMER_LOGOS.map((l) => (
          <Image
            key={l.name}
            src={l.src}
            alt={l.name}
            width={l.width}
            height={l.height}
            className="h-7 w-auto"
          />
        ))}
      </div>
    </Reveal>
  );
}

export function Rating() {
  if (!REVIEW_RATING) return null;
  const { score, outOf, count, source, href } = REVIEW_RATING;
  const body = (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200">
      <span className="text-[#f5c518]" aria-hidden>
        {"★".repeat(Math.round(score))}
      </span>
      {score.toFixed(1)}/{outOf} · {count.toLocaleString()} reviews on {source}
    </span>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    body
  );
}
