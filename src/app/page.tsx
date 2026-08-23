import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { Capabilities, WhatItHandles } from "@/components/landing/capabilities";
import {
  BrandVoice,
  ContentSystem,
  WorkLoop,
  Approval,
} from "@/components/landing/brand-system";
import { Platforms } from "@/components/landing/platforms";
import {
  Outcomes,
  TimeBack,
  VsAgency,
  Consistency,
} from "@/components/landing/outcomes";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { Tiers, Services, Audiences } from "@/components/landing/tiers";
import { FAQ } from "@/components/landing/faq";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main className="bg-[color:var(--nx-bg)]">
        <Hero />
        <Problem />
        <Capabilities />
        <BrandVoice />
        <ContentSystem />
        <WorkLoop />
        <Platforms />
        <Outcomes />
        <TimeBack />
        <VsAgency />
        <WhatItHandles />
        <Approval />
        <Tiers />
        <Consistency />
        <Pricing />
        <Services />
        <HowItWorks />
        <Audiences />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
