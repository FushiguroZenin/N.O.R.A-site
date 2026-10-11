"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [note, setNote] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`NORA — ${data.get("topic")}`);
    const body = encodeURIComponent(`Name: ${data.get("name")}\nEmail: ${data.get("email")}\n\n${data.get("message")}`);
    window.location.href = `mailto:tonioladeji@gmail.com?subject=${subject}&body=${body}`;
    setNote("Your email app should open with this message prepared. Nothing is sent until you send it.");
  };
  return <form className="contact-form" onSubmit={submit}><label>Name<input required name="name" placeholder="Your name" /></label><label>Email<input required type="email" name="email" placeholder="you@example.com" /></label><label>What is this about?<select name="topic"><option>Buying a product</option><option>Listing software</option><option>Licensing question</option><option>Partnership or press</option><option>Something else</option></select></label><label>Message<textarea required name="message" rows={6} placeholder="A little context goes a long way." /></label><button className="submit" type="submit">Prepare message</button>{note && <p className="form-note">{note}</p>}</form>;
}
