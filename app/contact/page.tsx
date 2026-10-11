import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
  return <main className="info-page"><header className="product-nav"><div className="product-nav-start"><BackButton /><Link href="/" className="logo">NORA</Link></div><nav><Link href="/catalogue">Explore</Link><Link href="/join">Join NORA</Link></nav></header><section className="contact-page"><div className="product-kicker"><Link href="/">NORA</Link><span>/</span><span>Contact</span></div><div className="contact-grid"><div><div className="eyebrow">A useful conversation starts with context</div><h1>Let&apos;s talk about the work.</h1><p>Buying something in the catalogue, preparing a product record, or figuring out how a licence applies? Send a note.</p><a className="contact-email" href="mailto:tonioladeji@gmail.com">tonioladeji@gmail.com</a></div><ContactForm /></div></section><footer className="product-footer"><Link href="/">NORA</Link><Link href="/licensing">Licensing</Link><span>© 2026</span></footer></main>;
}
