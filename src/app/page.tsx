import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Benefits } from "@/components/landing/benefits";
import { Features } from "@/components/landing/features";
import { Integrations } from "@/components/landing/integrations";
import { CapabilityMatrix } from "@/components/landing/capability-matrix";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main className="bg-[color:var(--nx-bg)]">
        <Hero />
        <Benefits />
        <Features />
        <Integrations />
        <CapabilityMatrix />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
