import type { Metadata } from "next";
import { NoraFooter } from "@/components/nora-footer";
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
  return <html lang="en"><body>{children}<div className="site-footer-wrap"><NoraFooter /></div></body></html>;
}
