"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { queueNoraEmail } from "@/lib/email-client";

type Ticket = { id: string; category: string; subject: string; message: string; status: "open" | "in_progress" | "resolved"; operator_note: string | null; created_at: string };

export function SupportQueue() {
  const [tickets, setTickets] = useState<Ticket[]>([]); const [enabled, setEnabled] = useState(false); const [note, setNote] = useState(""); const [working, setWorking] = useState<string>();
  const load = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data: profile } = await supabase.from("profiles").select("is_operator").eq("id", user.id).maybeSingle(); if (!profile?.is_operator) return; setEnabled(true); const { data } = await supabase.from("support_tickets").select("id,category,subject,message,status,operator_note,created_at").order("created_at", { ascending: false }).limit(30); setTickets((data ?? []) as Ticket[]); };
  useEffect(() => { load(); }, []);
  const update = async (ticket: Ticket, status: Ticket["status"]) => { setWorking(ticket.id); const { error } = await supabase.rpc("update_support_ticket", { p_ticket_id: ticket.id, p_status: status, p_operator_note: ticket.operator_note ?? "" }); setWorking(undefined); setNote(error ? error.message : "Support request updated."); if (!error) { void queueNoraEmail("support-update", ticket.id); load(); } };
  if (!enabled) return null;
  return <section className="creator-dashboard support-queue"><div className="eyebrow">Support queue</div><h2>Resolve the problems people hit.</h2>{tickets.length === 0 ? <div className="dashboard-empty"><p>No open support requests.</p></div> : <div className="draft-list">{tickets.map(ticket => <article key={ticket.id}><div><span className={`draft-status ${ticket.status === "resolved" ? "published" : ticket.status === "in_progress" ? "submitted" : "draft"}`}>{ticket.status.replace("_", " ")}</span><h3>{ticket.subject}</h3><p>{ticket.category.replace("_", " ")} · {new Date(ticket.created_at).toLocaleString()}</p><p>{ticket.message}</p><label className="account-wide">Operator note<textarea rows={2} value={ticket.operator_note ?? ""} onChange={(event) => setTickets(current => current.map(item => item.id === ticket.id ? { ...item, operator_note: event.target.value } : item))} placeholder="Visible to the reporter in their support workspace." /></label></div><div className="draft-actions"><button disabled={working === ticket.id || ticket.status === "resolved"} onClick={() => update(ticket, "in_progress")}>Start</button><button disabled={working === ticket.id || ticket.status === "resolved"} onClick={() => update(ticket, "resolved")}>Resolve</button></div></article>)}</div>}{note && <p className="form-note">{note}</p>}</section>;
}
