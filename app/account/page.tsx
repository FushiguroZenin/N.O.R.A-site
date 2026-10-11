import Link from "next/link";
import { AccountAuth } from "@/components/account-auth";
import { AccountOverview } from "@/components/account-overview";
import { BackButton } from "@/components/back-button";
import { NoraFooter } from "@/components/nora-footer";

export default function AccountPage() {
  return <main className="join-page account-page">
    <header className="product-nav">
      <div className="product-nav-start"><BackButton /><Link href="/" className="logo">NORA</Link></div>
      <nav><Link href="/catalogue">Explore</Link><Link href="/submit">For creators</Link></nav>
    </header>
    <section className="join-intro">
      <div className="product-kicker"><Link href="/">NORA</Link><span>/</span><span>Account</span></div>
      <div className="eyebrow">Your place in NORA</div>
      <h1>Keep the useful things close.</h1>
      <p>Accounts hold the records you publish, the acquisition requests you send, and the conversations that move work forward.</p>
    </section>
    <section className="account-doors">
      <article><div className="eyebrow">Buyer workspace</div><h2>Find, save, and acquire.</h2><p>Keep acquisition requests together and return to the software that fits what you are building.</p><Link className="primary-link" href="/account/buyer">Open buyer workspace</Link></article>
      <article id="creator"><div className="eyebrow">Creator studio</div><h2>Build a catalogue, not a profile.</h2><p>Keep drafts, submit finished software for review, manage releases, and handle serious buyer interest in one place.</p><Link className="primary-link creator-join" href="/account/creator">Open creator studio</Link></article>
    </section>
    <section className="account-note"><AccountAuth /><div className="account-workspaces"><AccountOverview /><Link className="review-link" href="/account/review">Reviewer workspace <span>↗</span></Link></div></section>
    <NoraFooter />
  </main>;
}
