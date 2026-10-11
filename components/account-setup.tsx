"use client";

import { FormEvent, useState } from "react";

type AccountSetupProps = { role: "buyer" | "creator" };

export function AccountSetup({ role }: AccountSetupProps) {
  const [complete, setComplete] = useState(false);
  const label = role === "buyer" ? "Buyer" : "Creator";
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setComplete(true); };
  return <form className="account-form" onSubmit={submit}><div className="account-role"><span>Account type</span><b>{label}</b></div><div className="submission-grid"><label>Name<input required placeholder="Your name" /></label><label>Email<input required type="email" placeholder="you@example.com" /></label>{role === "creator" && <label className="account-wide">Studio or independent practice<input placeholder="Optional" /></label>}</div>{role === "buyer" ? <label>What are you looking for?<textarea rows={4} placeholder="A runtime, a live product, an integration…" /></label> : <label>What do you make?<textarea rows={4} placeholder="A short introduction to the work you plan to publish." /></label>}<button className="submit" type="submit">Continue as {label}</button>{complete && <p className="form-note">Your account setup is saved locally for this prototype. Email verification and real account storage come next.</p>}</form>;
}
