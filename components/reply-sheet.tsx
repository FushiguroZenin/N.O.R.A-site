"use client";

import { useState } from "react";

type Request = { product_name: string; buyer_name: string | null; buyer_email: string | null; intended_use: string; terms_requested: string; price_context: string | null };

export function ReplySheet({ request, onClose }: { request: Request; onClose: () => void }) {
  const [copied, setCopied] = useState("");
  const recipient = request.buyer_email ?? "";
  const subject = `NORA — ${request.product_name}`;
  const body = `Hi ${request.buyer_name || "there"},\n\nThanks for your interest in ${request.product_name}. I have reviewed your request for ${request.intended_use}.\n\nRequested terms: ${request.terms_requested}${request.price_context ? `\nPrice context: ${request.price_context}` : ""}\n\nI would be happy to confirm fit, delivery, and the next step.\n\nBest,`;
  const copy = async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(label); }
    catch { setCopied("Copy is unavailable in this browser."); }
  };

  return <div className="delete-dialog reply-sheet" role="dialog" aria-modal="true" aria-labelledby="reply-title">
    <div className="reply-sheet-panel">
      <div className="reply-sheet-head">
        <div className="eyebrow">Reply to buyer</div>
        <button className="reply-sheet-close" type="button" onClick={onClose} aria-label="Close reply sheet">×</button>
      </div>
      <h2 id="reply-title">{request.product_name}</h2>
      <p>NORA has prepared the recipient and a starting message. Copy what you need, or open it in your mail app.</p>
      <p className="reply-copy-status" role="status" aria-live="polite">{copied || " "}</p>
      <div className="reply-sheet-scroll">
        <label>To<input readOnly value={recipient}/><button type="button" className="text-link" onClick={() => copy(recipient, "Buyer email copied.")}>{copied === "Buyer email copied." ? "Copied email" : "Copy email"}</button></label>
        <label>Subject<input readOnly value={subject}/><button type="button" className="text-link" onClick={() => copy(subject, "Subject copied.")}>{copied === "Subject copied." ? "Copied subject" : "Copy subject"}</button></label>
        <label>Message<textarea readOnly rows={8} value={body}/><button type="button" className="text-link" onClick={() => copy(body, "Message copied.")}>{copied === "Message copied." ? "Copied message" : "Copy message"}</button></label>
      </div>
      <div className="delete-dialog-actions"><button className="dialog-cancel" type="button" onClick={onClose}>Close</button><a className="dialog-delete" href={`mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>Open mail app</a></div>
    </div>
  </div>;
}
