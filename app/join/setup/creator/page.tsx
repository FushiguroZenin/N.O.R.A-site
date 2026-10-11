import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { AccountSetup } from "@/components/account-setup";

export default function CreatorSetupPage() {
  return <main className="join-page"><header className="product-nav"><div className="product-nav-start"><BackButton /><Link href="/" className="logo">NORA</Link></div><nav><Link href="/catalogue">Explore</Link><Link href="/submit">For creators</Link></nav></header><section className="account-setup-page"><div className="product-kicker"><Link href="/">NORA</Link><span>/</span><Link href="/join">Join</Link><span>/</span><span>Creator setup</span></div><div className="account-setup-grid"><div><div className="eyebrow">Creator account</div><h1>Put your work in the right light.</h1><p>Your account will hold your product records, buyer enquiries, and the releases you bring to NORA.</p></div><AccountSetup role="creator" /></div></section><footer className="product-footer"><Link href="/">NORA</Link><span>Network of Reusable Applications</span><span>© 2026</span></footer></main>;
}
