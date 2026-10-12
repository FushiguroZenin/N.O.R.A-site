"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Notification = { id: string; title: string; body: string; href: string | null; read_at: string | null; created_at: string };

export function NotificationCentre() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("notifications").select("id,title,body,href,read_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8);
      setItems(data ?? []);
    };
    load();
  }, []);

  const markRead = async (id: string) => {
    setItems(current => current.map(item => item.id === id ? { ...item, read_at: item.read_at ?? new Date().toISOString() } : item));
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  };

  if (!items.length) return null;
  return <section className="notification-centre" aria-label="NORA updates"><div><div className="eyebrow">NORA updates</div><h2>What changed.</h2></div><div>{items.map(item => <article className={item.read_at ? "read" : ""} key={item.id}><div><b>{item.title}</b><p>{item.body}</p></div>{item.href ? <Link href={item.href} onClick={() => markRead(item.id)}>Open <span>→</span></Link> : <button onClick={() => markRead(item.id)}>Mark read</button>}</article>)}</div></section>;
}
