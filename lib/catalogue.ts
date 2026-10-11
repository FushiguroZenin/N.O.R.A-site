export type ProductCategory = "runtime" | "automation" | "sdk" | "tool" | "application";

export type Product = {
  slug: string;
  name: string;
  maker: string;
  description: string;
  version: string;
  price: string;
  category: ProductCategory;
  preview: string;
  variant?: "sdk" | "flow";
  href?: string;
};

export const products: Product[] = [
  { slug: "dera-1-6", name: "Dera 1.6", maker: "Field Systems", description: "Local runtime for safe, evidence-backed computer agents.", version: "v1.6.0", price: "Beta", category: "runtime", preview: "dera\nevidence verified" },
  { slug: "ruby", name: "Ruby", maker: "NORA Archive", description: "A ready-to-deploy marketplace application for developers to list, buy, and trade software.", version: "Archive release", price: "Acquisition", category: "application", preview: "ruby\ncode. create. trade.", variant: "flow" },
  { slug: "neptune", name: "Neptune", maker: "Indra", description: "A live creative operations hub for bringing work, direction, and output into one place.", version: "Live project", price: "View live", category: "application", preview: "NEPTUNE\ncreative operations", href: "https://neptune-mauve.vercel.app/" },
  { slug: "pluto", name: "Pluto", maker: "Indra", description: "A polished luxury watch website built to make product, craft, and atmosphere feel tangible online.", version: "Live project", price: "View live", category: "application", preview: "PLUTO\nhorlogerie", href: "https://pluto-horlogerie.vercel.app/", variant: "sdk" },
  { slug: "moon", name: "Moon", maker: "Indra", description: "A Windows diagnostics application that turns system health into an approachable desktop experience.", version: "Live project", price: "View live", category: "application", preview: "MOON\nwindows diagnostics", href: "https://moon-adt.vercel.app/" },
  { slug: "lina", name: "Lina", maker: "Indra", description: "A polished payments platform experience for turning checkout, billing, and wallets into one clear customer journey.", version: "Live project", price: "View live", category: "application", preview: "LINA\nsecure. simple. yours.", href: "https://lina-pied.vercel.app/", variant: "flow" },
];

export const categories = [
  { value: "all", label: "All work" },
  { value: "runtime", label: "Runtimes" },
  { value: "application", label: "Applications" },
] as const;
