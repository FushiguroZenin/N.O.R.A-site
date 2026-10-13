"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DeletionRequest = { id: string; requester_id: string; reason: string | null; status: "open" | "in_review" | "closed" | "rejected"; operator_note: string | null; created_at: string };
type Listing = { id: string; creator_id: string; product_name: string; status: string; is_suspended: boolean; moderation_note: string | null; updated_at: string; creatorAccountStatus?: "active" | "suspended" };

export function MarketplaceSafetyQueue() {
  const [enabled, setEnabled] = useState(false); const [deletions, setDeletions] = useState<DeletionRequest[]>([]); const [listings, setListings] = useState<Listing[]>([]); const [notes, setNotes] = useState<Record<string, string>>({}); const [status, setStatus] = useState(""); const [working, setWorking] = useState<string>();
  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("is_operator").eq("id", user.id).maybeSingle(); if (!profile?.is_operator) return;
    setEnabled(true);
    const [deletionResult, listingResult, profileResult] = await Promise.all([
      supabase.from("account_deletion_requests").select("id,requester_id,reason,status,operator_note,created_at").in("status", ["open", "in_review"]).order("created_at", { ascending: true }),
      supabase.from("listing_drafts").select("id,creator_id,product_name,status,is_suspended,moderation_note,updated_at").eq("status", "published").order("updated_at", { ascending: false }).limit(40),
      supabase.from("profiles").select("id,account_status"),
    ]);
    const accountStatuses = new Map((profileResult.data ?? []).map(profile => [profile.id, profile.account_status as "active" | "suspended"]));
    setDeletions((deletionResult.data ?? []) as DeletionRequest[]); setListings(((listingResult.data ?? []) as Listing[]).map(listing => ({ ...listing, creatorAccountStatus: accountStatuses.get(listing.creator_id) ?? "active" })));
  };
  useEffect(() => { load(); }, []);
  const updateDeletion = async (request: DeletionRequest, next: DeletionRequest["status"]) => {
    setWorking(request.id); const { error } = await supabase.rpc("update_account_deletion_request", { p_request_id: request.id, p_status: next, p_operator_note: notes[request.id] ?? request.operator_note ?? "" }); setWorking(undefined); setStatus(error ? error.message : "Account request updated."); if (!error) load();
  };
  const moderateListing = async (listing: Listing) => {
    setWorking(listing.id);
    const { error } = listing.is_suspended
      ? await supabase.rpc("restore_listing_record", { p_listing_id: listing.id, p_note: notes[listing.id] ?? "" })
      : await supabase.rpc("suspend_listing_record", { p_listing_id: listing.id, p_note: notes[listing.id] ?? "" });
    setWorking(undefined); setStatus(error ? error.message : listing.is_suspended ? "Record restored to the catalogue." : "Record removed from the public catalogue."); if (!error) load();
  };
  const toggleAccount = async (listing: Listing, suspended: boolean) => {
    setWorking(`${listing.id}-account`); const { error } = await supabase.rpc("set_account_status", { p_user_id: listing.creator_id, p_status: suspended ? "suspended" : "active", p_note: notes[listing.id] ?? "" }); setWorking(undefined); setStatus(error ? error.message : suspended ? "Creator account suspended." : "Creator account restored.");
  };
  if (!enabled) return null;
  return <section className="creator-dashboard marketplace-safety-queue"><div className="eyebrow">Marketplace safety</div><h2>Act without erasing the evidence.</h2><p>Take a record off the shelf, restore it, or lock an account when there is a credible safety, ownership, or conduct issue. State the reason clearly: creators see record decisions; account locks are serious.</p>
    <div className="safety-subsection"><h3>Account-closure requests</h3>{deletions.length === 0 ? <p className="workspace-more">No account-closure requests waiting for review.</p> : <div className="draft-list">{deletions.map(item => <article key={item.id}><div><span className="draft-status submitted">{item.status.replace("_", " ")}</span><h3>Account request</h3><p>{item.reason || "No reason provided."}</p><label className="account-wide">Operator note<textarea rows={2} value={notes[item.id] ?? item.operator_note ?? ""} onChange={(event) => setNotes(current => ({ ...current, [item.id]: event.target.value }))} placeholder="Visible to the requester." /></label></div><div className="draft-actions"><button disabled={working === item.id} onClick={() => updateDeletion(item, "in_review")}>Review</button><button className="delete-record" disabled={working === item.id} onClick={() => updateDeletion(item, "closed")}>Close request</button></div></article>)}</div>}</div>
    <div className="safety-subsection"><h3>Published records</h3>{listings.length === 0 ? <p className="workspace-more">No published records found.</p> : <div className="draft-list">{listings.map(listing => <article key={listing.id}><div><span className={`draft-status ${listing.is_suspended ? "changes_requested" : "published"}`}>{listing.is_suspended ? "off shelf" : "live"}</span><h3>{listing.product_name}</h3><p>{listing.is_suspended ? listing.moderation_note || "No moderation note recorded." : "Public catalogue record."}</p><label className="account-wide">Decision note<textarea rows={2} value={notes[listing.id] ?? listing.moderation_note ?? ""} onChange={(event) => setNotes(current => ({ ...current, [listing.id]: event.target.value }))} placeholder={listing.is_suspended ? "Optional restoration note" : "Required before taking down a record or locking an account."} /></label></div><div className="draft-actions"><button className={listing.is_suspended ? "" : "delete-record"} disabled={working === listing.id} onClick={() => moderateListing(listing)}>{working === listing.id ? "Updating…" : listing.is_suspended ? "Restore listing" : "Take off shelf"}</button><button className="delete-record" disabled={working === `${listing.id}-account`} onClick={() => toggleAccount(listing, listing.creatorAccountStatus !== "suspended")}>{working === `${listing.id}-account` ? "Updating…" : listing.creatorAccountStatus === "suspended" ? "Restore creator account" : "Lock creator account"}</button></div></article>)}</div>}</div>
    {status && <p className="form-note">{status}</p>}
  </section>;
}
