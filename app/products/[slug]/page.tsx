import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { BuyerReadiness } from "@/components/buyer-readiness";
import { NoraProductRecord } from "@/components/nora-product-record";
import { NoraFooter } from "@/components/nora-footer";
import { ProofExperience } from "@/components/proof-experience";
import { SaveProduct } from "@/components/save-product";
import { productBySlug, productRecords } from "@/lib/product-records";

export const dynamicParams=false;
export function generateStaticParams(){return productRecords.map(({slug})=>({slug}));}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const p=productBySlug[slug];
 return <main className="product-page"><header className="product-nav"><div className="product-nav-start"><BackButton/><Link href="/" className="logo">NORA</Link></div><nav><Link href="/catalogue">Explore</Link><Link href="/submit">For creators</Link><Link href={`/acquire#${p.slug}`}>Acquire</Link></nav></header>
 <section className="product-hero"><div className="product-kicker"><Link href="/">NORA</Link><span>/</span><span>{p.category}</span><span>/</span><span>{p.name}</span></div><div className="product-hero-grid"><div><div className="eyebrow">NORA product record</div><h1>{p.headline}</h1><p className="product-lede">{p.lede}</p><div className="product-actions">{p.url&&<a className="primary-link" href={p.url} target="_blank" rel="noreferrer">View live preview</a>}<Link className="text-link" href={`/acquire#${p.slug}`}>Acquire this product</Link><SaveProduct productKey={p.slug} name={p.name} url={`/products/${p.slug}`} delivery={p.facts.find(([label])=>label==="Delivery")?.[1]??"Product record"}/></div></div><aside className="product-facts">{p.facts.map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>)}</aside></div></section>
 <ProofExperience type={p.proof.type} url={p.proof.url} instructions={p.proof.instructions} safeData={p.proof.safeData} status="structurally_verified"/><BuyerReadiness level={p.readiness.level} setupTime={p.readiness.setupTime} services={p.readiness.services} variables={p.readiness.variables} addonAvailable={Boolean(p.readiness.addon)} addonPrice={p.readiness.addon?.price} addonScope={p.readiness.addon?.scope} acquireHref={`/acquire#${p.slug}`}/>
 <NoraProductRecord items={p.facts.map(([label,value])=>({label,value}))} lists={[{title:"Included",items:p.includes},{title:"Requirements",items:p.requirements},{title:"Support boundary",items:p.boundary}]}/><section className="product-section"><div className="section-heading"><div className="eyebrow">What it does</div><h2>A finished experience with a clear purpose.</h2></div><div className="capability-grid">{p.capabilities.map(([t,c],i)=><article key={t}><b>0{i+1}</b><h3>{t}</h3><p>{c}</p></article>)}</div></section><section className="engagement"><div><div className="eyebrow">How acquisition works</div><h2>Inspect it first. Then make it yours.</h2></div><ol>{p.journey.map(([t,c],i)=><li key={t}><b>0{i+1}</b><div><h3>{t}</h3><p>{c}</p></div></li>)}</ol></section><section className="product-cta"><div><div className="eyebrow">NORA acquisition request</div><h2>Start with the thing you need.</h2></div><Link className="primary-link light" href={`/acquire#${p.slug}`}>Acquire {p.name}</Link></section><NoraFooter/></main>
}
