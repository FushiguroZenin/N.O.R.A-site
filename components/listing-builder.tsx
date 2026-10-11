"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Stage = 1 | 2 | 3 | 4;
const steps = ["Description", "Proof", "Details", "Delivery"];

export function ListingBuilder() {
  const [stage, setStage] = useState<Stage>(1);
  const [draftId, setDraftId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({ name: "", outcome: "", type: "Application", delivery: "Buy & deploy", price: "", preview: "", proof: "", repository: "", readiness: "Developer required", setup: "", requirements: "", boundary: "", included: "", version: "v1.0.0", licence: "Single-project licence", dependencies: "", bundle: null as File | null });
  const set = (key: keyof typeof values, value: string | File | null) => setValues((current) => ({ ...current, [key]: value }));
  const formRef = useRef({ values, set }); formRef.current = { values, set };
  useEffect(() => {
    const id = window.location.hash.replace("#draft=", "");
    if (!id || id === window.location.hash) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
      const { data } = await supabase.from("listing_drafts").select("*").eq("id", id).eq("creator_id", user.id).single();
      if (!data) return;
      setDraftId(data.id);
      setValues((current) => ({ ...current, name: data.product_name ?? "", outcome: data.outcome ?? "", type: data.product_type ?? current.type, delivery: data.delivery ?? current.delivery, price: data.price_amount?.toString() ?? "", preview: data.preview_url ?? "", proof: data.proof_url ?? "", repository: data.repository_url ?? "", readiness: data.readiness_level ?? current.readiness, setup: data.setup_time ?? "", requirements: (data.requirements ?? []).join("\\n"), boundary: (data.boundary ?? []).join("\\n"), included: (data.included ?? []).join("\\n"), version: data.release_version ?? current.version, licence: data.licence_name ?? current.licence, dependencies: data.dependency_notes ?? "" }));
    }; load();
  }, []);
  const missingStage = () => {
    if (!values.name.trim() || !values.outcome.trim() || !values.preview.trim()) return 1 as Stage;
    if (!values.proof.trim() || !values.repository.trim()) return 2 as Stage;
    if (!values.requirements.trim() || !values.boundary.trim()) return 3 as Stage;
    if (!values.included.trim() || (values.delivery === "Buy & deploy" && !values.bundle && !draftId)) return 4 as Stage;
    return 0;
  };
  const save = async (submit: boolean) => {
    const incomplete = submit && missingStage();
    if (incomplete) { setStage(incomplete); setNote("Complete the required information in this step before submitting to NORA."); return; }
    setSaving(true); const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.assign("/account"); return; }
    const payload = { product_name: values.name || "Untitled product", outcome: values.outcome, product_type: values.type, delivery: values.delivery, preview_url: values.preview || null, repository_url: values.repository || null, price_mode: values.price ? "fixed" : "quote", price_amount: values.price ? Number(values.price) : null, proof_type: "Live demo", proof_url: values.proof || null, readiness_level: values.readiness, setup_time: values.setup || null, requirements: values.requirements.split("\\n").filter(Boolean), boundary: values.boundary.split("\\n").filter(Boolean), included: values.included.split("\\n").filter(Boolean), release_version: values.version, licence_name: values.licence, dependency_notes: values.dependencies || null, status: submit ? "submitted" : "draft", updated_at: new Date().toISOString() };
    const result = draftId ? await supabase.from("listing_drafts").update(payload).eq("id", draftId).eq("creator_id", user.id).select("id").single() : await supabase.from("listing_drafts").insert({ ...payload, creator_id: user.id }).select("id").single();
    if (result.error || !result.data) { setNote(result.error?.message || "NORA could not save this record."); setSaving(false); return; }
    setDraftId(result.data.id);
    if (values.bundle) {
      const name = values.bundle.name.replace(/[^a-zA-Z0-9._-]/g, "-"); const path = user.id + "/" + result.data.id + "/" + Date.now() + "-" + name;
      const upload = await supabase.storage.from("nora-delivery").upload(path, values.bundle, { contentType: values.bundle.type || "application/octet-stream" });
      if (upload.error) { setNote("Record saved, but the bundle could not upload: " + upload.error.message); setSaving(false); return; }
      await supabase.from("listing_drafts").update({ source_bundle_path: path, source_bundle_name: values.bundle.name, source_bundle_size: values.bundle.size }).eq("id", result.data.id);
    }
    if (submit) window.location.assign("/account/creator?submitted=" + result.data.id + "#your-records");
    else { setNote("Draft saved. You can return to Creator Studio whenever you are ready."); setSaving(false); }
  };
  const Field = useMemo(() => ({ label, name, area = false, type = "text" }: { label: string; name: keyof typeof values; area?: boolean; type?: string }) => { const { values: current, set: update } = formRef.current; const placeholders: Partial<Record<keyof typeof current, string>> = { name: "e.g. Neptune", outcome: "e.g. Keep creative work, direction, and output in one place.", price: "e.g. 240", preview: "https://your-project.vercel.app", proof: "https://demo.example.com", repository: "https://github.com/username/repository", setup: "e.g. 20 minutes, or none", requirements: "e.g. Vercel account", boundary: "e.g. Support for the supplied release", included: "e.g. Source bundle", version: "e.g. v1.0.0", licence: "e.g. Single-project licence", dependencies: "e.g. Next.js 16 · Node 22 · pnpm 9" }; return <label>{label}{area ? <textarea rows={3} placeholder={placeholders[name]} value={current[name] as string} onChange={(event) => update(name, event.target.value)} /> : <input type={type} placeholder={placeholders[name]} value={current[name] as string} onChange={(event) => update(name, event.target.value)} />}</label>; }, []);
  return <div className="listing-builder guided-builder"><form className="listing-form" onSubmit={(e) => e.preventDefault()}>
    <nav className="builder-progress">{steps.map((label, index) => <button key={label} type="button" onClick={() => setStage((index + 1) as Stage)} className={stage === index + 1 ? "active" : stage > index + 1 ? "complete" : ""}><span>0{index + 1}/04</span>{label}</button>)}</nav>
    {stage === 1 && <section className="builder-stage"><div className="eyebrow">01 / 04 — Description</div><h2>Start with the finished thing.</h2><p>What is it, what does it achieve, and what does it cost?</p><div className="submission-grid"><Field label="Product name" name="name" /><Field label="Outcome" name="outcome" /><label>Product type<select value={values.type} onChange={(e) => set("type", e.target.value)}><option>Application</option><option>Runtime</option><option>Developer tool</option></select></label><label>Delivery<select value={values.delivery} onChange={(e) => set("delivery", e.target.value)}><option>Buy & deploy</option><option>Live project</option><option>Paid integration</option></select></label><Field label="Price in USD" name="price" type="number" /><Field label="Live preview" name="preview" /></div></section>}
    {stage === 2 && <section className="builder-stage"><div className="eyebrow">02 / 04 — Proof</div><h2>Let buyers test the claim.</h2><p>Use safe demo data only.</p><div className="submission-grid"><Field label="Proof link" name="proof" /><Field label="Public GitHub repository" name="repository" /></div></section>}
    {stage === 3 && <section className="builder-stage"><div className="eyebrow">03 / 04 — Details</div><h2>Make the fit obvious.</h2><div className="submission-grid"><label>Buyer readiness<select value={values.readiness} onChange={(e) => set("readiness", e.target.value)}><option>Ready to use</option><option>Ready to deploy</option><option>Developer required</option></select></label><Field label="Expected setup time" name="setup" /><Field label="Requirements — one per line" name="requirements" area /><Field label="Support boundary — one per line" name="boundary" area /></div></section>}
    {stage === 4 && <section className="builder-stage"><div className="eyebrow">04 / 04 — Delivery</div><h2>Package what the buyer receives.</h2><p>Your source bundle remains private until NORA grants a buyer access.</p><div className="submission-grid"><Field label="Release version" name="version" /><Field label="Licence" name="licence" /><Field label="Dependencies and compatibility" name="dependencies" area /><Field label="Buyer receives — one per line" name="included" area /><label className="account-wide">Private source bundle{values.delivery === "Buy & deploy" && <em> required for submission</em>}<input type="file" accept=".zip,.tgz,.tar.gz,application/zip,application/gzip" onChange={(e) => set("bundle", e.target.files?.[0] || null)} /><small>{values.bundle ? values.bundle.name + " ready to upload" : "ZIP, TGZ, or TAR.GZ · maximum 100 MB"}</small></label></div></section>}
    <div className="builder-actions">{stage > 1 && <button type="button" className="builder-back" onClick={() => setStage((stage - 1) as Stage)}>← Back</button>}{stage < 4 ? <button type="button" className="submit" onClick={() => setStage((stage + 1) as Stage)}>Continue →</button> : <><button type="button" className="submit" disabled={saving} onClick={() => save(false)}>{saving ? "Saving…" : "Save draft"}</button><button type="button" className="submit review-submit" disabled={saving} onClick={() => save(true)}>Submit to NORA</button><Link className="studio-link" href="/account/creator#your-records">Return to Creator Studio ↗</Link></>}</div>{note && <p className="form-note">{note}</p>}
  </form></div>;
}
