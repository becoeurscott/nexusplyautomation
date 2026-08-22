import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Nexusply AI Automation — One dashboard for every social account",
  description:
    "Plan, generate, publish, listen, and learn — across every social channel. Priced for African schools, creators, and SMBs. Paid via M-Pesa, MoMo, Orange, and Flutterwave.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Nexusply AI Automation",
    description:
      "One dashboard for every social account. AI-native, credit-metered, priced for Africa.",
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
        {children}
      </body>
    </html>
  );
}
