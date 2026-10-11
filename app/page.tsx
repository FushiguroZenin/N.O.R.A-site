import { NoraCatalogue } from "@/components/nora-catalogue";
import { NoraHero } from "@/components/nora-hero";
import { FeaturedApplications } from "@/components/featured-applications";
import { NoraFooter } from "@/components/nora-footer";

export default function Home() {
  return <div className="shell">
    <aside className="rail"><a href="#top" className="logo" aria-label="NORA home">NORA</a><span className="mark" /><div className="edition">v0.1.0<br />Don&apos;t compete for work.<br />Publish it.</div><nav className="nav"><a href="/catalogue">Explore</a><a href="/catalogue">Catalogue</a><a href="/account">Accounts</a><a href="/submit">Submit a project</a></nav><div className="rail-foot">Independent software for a more open internet.</div></aside>
    <main className="main" id="top"><div className="topbar"><a href="/catalogue">Explore catalogue</a><a href="/submit">Submit software</a><a href="/join">Join NORA</a></div>
      <NoraHero />
      <FeaturedApplications /><NoraCatalogue /><NoraFooter />
    </main>
  </div>;
}
