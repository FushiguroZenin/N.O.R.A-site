"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DeletionRequest = { id: string; status: "open" | "in_review" | "closed" | "rejected"; operator_note: string | null; created_at: string };

export function AccountSafetyControls() {
  const [request, setRequest] = useState<DeletionRequest>();
  const [signedIn, setSignedIn] = useState(false);
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSignedIn(true);
    const { data } = await supabase.from("account_deletion_requests").select("id,status,operator_note,created_at").order("created_at", { ascending: false }).limit(1).maybeSingle();
    setRequest(data as DeletionRequest | undefined);
  };

  useEffect(() => { load(); }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signedIn) { setNote("Sign in before submitting an account request."); return; }
    setWorking(true);
    const data = new FormData(event.currentTarget);
    const { error } = await supabase.rpc("request_account_deletion", { p_reason: String(data.get("reason") ?? "") });
    setWorking(false);
    setNote(error ? error.message : "Your request is with NORA. Your account and existing access remain unchanged while it is reviewed.");
    if (!error) { event.currentTarget.reset(); load(); }
  };

  if (!signedIn) return null;
  return <section className="creator-dashboard account-safety-controls">
    <div className="eyebrow">Account controls</div><h2>Close an account carefully.</h2>
    <p>Request an account closure here. NORA reviews it first to protect active records, purchased releases, disputes, and the audit trail. This is not an instant data wipe.</p>
    {request && request.status !== "closed" && request.status !== "rejected" ? <div className="account-request-status"><span className="draft-status submitted">{request.status.replace("_", " ")}</span><p>Requested {new Date(request.created_at).toLocaleDateString()}.</p>{request.operator_note && <p className="workspace-more">NORA: {request.operator_note}</p>}</div> : <form className="contact-form" onSubmit={submit}><label>Why are you closing this account? <span className="field-optional">Optional</span><textarea name="reason" rows={3} maxLength={1000} placeholder="For example: no longer using NORA. Do not include passwords, keys, or payment details." /></label><button className="delete-record" type="submit" disabled={working}>{working ? "Sending request…" : "Request account closure"}</button></form>}
    {request?.status === "closed" && <p className="workspace-more">Your request is marked closed. If you still need help, contact support with the request context.</p>}
    {request?.status === "rejected" && <p className="workspace-more">Your request needs more information. Contact support if the operator note does not resolve it.</p>}
    {note && <p className="form-note">{note}</p>}
  </section>;
}
