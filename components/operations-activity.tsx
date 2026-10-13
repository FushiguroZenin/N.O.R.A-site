"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Activity = { id: string; action: string; resource_type: string; metadata: { product_name?: string; version?: string }; created_at: string };
const labels: Record<string, string> = { "listing.published": "Published a record", "listing.changes_requested": "Returned a record for changes", "release.updated": "Updated a private release", "request.in_conversation": "Opened a buyer conversation", "request.closed": "Closed a buyer conversation", "entitlement.granted": "Granted private download access", "entitlement.revoked": "Revoked private download access" };

export function OperationsActivity() {
  const [items, setItems] = useState<Activity[]>([]); const [enabled, setEnabled] = useState(false);
  useEffect(() => { (async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data: profile } = await supabase.from("profiles").select("is_operator").eq("id", user.id).maybeSingle(); if (!profile?.is_operator) return; setEnabled(true); const { data } = await supabase.from("activity_log").select("id,action,resource_type,metadata,created_at").order("created_at", { ascending: false }).limit(12); setItems((data ?? []) as Activity[]); })(); }, []);
  if (!enabled) return null;
  return <section className="creator-dashboard operations-activity"><div className="eyebrow">Operations log</div><h2>Every critical action has a trail.</h2><p>Publication, release, fulfilment, and creator-side request changes are recorded here for accountability.</p>{items.length === 0 ? <div className="dashboard-empty"><p>No protected marketplace actions have been recorded yet.</p></div> : <div className="draft-list">{items.map((item) => <article key={item.id}><div><h3>{labels[item.action] ?? item.action}</h3><p>{item.metadata.product_name ?? item.resource_type}{item.metadata.version ? ` · ${item.metadata.version}` : ""}</p></div><time>{new Date(item.created_at).toLocaleString()}</time></article>)}</div>}</section>;
}
