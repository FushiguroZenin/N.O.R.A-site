import Link from "next/link";
import { NoraFooter } from "@/components/nora-footer";

export default function NotFound() {
  return <main className="not-found-page">
    <header className="product-nav">
      <Link href="/" className="logo">NORA</Link>
      <nav><Link href="/catalogue">Explore</Link><Link href="/account">Account</Link></nav>
    </header>
    <section className="not-found-main">
      <div>
        <div className="eyebrow">404 / record unavailable</div>
        <h1>This thing<br />isn’t on the shelf.</h1>
      </div>
      <div className="not-found-copy">
        <p>The product record may have moved, been removed, or never existed. Browse finished software that is ready to inspect.</p>
        <div className="not-found-actions"><Link className="primary-link" href="/catalogue">Browse catalogue</Link><Link className="text-link" href="/">Return home</Link></div>
      </div>
    </section>
    <section className="not-found-ledger"><span>STATUS</span><b>RECORD NOT FOUND</b><span>ROUTE</span><b>REQUIRES A VALID NORA PATH</b></section>
    <NoraFooter />
  </main>;
}
