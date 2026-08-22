import Image from "next/image";
import { Reveal } from "./reveal";

/**
 * Template's 8-card testimonial wall, rendered as two marquee rows
 * (top row scrolls left, bottom row scrolls right) with the template avatars.
 */
type T = { name: string; role: string; quote: string; avatar: string };

const TESTIMONIALS: T[] = [
  {
    name: "Amina K.",
    role: "School Director, Nairobi",
    quote:
      "Our admissions page posts every day now — and I stopped paying three different tools in dollars.",
    avatar: "/img/nexus/avatar-1.jpg",
  },
  {
    name: "Chinedu O.",
    role: "Agency Founder, Lagos",
    quote:
      "Nexusply feels like an invisible operations manager handling our client publishing in the background.",
    avatar: "/img/nexus/avatar-2.jpg",
  },
  {
    name: "Fatou D.",
    role: "Creator, Dakar",
    quote:
      "The AI writes in MY voice because it reads my past posts first. Nothing else I tried does that.",
    avatar: "/img/nexus/avatar-3.jpg",
  },
  {
    name: "Kwame A.",
    role: "SMB Owner, Accra",
    quote:
      "Paying with MoMo instead of a dollar card was the reason I could finally subscribe to anything.",
    avatar: "/img/nexus/avatar-4.jpg",
  },
  {
    name: "Grace W.",
    role: "Operations Lead, Kampala",
    quote:
      "We eliminated manual posting in less than a day. The team finally has breathing room.",
    avatar: "/img/nexus/avatar-5.jpg",
  },
  {
    name: "Ibrahim S.",
    role: "Institute Manager, Abidjan",
    quote:
      "One long lecture video becomes a week of shorts. Enrollment inquiries doubled in a month.",
    avatar: "/img/nexus/avatar-6.jpg",
  },
  {
    name: "Naledi M.",
    role: "Growth Lead, Johannesburg",
    quote:
      "Credit pricing means we pay for what we actually use. Slow month, small bill. Launch month, we top up.",
    avatar: "/img/nexus/avatar-7.jpg",
  },
  {
    name: "Yusuf B.",
    role: "Studio Director, Douala",
    quote:
      "Client follow-ups are fully automated now. We haven't missed a single comment this month.",
    avatar: "/img/nexus/avatar-8.jpg",
  },
];

function Card({ t }: { t: T }) {
  return (
    <figure className="nx-card nx-card--soft w-[340px] shrink-0 p-6">
      <blockquote className="text-sm leading-relaxed text-slate-300">
        “{t.quote}”
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <Image
          src={t.avatar}
          alt={t.name}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <div className="text-sm font-semibold text-white">{t.name}</div>
          <div className="text-xs text-slate-500">{t.role}</div>
        </div>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const top = TESTIMONIALS.slice(0, 4);
  const bottom = TESTIMONIALS.slice(4);
  return (
    <section id="testimonials" className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Trusted by Teams Across the Continent
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Schools, creators, and agencies using Nexusply to cut costs and speed up
            execution.
          </p>
        </Reveal>
      </div>

      <div className="nx-marquee-mask mt-14 space-y-6 overflow-hidden">
        <div className="flex w-max gap-6 nx-marquee">
          {[...top, ...top].map((t, i) => (
            <Card key={`t-${i}`} t={t} />
          ))}
        </div>
        <div className="flex w-max gap-6 nx-marquee-reverse">
          {[...bottom, ...bottom].map((t, i) => (
            <Card key={`b-${i}`} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
