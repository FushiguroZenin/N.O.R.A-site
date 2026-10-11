import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { AccountSetup } from "@/components/account-setup";

export default function BuyerSetupPage() {
  return <main className="join-page"><header className="product-nav"><div className="product-nav-start"><BackButton /><Link href="/" className="logo">NORA</Link></div><nav><Link href="/catalogue">Explore</Link><Link href="/submit">For creators</Link></nav></header><section className="account-setup-page"><div className="product-kicker"><Link href="/">NORA</Link><span>/</span><Link href="/join">Join</Link><span>/</span><span>Buyer setup</span></div><div className="account-setup-grid"><div><div className="eyebrow">Buyer account</div><h1>Find the right finished thing.</h1><p>Your account will keep the products you are considering in one place and make enquiries more useful.</p></div><AccountSetup role="buyer" /></div></section><footer className="product-footer"><Link href="/">NORA</Link><span>Network of Reusable Applications</span><span>© 2026</span></footer></main>;
}
