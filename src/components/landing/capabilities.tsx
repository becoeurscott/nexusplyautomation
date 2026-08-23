import Link from "next/link";
import { Reveal } from "./reveal";
import { Tap } from "@/components/tap";
import { Section, Tile } from "./section";

const CAPABILITIES = [
  {
    title: "Content Planning",
    body: "Build a consistent content calendar around your business, offers and audience.",
  },
  {
    title: "Content Creation",
    body: "Get posts, captions, visual content and platform-ready content created for your brand.",
  },
  {
    title: "Multi-Platform Publishing",
    body: "Prepare content once and distribute it across the social channels your business uses.",
  },
  {
    title: "Scheduling",
    body: "Plan your content ahead of time and keep your accounts active automatically.",
  },
  {
    title: "Engagement Management",
    body: "Keep track of comments and customer conversations so important interactions don't get missed.",
  },
  {
    title: "Performance Insights",
    body: "Understand what's working, what isn't and where to focus your effort.",
  },
  {
    title: "Business Automation",
    body: "Connect your social media activity to the rest of your business workflow.",
  },
];

export function Capabilities() {
  return (
    <Section
      id="features"
      title="One place to manage your entire social presence."
      sub="Connect your social accounts and let NexusPly handle the repetitive work."
    >
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((c, i) => (
          <Tile key={c.title} title={c.title} body={c.body} index={i} />
        ))}
      </div>

      <Reveal className="mt-12 text-center">
        <Tap>
          <a
            href="#how-it-works"
            className="inline-block rounded-[10px] border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/5"
          >
            See How NexusPly Works
          </a>
        </Tap>
      </Reveal>
    </Section>
  );
}

const HANDLES = [
  { title: "Strategy", body: "Create a content direction around your business goals." },
  { title: "Content Ideas", body: "Never run out of things to talk about." },
  {
    title: "Captions",
    body: "Create platform-appropriate messaging that fits your brand.",
  },
  {
    title: "Visual Content",
    body: "Prepare social-ready creative for your content calendar.",
  },
  {
    title: "Content Calendar",
    body: "See what's coming, what's published and what needs attention.",
  },
  { title: "Scheduling", body: "Keep content moving without manual daily posting." },
  {
    title: "Publishing",
    body: "Manage your connected social channels from one workflow.",
  },
  { title: "Engagement", body: "Monitor interactions and conversations." },
  { title: "Analytics", body: "Track performance and identify opportunities." },
  {
    title: "Automation",
    body: "Connect social activity with other business workflows.",
  },
];

export function WhatItHandles() {
  return (
    <Section title="What NexusPly can handle" tone="glow">
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HANDLES.map((h, i) => (
          <Tile key={h.title} title={h.title} body={h.body} index={i} />
        ))}
      </div>

      <Reveal className="mt-12 text-center">
        <Tap>
          <Link
            href="/sign-up"
            className="inline-block rounded-[10px] bg-[color:var(--nx-blue)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(10,99,244,0.9)] transition hover:bg-[color:var(--nx-blue-hover)]"
          >
            Get Started
          </Link>
        </Tap>
      </Reveal>
    </Section>
  );
}
