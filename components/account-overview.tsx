"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Counts = { requests: number; drafts: number; review: number; published: number };

export function AccountOverview() {
  const [counts, setCounts] = useState<Counts>();
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [requests, drafts] = await Promise.all([
        supabase.from("acquisition_requests").select("id", { count: "exact", head: true }).eq("buyer_id", user.id),
        supabase.from("listing_drafts").select("status").eq("creator_id", user.id),
      ]);
      const records = drafts.data ?? [];
      setCounts({ requests: requests.count ?? 0, drafts: records.filter((record) => record.status === "draft").length, review: records.filter((record) => record.status === "submitted").length, published: records.filter((record) => record.status === "published").length });
    };
    load();
  }, []);
  if (!counts) return null;
  return <section className="account-overview"><div><div className="eyebrow">Your NORA</div><h2>What is moving.</h2></div><div className="overview-counts"><span><b>{counts.requests}</b> requests</span><span><b>{counts.drafts}</b> drafts</span><span><b>{counts.review}</b> in review</span><span><b>{counts.published}</b> published</span></div></section>;
}
