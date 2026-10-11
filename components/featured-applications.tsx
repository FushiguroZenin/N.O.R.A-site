"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const featured = [
  { name: "Dera 1.6", type: "Agent runtime", description: "A local-first runtime that turns real computer evidence into safe, explainable diagnostics and controlled actions.", detail: "evidence verified", href: "/products/dera", variant: "dera" },
  { name: "Moon", type: "Windows companion", description: "A paired-device diagnostics experience for reviewing local system evidence and deciding on safe next steps.", detail: "local evidence · approval first", href: "/products/moon", variant: "moon" },
  { name: "Ruby", type: "Marketplace application", description: "A ready-to-deploy marketplace application for developers to list, buy, and trade useful software.", detail: "code. create. trade.", href: "/products/ruby", variant: "ruby" },
] as const;

export function FeaturedApplications() {
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => { if (reducedMotion) return; const timer = window.setInterval(() => setActive((current) => (current + 1) % featured.length), 5600); return () => window.clearInterval(timer); }, [reducedMotion]);
  const item = featured[active];
  return <section className="feature-section" aria-labelledby="featured-title"><div className="section-intro"><div className="eyebrow">Today&apos;s featured applications</div><p>Three distinct ways independent software can be discovered, evaluated, and made useful.</p></div><AnimatePresence mode="wait" initial={false}><motion.section className="feature rotating-feature" key={item.name} initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -18 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}><div className="feature-copy"><div className="feature-count">0{active + 1} / 03</div><h2 id="featured-title">{item.name}</h2><p className="feature-desc">{item.description}</p><div className="details"><div><span>Type</span><b>{item.type}</b></div><div><span>Format</span><b>Verified product record</b></div><div><span>Status</span><b>Preview available</b></div></div><Link href={item.href} className="text-link">Explore</Link></div><div className={`feature-stage ${item.variant}`} aria-label={`${item.name} preview`}><div className="feature-stage-bar"><span>{item.name.toLowerCase()}</span><span>{item.type}</span></div><div className="feature-stage-content"><strong>{item.name}</strong><p>{item.detail}</p><i>●</i></div></div></motion.section></AnimatePresence><div className="feature-dots" aria-label="Featured application position">{featured.map((entry, index) => <button key={entry.name} type="button" className={index === active ? "active" : ""} onClick={() => setActive(index)} aria-label={`Show ${entry.name}`} />)}</div></section>;
}
