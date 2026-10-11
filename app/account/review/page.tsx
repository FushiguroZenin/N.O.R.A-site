import Link from "next/link";
import { AccountAuth } from "@/components/account-auth";
import { BackButton } from "@/components/back-button";
import { NoraFooter } from "@/components/nora-footer";
import { ReviewDashboard } from "@/components/review-dashboard";
import { FulfilmentDashboard } from "@/components/fulfilment-dashboard";

export default function ReviewWorkspacePage() {
  return <main className="join-page account-page workspace-page"><header className="product-nav"><div className="product-nav-start"><BackButton /><Link href="/" className="logo">NORA</Link></div><nav><Link href="/catalogue">Explore</Link><Link href="/account">Account</Link></nav></header><section className="join-intro"><div className="product-kicker"><Link href="/">NORA</Link><span>/</span><Link href="/account">Account</Link><span>/</span><span>Review</span></div><div className="eyebrow">Operations</div><h1>Make the shelf trustworthy.</h1><p>Reviewer access is deliberately restricted. Approved records become public NORA listings.</p></section><section className="account-note"><AccountAuth /><ReviewDashboard /><FulfilmentDashboard /></section><NoraFooter /></main>;
}
