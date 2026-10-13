"use client";

import { supabase } from "@/lib/supabase";

export type NoraEmailEvent = "request-created" | "request-status" | "listing-status" | "entitlement";

export async function queueNoraEmail(event: NoraEmailEvent, id: string) {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify({ event, id }),
    });
  } catch {
    // The marketplace action already succeeded. Email is a best-effort notification.
  }
}
