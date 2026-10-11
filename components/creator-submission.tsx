"use client";

import { FormEvent, useState } from "react";

export function CreatorSubmission() {
  const [note, setNote] = useState("Your submission opens as a prepared email. NORA is keeping its first catalogue releases deliberately curated.");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`NORA submission — ${values.get("product")}`);
    const body = encodeURIComponent([
      `Product: ${values.get("product")}`,
      `Creator: ${values.get("creator")}`,
      `Email: ${values.get("email")}`,
      `Preview: ${values.get("preview")}`,
      `Product type: ${values.get("type")}`,
      `Delivery model: ${values.get("delivery")}`,
      `Source availability: ${values.get("source")}`,
      `Price / terms: ${values.get("terms")}`,
      "",
      `What it solves and what a buyer receives:\n${values.get("details")}`,
      "",
      `Documentation / dependencies / support:\n${values.get("handover")}`,
    ].join("\n"));
    window.location.href = `mailto:tonioladeji@gmail.com?subject=${subject}&body=${body}`;
    setNote("Your email app should open with the product record pre-filled. Nothing is published automatically.");
  }

  return <form className="submission-form" onSubmit={submit}><div className="submission-grid"><label>Product name<input required name="product" placeholder="What is it called?" /></label><label>Your name or studio<input required name="creator" placeholder="Creator or studio" /></label><label>Email<input required type="email" name="email" placeholder="you@example.com" /></label><label>Live preview<input required type="url" name="preview" placeholder="https://" /></label><label>Product type<select name="type"><option>Application</option><option>Runtime</option><option>Developer tool</option><option>Website experience</option><option>Other reusable product</option></select></label><label>Delivery model<select name="delivery"><option>Live project / preview</option><option>Buy and deploy</option><option>Paid integration</option><option>License</option></select></label><label>Source availability<select name="source"><option>Available after purchase</option><option>Private / discussed on enquiry</option><option>Not included</option></select></label><label>Price or terms<input name="terms" placeholder="Fixed price, from-price, or enquiry" /></label></div><label>What does it solve? What does the buyer receive?<textarea required name="details" rows={5} placeholder="Describe the outcome, the intended buyer, and what is included." /></label><label>Documentation, dependencies, and support<textarea required name="handover" rows={4} placeholder="Link a README if available. Note setup, compatibility, support window, and boundaries." /></label><button type="submit" className="submit">Prepare submission</button><p className="form-note">{note}</p></form>;
}
