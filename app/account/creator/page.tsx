import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { AccountAuth } from "@/components/account-auth";
import { CreatorDashboard } from "@/components/creator-dashboard";
import { ReleaseManager } from "@/components/release-manager";
import { NoraFooter } from "@/components/nora-footer";

export default function CreatorAccountPage() {
  return <main className="join-page account-page workspace-page"><header className="product-nav"><div className="product-nav-start"><BackButton /><Link href="/" className="logo">NORA</Link></div><nav><Link href="/catalogue">Explore</Link><Link href="/account">Account</Link></nav></header><section className="join-intro"><div className="product-kicker"><Link href="/">NORA</Link><span>/</span><Link href="/account">Account</Link><span>/</span><span>Creator studio</span></div><div className="eyebrow">For creators</div><h1>Run the work you have made.</h1><p>Build a record, pass preflight, submit it to NORA, then prepare its buyer release after approval.</p></section><section className="account-note"><AccountAuth /><CreatorDashboard /><div id="release-manager"><ReleaseManager /></div></section><NoraFooter /></main>;
}
