"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function SubmitAndReview({draftId}:{draftId?:string}) {
 const [note,setNote]=useState("");
 const [sending,setSending]=useState(false);
 if(!draftId)return null;
 const submit=async()=>{setSending(true);const {error}=await supabase.from("listing_drafts").update({status:"submitted",review_note:null,updated_at:new Date().toISOString()}).eq("id",draftId);if(error){setNote(error.message);setSending(false);return;}window.location.assign(`/account/creator?submitted=${draftId}#your-records`);};
 return <div className="submit-review-action"><button type="button" className="submit review-submit" disabled={sending} onClick={submit}>{sending?"Submitting…":"Submit to NORA"}</button>{note&&<p className="form-note">{note}</p>}</div>;
}
