import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { NoraFooter } from "@/components/nora-footer";
import { SupportDesk } from "@/components/support-desk";

export default function SupportPage() { return <main className="join-page account-page workspace-page"><header className="product-nav"><div className="product-nav-start"><BackButton/><Link href="/" className="logo">NORA</Link></div><nav><Link href="/catalogue">Explore</Link><Link href="/account">Account</Link></nav></header><section className="join-intro"><div className="product-kicker"><Link href="/">NORA</Link><span>/</span><span>Support</span></div><div className="eyebrow">NORA support</div><h1>When something is unclear, say so.</h1><p>Marketplace trust includes a route for help, corrections, and reports—not just a way to acquire software.</p></section><section className="account-note"><SupportDesk/></section><NoraFooter/></main>; }
