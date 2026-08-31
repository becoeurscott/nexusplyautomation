import type { Metadata } from "next";
import { Logo } from "@/components/landing/brand";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Terms of Service — NexusPly",
  description: "The terms that govern your use of NexusPly.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[color:var(--nx-bg)] text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Logo />

        <h1 className="mt-10 font-display text-3xl font-bold sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated August 27, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Agreement</h2>
            <p className="mt-3">
              These Terms govern your access to and use of NexusPly (&quot;the
              Service&quot;). By creating an account or using the Service, you agree to
              these Terms. If you&apos;re using NexusPly on behalf of a business or
              organization, you&apos;re confirming you have authority to bind that
              organization to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. What NexusPly does</h2>
            <p className="mt-3">
              NexusPly is social media management and automation software: connecting
              your social accounts, planning and generating content, scheduling and
              publishing posts, and reporting on performance. Some features generate
              content using third-party AI providers at your request.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Your account</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>You&apos;re responsible for the accuracy of the information you provide and for keeping your login credentials secure.</li>
              <li>You must be legally able to enter into these Terms and to operate the social accounts you connect.</li>
              <li>You&apos;re responsible for the content you create, approve, and publish through NexusPly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Connected social accounts</h2>
            <p className="mt-3">
              When you connect a social platform account, you authorize NexusPly to
              access and act on that account within the scope you approve during the
              platform&apos;s own consent screen — for example, publishing posts on your
              behalf. Nothing publishes without a post existing in your NexusPly
              workspace that you created or approved. You can disconnect any account at
              any time, which immediately revokes NexusPly&apos;s access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Subscriptions, credits, and billing</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Paid plans are billed in advance on a monthly or annual basis through Stripe.</li>
              <li>Each plan includes a monthly allowance of creation credits, which reset each billing period and do not roll over.</li>
              <li>You can cancel at any time; your plan remains active through the end of the current billing period.</li>
              <li>Free trials convert to a paid subscription only if you choose a plan — no card is required to start a trial.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Acceptable use</h2>
            <p className="mt-3">You agree not to use NexusPly to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Violate the terms of service of any platform you connect (e.g. TikTok, Instagram, YouTube).</li>
              <li>Publish content that is illegal, infringing, or that you do not have the rights to post.</li>
              <li>Attempt to disrupt, reverse-engineer, or gain unauthorized access to the Service.</li>
              <li>Impersonate another person or organization, or misrepresent your affiliation with any brand.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Third-party platforms</h2>
            <p className="mt-3">
              NexusPly connects to third-party platforms (social networks, AI providers,
              payment processors) that have their own terms and policies. We&apos;re not
              responsible for the availability, content, or policies of those
              third-party services, including changes they make that affect how
              NexusPly works.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Termination</h2>
            <p className="mt-3">
              You may stop using NexusPly and cancel your subscription at any time. We
              may suspend or terminate accounts that violate these Terms, misuse the
              Service, or attempt to circumvent its security. We&apos;ll make reasonable
              efforts to notify you before doing so, except where immediate action is
              needed to protect the Service or other users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Disclaimers and limitation of liability</h2>
            <p className="mt-3">
              The Service is provided &quot;as is.&quot; We work to keep it reliable,
              but we don&apos;t guarantee uninterrupted availability, particularly where
              a connected third-party platform (social network, AI provider, or payment
              processor) is unavailable. To the fullest extent permitted by law,
              NexusPly is not liable for indirect, incidental, or consequential damages
              arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Changes to these Terms</h2>
            <p className="mt-3">
              We may update these Terms from time to time. If we make material changes,
              we&apos;ll notify active account holders by email before the changes take
              effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Contact us</h2>
            <p className="mt-3">
              Questions about these Terms? Email{" "}
              <a href="mailto:hello@nexusply.ai" className="text-white underline">
                hello@nexusply.ai
              </a>
              .
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
