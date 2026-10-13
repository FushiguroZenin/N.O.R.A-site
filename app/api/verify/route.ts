import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const secret = process.env.NORA_VERIFY_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-nora-verify-secret") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Server verification is not configured" }, { status: 503 });
  const body = await request.json() as { repository?: string; commit?: string; conclusion?: "success" | "failure" | "pending"; summary?: string; runtime?: string; workflowUrl?: string };
  if (!body.repository || !body.conclusion) return NextResponse.json({ error: "Repository and conclusion are required" }, { status: 400 });
  const supabase = createClient(url, serviceKey);
  const repositoryUrl = "https://github.com/" + body.repository;
  const { error } = await supabase.from("listing_drafts").update({
    verification_status: body.conclusion === "success" ? "verified" : body.conclusion === "pending" ? "pending" : "failed",
    verification_commit: body.commit ?? null,
    verification_runtime: body.runtime ?? "Declared runner",
    verification_repository_url: repositoryUrl,
    verification_workflow_url: body.workflowUrl ?? null,
    verification_checked_at: new Date().toISOString(),
    verification_summary: body.summary ?? (body.conclusion === "success" ? "Clean install and build passed." : body.conclusion === "pending" ? "NORA Verify is running for this commit." : "NORA Verify failed. Inspect the GitHub workflow log."),
  }).eq("repository_url", repositoryUrl);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
