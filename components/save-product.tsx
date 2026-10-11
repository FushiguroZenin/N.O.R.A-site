"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = { productKey: string; name: string; url: string; delivery: string };
export function SaveProduct({ productKey, name, url, delivery }: Props) {
  const [note, setNote] = useState("");
  const save = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.sessionStorage.setItem("nora_return_to", window.location.pathname + window.location.search + window.location.hash); window.location.assign("/account"); return; }
    const { error } = await supabase.from("saved_products").upsert({ buyer_id: user.id, product_key: productKey, product_name: name, product_url: url, delivery }, { onConflict: "buyer_id,product_key" });
    setNote(error ? error.message : "Saved to your buyer workspace.");
  };
  return <span className="save-product"><button onClick={save}>Save to shortlist</button>{note && <small>{note}</small>}</span>;
}
