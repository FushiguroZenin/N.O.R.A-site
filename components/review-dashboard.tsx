"use client";

import { useEffect, useState } from "react";
import { formatPrice, type PriceMode } from "@/lib/pricing";
import { supabase } from "@/lib/supabase";

type Submission = {
  id: string; product_name: string; product_type: string; outcome: string; delivery: string;
  preview_url: string | null; cover_image_url: string | null; gallery_image_urls: string[] | null; demo_url: string | null;
  repository_url: string | null; price_mode: PriceMode; price_amount: number | null; currency: string; price_note: string | null;
  verification_status: "unverified" | "pending" | "verified" | "failed" | "stale" | null; verification_repository_url: string | null; verification_commit: string | null; verification_runtime: string | null; verification_checked_at: string | null; verification_summary: string | null; verification_workflow_url: string | null;
  included: string[]; requirements: string[]; boundary: string[]; updated_at: string;
};

export function ReviewDashboard() {
  const [records, setRecords] = useState<Submission[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [note, setNote] = useState("");
  const [returningId, setReturningId] = useState<string>();
  const [feedback, setFeedback] = useState("");

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("is_operator").eq("id", user.id).maybeSingle();
    if (!profile?.is_operator) { setAccessDenied(true); return; }
    setEnabled(true);
    const { data, error } = await supabase.from("listing_drafts").select("id,product_name,product_type,outcome,delivery,preview_url,cover_image_url,gallery_image_urls,demo_url,repository_url,price_mode,price_amount,currency,price_note,verification_status,verification_repository_url,verification_commit,verification_runtime,verification_checked_at,verification_summary,verification_workflow_url,included,requirements,boundary,updated_at").eq("status", "submitted").order("updated_at", { ascending: true });
    if (error) setNote(error.message);
    setRecords(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.rpc("publish_listing", { p_listing_id: id });
    setNote(error ? error.message : "Record approved and added to the public catalogue.");
    if (!error) load();
  };

  const requestChanges = async (id: string) => {
    const { error } = await supabase.rpc("return_listing_for_changes", { p_listing_id: id, p_review_note: feedback });
    setNote(error ? error.message : "Specific feedback sent. The record is back with its creator.");
    if (!error) { setReturningId(undefined); setFeedback(""); load(); }
  };

  if (accessDenied) return <section className="creator-dashboard dashboard-empty"><div className="eyebrow">Operations</div><h2>Operations access required.</h2><p>This workspace is reserved for assigned N.O.R.A operators. Buyer and creator workspaces remain available from your account.</p></section>;
  if (!enabled) return null;
  return <section className="creator-dashboard review-dashboard">
    <div className="eyebrow">Operations · review queue</div><h2>Ready for a closer look.</h2>
    <p className="review-intro">Review the outcome, commercial terms, proof, delivery boundary, and technical evidence before placing a record on the shelf.</p>
    {records.length === 0 ? <div className="dashboard-empty"><p>No submitted records are waiting for review.</p></div> : <div className="review-queue">{records.map((record) => <article key={record.id} className="review-record">
      <div className="review-visual">{record.cover_image_url ? <img src={record.cover_image_url} alt={`${record.product_name} preview`} /> : <div>NORA<br />product record</div>}</div>
      <div className="review-copy"><span className="draft-status submitted">In review</span><h3>{record.product_name}</h3><p>{record.product_type} · {record.delivery}</p><p className="review-outcome">{record.outcome}</p><dl><div><dt>Commercial terms</dt><dd>{formatPrice(record.price_mode, record.price_amount, record.currency, record.price_note)}</dd></div><div><dt>Evidence</dt><dd>{record.repository_url ? "Repository supplied" : "Missing repository"}</dd></div><div><dt>Record</dt><dd>{record.included.length} included · {record.requirements.length} requirements · {record.boundary.length} boundaries · {(record.gallery_image_urls ?? []).length} gallery images</dd></div></dl>
      <div className={`operator-verification ${record.verification_status ?? "unverified"}`}><b>{record.verification_status === "verified" && record.verification_repository_url === record.repository_url ? "Verified build" : "Verification cannot support publication"}</b><span>{record.verification_runtime ?? "No runtime reported"}{record.verification_commit ? ` · commit ${record.verification_commit.slice(0, 7)}` : ""}{record.verification_checked_at ? ` · ${new Date(record.verification_checked_at).toLocaleString()}` : ""}</span><p>{record.verification_summary ?? "No NORA Verify report has been received for this record."}</p>{record.verification_workflow_url && <a href={record.verification_workflow_url} target="_blank" rel="noreferrer">Open verification run ↗</a>}</div>
      <div className="review-links">{record.preview_url && <a href={record.preview_url} target="_blank" rel="noreferrer">Open preview ↗</a>}{record.demo_url && <a href={record.demo_url} target="_blank" rel="noreferrer">Watch walkthrough ↗</a>}{record.repository_url && <a href={record.repository_url} target="_blank" rel="noreferrer">Inspect repository ↗</a>}</div></div>
      <div className="review-actions"><button disabled={record.verification_status !== "verified" || record.verification_repository_url !== record.repository_url} onClick={() => approve(record.id)}>Approve record</button><button className="review-return" onClick={() => { setReturningId(record.id); setFeedback(""); }}>Request changes</button></div>
      {returningId === record.id && <div className="review-feedback"><label>Feedback for the creator<textarea autoFocus rows={4} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Be specific: what is missing, unclear, or needs correction?" /></label><div><button className="review-return" onClick={() => setReturningId(undefined)}>Cancel</button><button onClick={() => requestChanges(record.id)}>Send feedback</button></div></div>}
    </article>)}</div>}
    {note && <p className="form-note">{note}</p>}
  </section>;
}
