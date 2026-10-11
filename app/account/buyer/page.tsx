import Link from "next/link";
import { AccountAuth } from "@/components/account-auth";
import { BackButton } from "@/components/back-button";
import { BuyerDashboard } from "@/components/buyer-dashboard";
import { NoraFooter } from "@/components/nora-footer";

export default function BuyerWorkspacePage() {
  return <main className="join-page account-page workspace-page"><header className="product-nav"><div className="product-nav-start"><BackButton /><Link href="/" className="logo">NORA</Link></div><nav><Link href="/catalogue">Explore</Link><Link href="/account">Account</Link></nav></header><section className="join-intro"><div className="product-kicker"><Link href="/">NORA</Link><span>/</span><Link href="/account">Account</Link><span>/</span><span>Buyer workspace</span></div><div className="eyebrow">For buyers</div><h1>Keep your next move clear.</h1><p>Every product you are considering and every acquisition request you have sent lives here.</p></section><section className="account-note"><AccountAuth /><BuyerDashboard /><Link className="primary-link" href="/catalogue">Explore catalogue</Link></section><NoraFooter /></main>;
}
