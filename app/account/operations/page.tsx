import Link from "next/link";
import { AccountAuth } from "@/components/account-auth";
import { BackButton } from "@/components/back-button";
import { NoraFooter } from "@/components/nora-footer";
import { ReviewDashboard } from "@/components/review-dashboard";
import { FulfilmentDashboard } from "@/components/fulfilment-dashboard";

export default function OperationsWorkspacePage() {
  return <main className="join-page account-page workspace-page"><header className="product-nav"><div className="product-nav-start"><BackButton /><Link href="/" className="logo">NORA</Link></div><nav><Link href="/catalogue">Explore</Link><Link href="/account">Account</Link></nav></header><section className="join-intro"><div className="product-kicker"><Link href="/">NORA</Link><span>/</span><Link href="/account">Account</Link><span>/</span><span>Operations</span></div><div className="eyebrow">N.O.R.A operations</div><h1>Make the shelf trustworthy.</h1><p>Operations access is assigned by N.O.R.A. Review records, protect catalogue quality, and handle exceptional fulfilment deliberately.</p></section><section className="account-note"><AccountAuth /><ReviewDashboard /><FulfilmentDashboard /></section><NoraFooter /></main>;
}
