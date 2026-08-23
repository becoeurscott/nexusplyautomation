import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { RouteProgress } from "@/components/route-progress";
import { PageFade } from "@/components/page-fade";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

/** Resolve the public site URL without crashing the build on empty/invalid env values. */
function resolveSiteUrl(): URL {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    "http://localhost:3000",
  ];
  for (const c of candidates) {
    if (!c) continue;
    try {
      return new URL(c);
    } catch {
      /* try next */
    }
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  title: "NexusPly — Your social media, handled.",
  description:
    "Social media management for businesses that want to stay visible without staying online all day. Content, publishing, engagement and growth from one system.",
  metadataBase: resolveSiteUrl(),
  openGraph: {
    title: "NexusPly — Your social media, handled.",
    description:
      "You focus on your business. We handle your social media.",
    type: "website",
  },
};

export const viewport = { themeColor: "#021d46" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Entrance animations start from opacity 0 and are revealed by JS, so
            without it the whole page would render blank. Show everything. */}
        <noscript>
          <style>{`
            .nx-reveal, .nx-stagger > * {
              opacity: 1 !important;
              transform: none !important;
              transition: none !important;
            }
          `}</style>
        </noscript>
        <RouteProgress />
        <PageFade>{children}</PageFade>
      </body>
    </html>
  );
}
