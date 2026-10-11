export type AcquisitionKind = "source" | "integration" | "live";

export type AcquisitionProduct = {
  slug: string;
  name: string;
  kind: AcquisitionKind;
  delivery: string;
  availability: string;
  summary: string;
  includes: string[];
  licences: string[];
  priceContext?: string;
};

export const acquisitionProducts: AcquisitionProduct[] = [
  { slug: "dera", name: "Dera 1.6", kind: "integration", delivery: "Scoped paid integration", availability: "Private beta / scoped terms", summary: "An evidence-first local runtime integrated into an agreed product architecture.", includes: ["Integration-fit conversation", "Defined scope and commercial terms", "Configured flows, handover, and agreed support"], licences: ["Custom integration terms"] },
  { slug: "ruby", name: "Ruby", kind: "source", delivery: "Buy & deploy source handover", availability: "Acquisition enquiry", summary: "A ready-to-deploy marketplace application with a documented handover path.", includes: ["Application source", "Setup and deployment documentation", "Product walkthrough and defined handover window"], licences: ["Single project licence", "Agency licence", "Custom terms"] },
  { slug: "neptune", name: "Neptune", kind: "live", delivery: "Live product acquisition", availability: "Enquiry before acquisition", summary: "A creative operations hub for bringing studio work, direction, and output into one place.", includes: ["Live product walkthrough", "Current experience and visual system", "Acquisition conversation and delivery plan"], licences: ["Live product terms", "Custom terms"] },
  { slug: "pluto", name: "Pluto", kind: "live", delivery: "Live product acquisition", availability: "Enquiry before acquisition", summary: "A luxury commerce experience built around product craft, collection, and atmosphere.", includes: ["Live product walkthrough", "Current experience and visual system", "Acquisition conversation and delivery plan"], licences: ["Live product terms", "Custom terms"] },
  { slug: "moon", name: "Moon", kind: "live", delivery: "Live product acquisition", availability: "Enquiry before acquisition", summary: "A paired Windows diagnostics companion designed around local evidence and approval.", includes: ["Live product walkthrough", "Current companion experience", "Acquisition conversation and delivery plan"], licences: ["Live product terms", "Custom terms"] },
  { slug: "lina", name: "Lina", kind: "live", delivery: "Live product acquisition", availability: "Enquiry before acquisition", summary: "A payments-platform experience for communicating checkout, billing, wallets, and trust.", includes: ["Live product walkthrough", "Current experience and visual system", "Acquisition conversation and delivery plan"], licences: ["Live product terms", "Custom terms"] },
];

export const acquisitionBySlug = Object.fromEntries(acquisitionProducts.map((product) => [product.slug, product])) as Record<string, AcquisitionProduct>;
