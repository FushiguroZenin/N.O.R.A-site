import type { Metadata } from "next";
import { NoraFooter } from "@/components/nora-footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "./release.css";
import "./buyer-paths.css";
import "./workflow.css";

export const metadata: Metadata = {
  title: "NORA — Software made to be reused",
  description: "A curated catalogue of reusable applications made by independent developers.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<div className="site-footer-wrap"><NoraFooter /></div><Analytics/><SpeedInsights sampleRate={0.2}/></body></html>;
}
