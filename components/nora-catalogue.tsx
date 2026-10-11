"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { categories, products, ProductCategory } from "@/lib/catalogue";

type CatalogueFilter = "all" | ProductCategory;

export function NoraCatalogue() {
  const [filter, setFilter] = useState<CatalogueFilter>("all");
  const visibleProducts = useMemo(() => filter === "all" ? products : products.filter((product) => product.category === filter), [filter]);

  return (
    <>
      <section className="catalogue" id="catalogue">
        <div className="catalogue-head"><h2>Recent releases</h2><button type="button" onClick={() => setFilter("all")}>View all</button></div>
        <div className="filters" aria-label="Filter catalogue">
          {categories.map((category) => <button className={`filter ${filter === category.value ? "active" : ""}`} key={category.value} onClick={() => setFilter(category.value)}>{category.label}</button>)}
        </div>
        <div>
          {visibleProducts.map((product) => <article className="release" key={product.slug}>
            <div className={`thumb ${product.variant ?? ""}`}>{product.preview.split("\n").map((line) => <div key={line}>{line}</div>)}</div>
            <div><h3>{product.slug === "dera-1-6" ? <Link href="/products/dera">{product.name}</Link> : product.slug === "ruby" ? <Link href="/products/ruby">{product.name}</Link> : product.href ? <Link href={`/products/${product.slug}`}>{product.name}</Link> : product.name}</h3><div className="maker">by {product.maker}</div></div>
            <p>{product.description}</p><div className="version">{product.version}</div><div className="price">{product.href ? <Link className="live-project-link" href={`/products/${product.slug}`}>View record</Link> : product.price}</div>
          </article>)}
          {visibleProducts.length === 0 && <p className="empty">Nothing in this category yet.</p>}
        </div>
      </section>
      <section className="callout" id="submit">
        <div><div className="eyebrow">For independent builders</div><h2><span>Make</span> the thing. <span>Sell</span> the thing.</h2><p>List finished software with proof, a clear delivery path, and terms a buyer can understand before they contact you.</p></div>
        <div className="creator-invite"><p>NORA is for products with a real use case—not profiles competing for a vague brief.</p><Link href="/submit" className="primary-link light">List your work</Link></div>
      </section>
    </>
  );
}
