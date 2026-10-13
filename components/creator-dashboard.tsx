"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { acquisitionProducts } from "@/lib/acquisition";
import { listingPreflight } from "@/lib/listing-preflight";
import { validateProof, type ProofType } from "@/lib/proof-environment";
import { supabase } from "@/lib/supabase";
import { ReplySheet } from "@/components/reply-sheet";
import { RecordStatusTimeline } from "@/components/record-status-timeline";
import { queueNoraEmail } from "@/lib/email-client";

type Draft = { id: string; product_name: string; product_type: string; delivery: string; status: "draft" | "submitted" | "changes_requested" | "published"; review_note: string | null; repository_url: string | null; verification_status: "unverified" | "pending" | "verified" | "failed" | "stale" | null; verification_repository_url: string | null; verification_commit: string | null; verification_runtime: string | null; verification_checked_at: string | null; verification_summary: string | null; verification_workflow_url: string | null; updated_at: string };
type Request = { id: string; product_name: string; delivery: string; terms_requested: string; price_context: string | null; intended_use: string; organisation: string | null; buyer_name: string | null; buyer_email: string | null; status: "sent" | "in_conversation" | "acquired" | "closed"; created_at: string };

export function CreatorDashboard() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [claimedSlugs, setClaimedSlugs] = useState<string[]>([]);
  const [email, setEmail] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [claimNote, setClaimNote] = useState("");
  const [submissionNote, setSubmissionNote] = useState<{ id: string; message: string }>();
  const [deleting, setDeleting] = useState<Draft>();
  const [replyingTo, setReplyingTo] = useState<Request>();

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setEmail(user.email);
    const [draftResult, requestResult, claimResult] = await Promise.all([
      supabase.from("listing_drafts").select("id,product_name,product_type,delivery,status,review_note,repository_url,verification_status,verification_repository_url,verification_commit,verification_runtime,verification_checked_at,verification_summary,verification_workflow_url,updated_at").eq("creator_id", user.id).order("updated_at", { ascending: false }),
      supabase.from("acquisition_requests").select("id,product_name,delivery,terms_requested,price_context,intended_use,organisation,buyer_name,buyer_email,status,created_at").eq("creator_id", user.id).order("created_at", { ascending: false }),
      supabase.from("catalogue_owners").select("product_slug").eq("creator_id", user.id),
    ]);
    setDrafts(draftResult.data ?? []);
    setRequests(requestResult.data ?? []);
    setClaimedSlugs((claimResult.data ?? []).map((record) => record.product_slug));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const submitted = new URLSearchParams(window.location.search).get("submitted"); if (submitted) setSubmissionNote({ id: submitted, message: "Submitted to NORA. Your record is now being reviewed; you will see its status here." }); }, []);
  const submit = async (id: string) => {
    setSubmissionNote(undefined);
    const { data: record, error: loadError } = await supabase.from("listing_drafts").select("product_name,outcome,product_type,delivery,preview_url,repository_url,price_mode,price_amount,proof_type,proof_url,proof_safe_data,readiness_level,setup_time,required_services,environment_variables,included,requirements,boundary,verification_status,verification_repository_url").eq("id", id).single();
    if (loadError || !record) { setSubmissionNote({ id, message: "NORA could not load this record for preflight. Check that the latest Supabase migrations have been run." }); return; }
    const verifiedRepository = record.verification_status === "verified" && record.verification_repository_url === record.repository_url;
    const proof=validateProof((record.proof_type ?? "Live demo") as ProofType,record.proof_url ?? "",verifiedRepository);
    const preflight = listingPreflight({ name: record.product_name, outcome: record.outcome, type: record.product_type, delivery: record.delivery, preview: record.preview_url, repository: record.repository_url, priceMode: record.price_mode, priceAmount: record.price_amount?.toString() ?? "", proofValid:proof.valid, proofSafeData:Boolean(record.proof_safe_data), proofType:record.proof_type ?? "Live demo", readinessLevel: record.readiness_level ?? "Developer required", setupTime: record.setup_time ?? "", requiredServices: record.required_services ?? [], environmentVariables: record.environment_variables ?? [], included: record.included ?? [], requirements: record.requirements ?? [], boundary: record.boundary ?? [] }, verifiedRepository);
    if (!preflight.ready) { setSubmissionNote({ id, message: `Preflight needs attention: ${preflight.checks.filter((check) => !check.passed).map((check) => check.label).join(", ")}. Select Edit to complete those parts of the record.` }); return; }
    const { error } = await supabase.rpc("submit_listing_for_review", { p_listing_id: id });
    if (error) setSubmissionNote({ id, message: error.message });
    else setSubmissionNote({ id, message: "Preflight and verified-build gate passed. This record is now in the operations queue." });
    if (!error) load();
  };
  const claim = async (slug: string) => { const { error } = await supabase.rpc("claim_catalogue_record", { p_product_slug: slug }); setClaimNote(error ? error.message : "Catalogue record connected. Existing requests are now in your inbox."); if (!error) load(); };
  const updateRequest = async (id: string, status: Request["status"]) => {
    const { error } = await supabase.rpc("update_creator_request_status", { p_request_id: id, p_status: status });
    if (error) setClaimNote(error.message);
    else { void queueNoraEmail("request-status", id); load(); }
  };
  const deleteRecord = async () => {
    if (!deleting) return;
    const { error } = await supabase.rpc("delete_listing_record", { p_listing_id: deleting.id });
    setClaimNote(error ? error.message : `“${deleting.product_name}” was permanently deleted.`);
    setDeleting(undefined);
    if (!error) load();
  };

  if (loading) return <section className="creator-dashboard"><div className="eyebrow">Creator workspace</div><p>Loading your records…</p></section>;
  if (!email) return null;

  return <>
    <section className="creator-dashboard" id="your-records">
      <div className="dashboard-heading"><div><div className="eyebrow">Creator workspace</div><h2>Your product records.</h2><p>{email}</p></div><Link className="primary-link" href="/submit">New record</Link></div>
      <div className="dashboard-status"><span>{drafts.filter((draft) => draft.status === "draft").length} drafts</span><span>{drafts.filter((draft) => draft.status === "submitted").length} in review</span><span>{drafts.filter((draft) => draft.status === "changes_requested").length} need changes</span><span>{drafts.filter((draft) => draft.status === "published").length} published</span></div>
      {drafts.length === 0 ? <div className="dashboard-empty"><p>No records yet. Start with a finished thing worth putting on the shelf.</p><Link className="text-link" href="/submit">Build your first record</Link></div> : <div className="draft-list">{drafts.map((draft) => <article key={draft.id}><div><span className={`draft-status ${draft.status}`}>{draft.status.replace("_", " ")}</span><h3>{draft.product_name}</h3><p>{draft.product_type} · {draft.delivery}</p><RecordStatusTimeline status={draft.status} />{submissionNote?.id === draft.id && <p className="form-note record-submission-note">{submissionNote.message}</p>}{draft.status === "submitted" && <p className="workspace-more">Submitted to NORA. You’ll see an update here when it’s approved or needs changes.</p>}{draft.verification_status && draft.verification_status !== "unverified" && <div className={`verification-result ${draft.verification_status}`}><b>NORA Verify: {draft.verification_status === "verified" ? "build verified" : draft.verification_status.replace("_", " ")}</b>{draft.verification_runtime && <span>{draft.verification_runtime}</span>}{draft.verification_commit && <span>Commit {draft.verification_commit.slice(0, 7)}</span>}{draft.verification_checked_at && <span>Checked {new Date(draft.verification_checked_at).toLocaleDateString()}</span>}<p>{draft.verification_summary}</p>{draft.verification_workflow_url && <a href={draft.verification_workflow_url} target="_blank" rel="noreferrer">Open verification run ↗</a>}</div>}{draft.review_note && <div className="creator-review-note"><b>Operations note</b><p>{draft.review_note}</p></div>}</div><div className="draft-actions"><Link href={`/submit#draft=${draft.id}`} className="text-link">{draft.status === "changes_requested" ? "Make changes" : "Edit"}</Link>{draft.status === "published" && <Link href="/account/creator#release-manager" className="text-link">Prepare release</Link>}{(draft.status === "draft" || draft.status === "changes_requested") && <button onClick={() => submit(draft.id)}>{draft.verification_status === "verified" && draft.verification_repository_url === draft.repository_url ? (draft.status === "changes_requested" ? "Resubmit to NORA" : "Submit to NORA") : "Verify before submitting"}</button>}<button className="delete-record" onClick={() => setDeleting(draft)}>Delete</button></div></article>)}</div>}
    </section>
    <section className="creator-dashboard creator-inbox">
      <div className="eyebrow">Creator inbox</div><h2>Requests for your work.</h2>
      {requests.length === 0 ? <div className="dashboard-empty"><p>Connect a current catalogue record below. Buyer requests for it will arrive here.</p></div> : <div className="draft-list">{requests.map((request) => <article key={request.id}><div><span className={`draft-status ${request.status === "sent" ? "submitted" : ""}`}>{request.status.replace("_", " ")}</span><h3>{request.product_name}</h3><p>{request.delivery} · {request.terms_requested}</p><p className="request-intent">{request.intended_use}</p>{request.organisation && <p>{request.organisation}</p>}{request.buyer_email && <p className="request-contact">From {request.buyer_name || "NORA buyer"} · {request.buyer_email}</p>}</div><div className="draft-actions">{request.status !== "closed" && request.buyer_email && <button className="reply-link" onClick={() => { setReplyingTo(request); if (request.status === "sent") updateRequest(request.id, "in_conversation"); }}>Prepare reply</button>}{request.status !== "closed" && <button onClick={() => updateRequest(request.id, "closed")}>Close</button>}</div></article>)}</div>}
    </section>
    <section className="creator-dashboard catalogue-connection">
      <div className="eyebrow">Current catalogue</div><h2>Connect the work you own.</h2><p>One-time setup for an existing NORA record. This routes its buyer requests into your inbox.</p>
      <div className="dashboard-status">{acquisitionProducts.map((product) => <button key={product.slug} className={claimedSlugs.includes(product.slug) ? "claimed-record" : "claim-record"} disabled={claimedSlugs.includes(product.slug)} onClick={() => claim(product.slug)}>{claimedSlugs.includes(product.slug) ? `${product.name} connected` : `Connect ${product.name}`}</button>)}</div>
      {claimNote && <p className="form-note">{claimNote}</p>}
    </section>
    {deleting && <div className="delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div><div className="eyebrow">Permanent action</div><h2 id="delete-title">Delete {deleting.product_name}?</h2><p>This permanently removes the product record, its public listing if published, and acquisition requests attached to it. It cannot be reversed.</p><div className="delete-dialog-actions"><button className="dialog-cancel" onClick={() => setDeleting(undefined)}>Keep record</button><button className="dialog-delete" onClick={deleteRecord}>Delete permanently</button></div></div></div>}
    {replyingTo && <ReplySheet request={replyingTo} onClose={() => setReplyingTo(undefined)} />}
  </>;
}
