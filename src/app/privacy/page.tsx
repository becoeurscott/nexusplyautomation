import type { Metadata } from "next";
import { Logo } from "@/components/landing/brand";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Privacy Policy — NexusPly",
  description: "How NexusPly collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[color:var(--nx-bg)] text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Logo />

        <h1 className="mt-10 font-display text-3xl font-bold sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated August 27, 2026</p>

        <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Who we are</h2>
            <p className="mt-3">
              NexusPly (&quot;NexusPly,&quot; &quot;we,&quot; &quot;us&quot;) provides social
              media management and automation software for businesses, schools, and
              creators. This policy explains what information we collect when you use
              NexusPly, why we collect it, and how you can control it. You can reach us
              any time at{" "}
              <a href="mailto:hello@nexusply.ai" className="text-white underline">
                hello@nexusply.ai
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Information we collect</h2>
            <p className="mt-3">We collect information in three ways:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <span className="text-white">Account information</span> — your name,
                email address, and workspace details when you sign up.
              </li>
              <li>
                <span className="text-white">Connected social accounts</span> — when you
                connect a social platform (for example, TikTok) to NexusPly, we receive
                an access token and basic profile information (such as your username and
                avatar) from that platform, scoped only to what&apos;s needed to publish
                and manage content on your behalf.
              </li>
              <li>
                <span className="text-white">Content and usage data</span> — the posts,
                captions, media, and schedules you create in NexusPly, along with basic
                usage data (like which features you use) so we can operate and improve
                the product.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              3. How we use your information
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>To operate the service — publishing, scheduling, and managing your social content as you direct.</li>
              <li>To generate content on your behalf when you ask us to (captions, images, scripts), using third-party AI providers.</li>
              <li>To process payments and manage your subscription.</li>
              <li>To send account and service-related communications — never marketing you didn&apos;t ask for.</li>
              <li>To keep the service secure and prevent abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              4. How we protect connected-account tokens
            </h2>
            <p className="mt-3">
              Access tokens for connected social accounts are encrypted at rest
              (AES-256-GCM) and are never displayed in full anywhere in the product or
              to our support team. Disconnecting an account permanently deletes its
              stored tokens.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Third parties we work with</h2>
            <p className="mt-3">
              NexusPly is built on top of a small number of infrastructure and platform
              providers, each of which processes only what&apos;s necessary to perform
              its function:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Social platforms you connect (e.g. TikTok), to publish and manage content you approve.</li>
              <li>AI providers, to generate content you request (captions, images, video).</li>
              <li>Stripe, to process subscription payments. We never see or store your full card number.</li>
              <li>Infrastructure providers, to host the application and database.</li>
            </ul>
            <p className="mt-3">
              We do not sell your data, and we do not use your content to train public
              AI models.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Your controls</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Disconnect any connected social account at any time from Settings — this immediately deletes its stored tokens.</li>
              <li>Export or delete your account data by contacting us.</li>
              <li>Cancel your subscription at any time; no long-term contracts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Data retention</h2>
            <p className="mt-3">
              We retain account and content data for as long as your account is active,
              and for a limited period after cancellation in case you choose to
              reactivate. You can request full deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Changes to this policy</h2>
            <p className="mt-3">
              If we make material changes to this policy, we&apos;ll notify active
              account holders by email before the changes take effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Contact us</h2>
            <p className="mt-3">
              Questions about this policy or your data? Email{" "}
              <a href="mailto:hello@nexusply.ai" className="text-white underline">
                hello@nexusply.ai
              </a>{" "}
              and a real person on the team will respond.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
