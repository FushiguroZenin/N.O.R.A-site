import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type EmailEvent = "request-created" | "request-status" | "listing-status" | "entitlement" | "support-ticket" | "support-update";
const allowedEvents = new Set<EmailEvent>(["request-created", "request-status", "listing-status", "entitlement", "support-ticket", "support-update"]);

type AdminClient = { auth: { admin: { getUserById: (id: string) => Promise<{ data: { user: { email?: string | null } | null } }> } } };
async function userEmail(admin: AdminClient, id: string | null) {
  if (!id) return null;
  const { data } = await admin.auth.admin.getUserById(id);
  return data.user?.email ?? null;
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.NORA_EMAIL_FROM;
  const supportEmail = process.env.NORA_SUPPORT_EMAIL;
  if (!url || !publicKey || !serviceKey) return NextResponse.json({ error: "Email service is unavailable" }, { status: 503 });
  if (!resendKey || !from) return NextResponse.json({ configured: false, message: "Email notifications are not configured yet." });

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Sign in is required" }, { status: 401 });
  const client = createClient(url, publicKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in is required" }, { status: 401 });
  const body = await request.json() as { event?: EmailEvent; id?: string };
  if (!body.id || !body.event || !allowedEvents.has(body.event)) return NextResponse.json({ error: "A valid email event is required" }, { status: 400 });

  const admin = createClient(url, serviceKey);
  const { data: profile } = await admin.from("profiles").select("is_operator").eq("id", auth.user.id).maybeSingle();
  let to: string | null = null;
  let subject = "NORA update";
  let message = "There is an update in your NORA workspace.";

  if (body.event === "support-ticket" || body.event === "support-update") {
    const { data: ticket } = await admin.from("support_tickets").select("subject,status,reporter_id,operator_note").eq("id", body.id).maybeSingle();
    if (!ticket) return NextResponse.json({ error: "Support ticket not found" }, { status: 404 });
    if (body.event === "support-ticket") {
      if (ticket.reporter_id !== auth.user.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      to = supportEmail ?? null;
      subject = `NORA support — ${ticket.subject}`;
      message = `A new support request needs review: “${ticket.subject}”. Open the Operations workspace to respond.`;
    } else {
      if (!profile?.is_operator) return NextResponse.json({ error: "Operator access is required" }, { status: 403 });
      to = await userEmail(admin, ticket.reporter_id);
      subject = `NORA support update — ${ticket.subject}`;
      message = `Your support request is now ${ticket.status.replace(/_/g, " ")}.${ticket.operator_note ? ` NORA: ${ticket.operator_note}` : ""}`;
    }
  } else if (body.event === "listing-status") {
    if (!profile?.is_operator) return NextResponse.json({ error: "Operator access is required" }, { status: 403 });
    const { data: listing } = await admin.from("listing_drafts").select("product_name,status,creator_id,review_note").eq("id", body.id).maybeSingle();
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    to = await userEmail(admin, listing.creator_id);
    subject = `NORA review update — ${listing.product_name}`;
    message = listing.status === "published" ? `Your record “${listing.product_name}” is now published in NORA's catalogue.` : `Your record “${listing.product_name}” needs changes before it can be published.${listing.review_note ? ` Operations note: ${listing.review_note}` : ""}`;
  } else {
    const { data: record } = await admin.from("acquisition_requests").select("product_name,status,buyer_id,creator_id").eq("id", body.id).maybeSingle();
    if (!record) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (body.event === "request-created") {
      if (record.buyer_id !== auth.user.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      to = await userEmail(admin, record.creator_id);
      subject = `New NORA request — ${record.product_name}`;
      message = `A buyer has sent an acquisition request for “${record.product_name}”. Open your Creator workspace to review it.`;
    } else if (body.event === "request-status") {
      if (record.creator_id !== auth.user.id && !profile?.is_operator) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      to = await userEmail(admin, record.buyer_id);
      subject = `NORA request update — ${record.product_name}`;
      message = record.status === "in_conversation" ? `The creator has opened a conversation about “${record.product_name}”.` : `Your request for “${record.product_name}” is now marked ${record.status.replace(/_/g, " ")}.`;
    } else {
      if (!profile?.is_operator) return NextResponse.json({ error: "Operator access is required" }, { status: 403 });
      to = await userEmail(admin, record.buyer_id);
      subject = `Your NORA release is ready — ${record.product_name}`;
      message = `Access to “${record.product_name}” has been granted. Open your Buyer workspace to download the private release.`;
    }
  }
  if (!to) return NextResponse.json({ configured: true, delivered: false, message: "No recipient email is available." });
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject, text: `${message}\n\nOpen NORA: https://nora-marketplace.vercel.app/account` }) });
  if (!response.ok) return NextResponse.json({ error: "Email provider rejected the notification" }, { status: 502 });
  return NextResponse.json({ configured: true, delivered: true });
}
