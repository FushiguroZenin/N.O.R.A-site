export type ListingInput = {
  name: string; outcome: string; type: string; delivery: string; preview: string | null; repository: string | null;
  priceMode: "fixed" | "from" | "quote"; priceAmount: string; included: string[]; requirements: string[]; boundary: string[];
  proofValid: boolean; proofSafeData: boolean; proofType: string;
  readinessLevel: "Ready to use" | "Ready to deploy" | "Developer required"; setupTime: string; requiredServices: string[]; environmentVariables: string[];
};
export type PreflightCheck = { label: string; passed: boolean; detail: string };
function isPreviewUrl(value: string | null) { if (!value || value === "https://") return false; try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } }
export function listingPreflight(input: ListingInput, technicalEvidence = false) {
  const needsRepository = input.delivery !== "Live project"; const needsDeploymentGuide = input.readinessLevel === "Ready to deploy";
  const checks: PreflightCheck[] = [
    { label: "Product name", passed: Boolean(input.name.trim()) && input.name !== "Your product", detail: "Give the work a clear, specific name." },
    { label: "Outcome", passed: Boolean(input.outcome.trim()) && input.outcome !== "A clear outcome for the person who needs it.", detail: "Explain what the buyer can achieve." },
    { label: "Product type", passed: Boolean(input.type), detail: "Classify the kind of software." },
    { label: "Delivery", passed: Boolean(input.delivery), detail: "State how a buyer receives it." },
    { label: "Commercial terms", passed: input.priceMode === "quote" || Number(input.priceAmount) > 0, detail: "Set a fixed or starting price, or choose request a quote." },
    { label: "Live preview", passed: isPreviewUrl(input.preview), detail: "Add a valid http(s) preview URL as evidence." },
    { label: "Technical evidence", passed: !needsRepository || technicalEvidence, detail: "Add a public GitHub repository with a passing NORA verification workflow." },
    { label: "Buyer proof", passed: input.proofValid, detail: "Provide a proof source that matches its declared type." },
    { label: "Safe demo data", passed: input.proofType === "Technical evidence" || input.proofSafeData, detail: "Confirm that the demo uses safe, non-production data and actions." },
    { label: "Buyer readiness", passed: Boolean(input.readinessLevel), detail: "State whether a buyer can use, deploy, or must technically integrate this product." },
    { label: "Deployment guide", passed: !needsDeploymentGuide || (Boolean(input.setupTime.trim()) && input.requiredServices.length > 0), detail: "Ready-to-deploy products need setup time and at least one required service or account." },
    { label: "Environment setup", passed: !needsDeploymentGuide || input.environmentVariables.length > 0, detail: "List required environment-variable names, or state NONE if there are no variables." },
    { label: "Included", passed: input.included.filter(Boolean).length > 0, detail: "List at least one item the buyer receives." },
    { label: "Requirements", passed: input.requirements.filter(Boolean).length > 0, detail: "State at least one adoption requirement." },
    { label: "Support boundary", passed: input.boundary.filter(Boolean).length > 0, detail: "Define the support or scope boundary." },
  ];
  return { checks, ready: checks.every(check => check.passed) };
}
