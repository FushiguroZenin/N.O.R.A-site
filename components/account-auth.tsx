"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const returnKey = "nora_return_to";

export function AccountAuth() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [user, setUser] = useState<string>(); const [returnTo, setReturnTo] = useState(""); const router = useRouter();
  useEffect(() => {
    const target = window.sessionStorage.getItem(returnKey) ?? "";
    setReturnTo(target);
    if (target) window.setTimeout(() => document.getElementById("account-auth")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    supabase.auth.getUser().then(({ data }) => setUser(data.user?.email));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user.email));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => { if (!user || !returnTo) return; window.sessionStorage.removeItem(returnKey); router.replace(returnTo); }, [user, returnTo, router]);
  const submit = async (event: FormEvent) => { event.preventDefault(); const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/account` } }); setMessage(error ? error.message : "Check your email for your secure NORA sign-in link."); };
  if (user) return <section id="account-auth" className="account-auth"><div className="eyebrow">Signed in</div><h2>{returnTo ? "Returning you to NORA…" : user}</h2><p>{returnTo ? "Your verified account is ready. Restoring your place now." : "One NORA identity. Separate spaces for acquiring software, building product records, and reviewing submissions."}</p>{!returnTo && <button className="primary-link" onClick={() => supabase.auth.signOut()}>Sign out</button>}</section>;
  return <section id="account-auth" className="account-auth"><div className="eyebrow">{returnTo ? "Continue with NORA" : "Join or sign in"}</div><h2>{returnTo?.startsWith("/submit") ? "You need a NORA account to publish work." : returnTo ? "You need a NORA account to acquire software." : "One verified email. No password."}</h2><p>{returnTo ? "Create or return to your account with a secure email link. We will take you straight back to what you were doing." : "NORA uses a secure email link to create or return to your account."}</p><form onSubmit={submit}><label>Email<input required autoFocus type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><button className="primary-link">Send secure link</button></form>{message && <p className="form-note">{message}</p>}</section>;
}
