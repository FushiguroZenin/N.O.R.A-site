export type ProofType = "Live demo" | "Interactive sandbox" | "Guided walkthrough" | "Technical evidence";
export type ProofValidation = { valid: boolean; label: string; detail: string };

function host(url: string) { try { return new URL(url).hostname.replace(/^www\./,"").toLowerCase(); } catch { return ""; } }
function httpUrl(value: string) { try { const url=new URL(value); return url.protocol==="https:"||url.protocol==="http:"; } catch { return false; } }

export function validateProof(type: ProofType, url: string, technicalEvidence = false): ProofValidation {
  if (type === "Technical evidence") return technicalEvidence ? { valid:true,label:"Repository evidence verified",detail:"NORA found the required public repository evidence." } : { valid:false,label:"Repository evidence needed",detail:"Technical evidence needs a public repository with passing NORA verification." };
  if (!httpUrl(url)) return { valid:false,label:"A valid URL is needed",detail:"Add an http(s) proof link." };
  const hostname=host(url);
  if (type === "Interactive sandbox") {
    const supported=["stackblitz.com","codesandbox.io","codepen.io","replit.com"];
    return supported.some(domain=>hostname===domain||hostname.endsWith(`.${domain}`)) ? {valid:true,label:"Recognised sandbox",detail:"This link matches a supported interactive-sandbox provider."} : {valid:false,label:"Use a recognised sandbox",detail:"Use StackBlitz, CodeSandbox, CodePen, or Replit for an interactive sandbox."};
  }
  if (type === "Guided walkthrough") {
    const supported=["youtube.com","youtu.be","vimeo.com","loom.com"];
    return supported.some(domain=>hostname===domain||hostname.endsWith(`.${domain}`)) ? {valid:true,label:"Recognised walkthrough",detail:"This link matches a supported walkthrough provider."} : {valid:false,label:"Use a recognised walkthrough",detail:"Use YouTube, Vimeo, or Loom for a guided walkthrough."};
  }
  return {valid:true,label:"Live demo URL supplied",detail:"NORA records the live demo URL and its declared safe test conditions."};
}
