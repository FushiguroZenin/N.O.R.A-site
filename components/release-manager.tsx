"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type RecordOption = { id: string; product_name: string; status: string; source_bundle_name: string | null; source_bundle_size: number | null };
type Release = { release_version: string; release_notes: string; tested_environment: string; dependency_notes: string; licence_name: string; delivery_contents: string[] };
type BundleFields = { source_bundle_path?: string; source_bundle_name?: string; source_bundle_size?: number };
const empty: Release = { release_version: "", release_notes: "", tested_environment: "", dependency_notes: "", licence_name: "", delivery_contents: [] };

const displayBytes = (bytes: number | null) => {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
};

export function ReleaseManager() {
  const [records, setRecords] = useState<RecordOption[]>([]); const [selected, setSelected] = useState(""); const [release, setRelease] = useState<Release>(empty); const [bundle, setBundle] = useState<File | null>(null); const [note, setNote] = useState(""); const [saving, setSaving] = useState(false);
  const loadRecords = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data } = await supabase.from("listing_drafts").select("id,product_name,status,source_bundle_name,source_bundle_size").eq("creator_id", user.id).eq("status", "published").order("updated_at", { ascending: false }); setRecords(data ?? []); if (!selected && data?.[0]) setSelected(data[0].id); };
  useEffect(() => { loadRecords(); }, []);
  useEffect(() => { if (!selected) return; setBundle(null); supabase.from("listing_drafts").select("release_version,release_notes,tested_environment,dependency_notes,licence_name,delivery_contents").eq("id", selected).single().then(({ data }) => setRelease({ release_version: data?.release_version ?? "", release_notes: data?.release_notes ?? "", tested_environment: data?.tested_environment ?? "", dependency_notes: data?.dependency_notes ?? "", licence_name: data?.licence_name ?? "", delivery_contents: data?.delivery_contents ?? [] })); }, [selected]);
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!selected) return; setSaving(true); setNote("");
    const { data: { user } } = await supabase.auth.getUser(); if (!user) { setSaving(false); return; }
    const record = records.find(item => item.id === selected); let bundleFields: BundleFields = {};
    if (bundle) {
      if (!/\.(zip|tgz|tar\.gz)$/i.test(bundle.name)) { setNote("Upload a .zip, .tgz, or .tar.gz source bundle."); setSaving(false); return; }
      if (bundle.size > 100 * 1024 * 1024) { setNote("Keep a release bundle below 100 MB for this first delivery flow."); setSaving(false); return; }
      const safeName = bundle.name.replace(/[^a-zA-Z0-9._-]/g, "-"); const path = `${user.id}/${selected}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("nora-delivery").upload(path, bundle, { upsert: false, contentType: bundle.type || "application/octet-stream" });
      if (uploadError) { setNote(uploadError.message); setSaving(false); return; }
      bundleFields = { source_bundle_path: path, source_bundle_name: bundle.name, source_bundle_size: bundle.size };
      if (record?.source_bundle_name) setRecords(current => current.map(item => item.id === selected ? { ...item, source_bundle_name: bundle.name, source_bundle_size: bundle.size } : item));
    }
    const { error } = await supabase.rpc("save_listing_release", {
      p_listing_id: selected,
      p_release_version: release.release_version,
      p_release_notes: release.release_notes,
      p_tested_environment: release.tested_environment,
      p_dependency_notes: release.dependency_notes,
      p_licence_name: release.licence_name,
      p_delivery_contents: release.delivery_contents.filter(Boolean),
      p_source_bundle_path: bundleFields.source_bundle_path ?? null,
      p_source_bundle_name: bundleFields.source_bundle_name ?? null,
      p_source_bundle_size: bundleFields.source_bundle_size ?? null,
    });
    setNote(error ? error.message : bundle ? "Release details and private source bundle saved. Buyers need an entitlement before they can download it." : "Release details saved to this product record."); setSaving(false);
  };
  if (!records.length) return <section className="creator-dashboard release-manager"><div className="eyebrow">Release record</div><h2>Prepare a release after approval.</h2><p>Once NORA approves a product record, it will appear here for its private source bundle and version details.</p></section>;
  const selectedRecord = records.find(item => item.id === selected);
  return <section className="creator-dashboard release-manager"><div className="eyebrow">Release record</div><h2>State — and prepare — what a buyer receives.</h2><p>Declare the version and compatibility details, then attach one private source bundle. NORA never exposes the file publicly; a future payment confirmation grants a buyer download access.</p><form onSubmit={save}><label>Product record<select value={selected} onChange={(event) => setSelected(event.target.value)}>{records.map((record) => <option key={record.id} value={record.id}>{record.product_name} · {record.status.replace("_", " ")}</option>)}</select></label><div className="submission-grid"><label>Version<input value={release.release_version} onChange={(event) => setRelease(current => ({ ...current, release_version: event.target.value }))} placeholder="v1.0.0" /></label><label>Licence<select value={release.licence_name} onChange={(event) => setRelease(current => ({ ...current, licence_name: event.target.value }))}><option value="">Choose a licence</option><option>Single-project licence</option><option>Agency licence</option><option>Commercial proprietary licence</option><option>Open-source — MIT</option><option>Open-source — Apache-2.0</option><option>Custom terms</option></select></label><label className="account-wide">Tested environment<input value={release.tested_environment} onChange={(event) => setRelease(current => ({ ...current, tested_environment: event.target.value }))} placeholder="Next.js 15.2 · Node 22 · pnpm 9" /></label><label className="account-wide">Dependencies and compatibility<textarea rows={3} value={release.dependency_notes} onChange={(event) => setRelease(current => ({ ...current, dependency_notes: event.target.value }))} placeholder="State the lockfile, key packages, supported versions, and upgrade caveats." /></label><label className="account-wide">Release notes<textarea rows={3} value={release.release_notes} onChange={(event) => setRelease(current => ({ ...current, release_notes: event.target.value }))} placeholder="What changed in this release?" /></label><label className="account-wide">Buyer receives — one item per line<textarea rows={4} value={release.delivery_contents.join("\n")} onChange={(event) => setRelease(current => ({ ...current, delivery_contents: event.target.value.split("\n").map(item => item.trim()) }))} placeholder="Source bundle\nREADME and setup guide\nLicence file" /></label><label className="account-wide release-file">Private source bundle<input type="file" accept=".zip,.tgz,.tar.gz,application/zip,application/gzip" onChange={(event) => setBundle(event.target.files?.[0] ?? null)} /><small>{bundle ? `${bundle.name} · ${displayBytes(bundle.size)} — ready to upload` : selectedRecord?.source_bundle_name ? `Current bundle: ${selectedRecord.source_bundle_name} · ${displayBytes(selectedRecord.source_bundle_size)}` : "ZIP, TGZ, or TAR.GZ · maximum 100 MB. Uploading a replacement does not remove the previous file yet."}</small></label></div><button className="submit" disabled={saving}>{saving ? "Saving release…" : "Save release and bundle"}</button>{note && <p className="form-note">{note}</p>}</form></section>;
}
