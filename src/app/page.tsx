import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Capabilities } from "@/components/landing/capabilities";
import { Platforms } from "@/components/landing/platforms";
import { BrandVoice, Approval } from "@/components/landing/brand-system";
import { Outcomes, VsAgency } from "@/components/landing/outcomes";
import { Trust } from "@/components/landing/trust";
import { Testimonials, LogoWall } from "@/components/landing/social-proof";
import { Pricing } from "@/components/landing/pricing";
import { Tiers, Services, Audiences } from "@/components/landing/tiers";
import { FAQ } from "@/components/landing/faq";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

/**
 * Order matters here: "How NexusPly works" sits before pricing, because the
 * previous arrangement showed prices at section 14 and only explained the
 * product at 16 — people were asked to judge cost before they understood what
 * they were buying.
 *
 * `LogoWall` and `Testimonials` render nothing until real customer proof
 * exists (see social-proof.tsx); they are wired in now so switching them on
 * later is a data change.
 */
export default function LandingPage() {
  return (
    <>
      <Nav />
      <main className="bg-[color:var(--nx-bg)]">
        <Hero />
        <LogoWall />
        <Problem />
        <HowItWorks />
        <Capabilities />
        <Platforms />
        <BrandVoice />
        <Approval />
        <Outcomes />
        <VsAgency />
        <Trust />
        <Testimonials />
        <Pricing />
        <Tiers />
        <Services />
        <Audiences />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
