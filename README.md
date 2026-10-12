# NORA

**NORA — Network of Reusable Applications** is an outcome-first marketplace for finished software.

It replaces the bid-first freelance loop with product records. Creators publish applications, tools, runtimes, and scoped integrations that already exist; buyers inspect the work, its proof, delivery model, technical boundaries, price, and licence context before starting a conversation or acquiring it.

> **Sell the work. Skip the pitch.**

## Why NORA exists

Traditional freelance marketplaces create friction on both sides. Buyers sort through broad proposals before they can tell whether a person can solve the problem. Creators compete on ratings, availability, and response speed even when they have already built the relevant solution.

NORA treats useful software as inventory rather than a promise of future labour. It is not a generic freelancer directory or a template dump. Each listing is a structured, reusable outcome with a defined delivery path.

## Product model

| Listing type | Buyer receives | Typical use |
| --- | --- | --- |
| **Live project** | A live, evaluable experience and acquisition discussion | Finished web products and polished experiences |
| **Buy & deploy** | A source bundle or deployable application under agreed terms | Products a buyer wants to own and adapt |
| **Paid integration** | A defined implementation of a reusable tool or runtime | Software that needs scoped setup and support |

The initial curated catalogue includes real work: **Dera 1.6**, **Ruby**, **Neptune**, **Pluto**, **Moon**, and **Lina**. Creator-published records now join this same public catalogue rather than living in a separate feed.

## What is built

### Public marketplace

- Editorial home page with the proposition “Sell the work. Skip the pitch.”
- One-time hero motion and a rotating featured-applications module.
- Searchable, filterable `/catalogue` for delivery model and product type.
- One unified catalogue feed: curated NORA records and approved creator releases use the same cards, search, filters, pricing treatment, and product-record journey.
- Public product pages for curated work and generated `/listing?id=<record-id>` pages for creator listings.
- Listing cards show a price or commercial terms, release version where declared, preview imagery, and a decision-focused summary.
- Every curated product record now carries the same buyer contract as a creator listing: a **Try it first** proof environment, buyer-readiness level, setup requirements, and a fixed-scope setup option where relevant.
- Creator listings can declare a live demo, recognised interactive sandbox, guided walkthrough, or technical evidence; product pages explain what a buyer can safely test.
- Proof preflight checks the declared source against its proof type and requires a safe-demo-data confirmation for non-technical proof environments.
- A visible **Can you run this?** panel distinguishes ready-to-use, ready-to-deploy, and developer-required products before acquisition.
- Creator-uploaded cover images and up to four gallery screenshots, with NORA fallback visuals when none are supplied.
- Optional external demo-video link support (YouTube, Vimeo, or Loom).
- Global footer with About, Licensing, Contact, Terms, GitHub, mail, and LinkedIn links.
- Responsive layout: the desktop rail becomes a compact navigation bar on smaller screens.

### Accounts and access

- Passwordless Supabase email authentication using magic links.
- Live authentication is configured for [nora-marketplace.vercel.app](https://nora-marketplace.vercel.app), with separate local and production redirect URLs in Supabase.
- Public browsing remains open; saving a draft, submitting work, saving a product, or sending an acquisition request requires sign-in.
- Signed-out actions redirect to `/account` and return the person to the work they were doing after authentication.
- `/join` separates the buyer and creator entry points without splitting the marketplace itself.
- Shared account overview plus focused buyer, creator, and reviewer workspaces.

### Creator workflow

- `/submit` product-record builder with draft saving.
- Fields for outcome, category, delivery model, preview URL, source context, price, licence terms, included items, requirements, support boundary, cover image, gallery, and technical evidence.
- Structured proof declaration: proof type, proof link, buyer test instructions, and safe-demo-data confirmation.
- Buyer-readiness declaration: required operator, setup time, services, environment-variable names, and optional fixed-price creator setup add-on.
- Product-record preflight checks before review submission.
- Creator dashboard for drafts, review status, feedback, published records, routed acquisition requests, and irreversible deletion with confirmation.
- Creator release manager for version, release notes, tested environment, dependency notes, declared licence, delivery contents, and release date.
- Private creator source-bundle upload for release delivery (.zip, .tgz, or .tar.gz, up to 100 MB).
- Generated public listing pages use the submitted data instead of requiring custom-built pages for every creator.

### Review, technical evidence, and trust

- Restricted reviewer queue to approve a record or request changes with a note.
- Publishing makes an approved record publicly discoverable and links it to its creator for request routing.
- Public GitHub technical-evidence checks for repository structure.
- `templates/nora-verify.yml` is a reusable GitHub Actions starter workflow. It supports Node projects with a lockfile and simple vanilla sites with an `index.html` entry point.
- `POST /api/verify` receives a signed workflow result and records a verified or failed build, commit, runtime, timestamp, and summary against the matching creator record.
- Creator Studio surfaces that verification outcome beside the relevant record, so a creator can act on a failed build rather than discovering it only in GitHub Actions.
- NORA currently records creator-declared dependency and licence information. It does **not** yet perform a full dependency licence audit, security scan, or private-repository check.

### Acquisition flow

- Product-aware `/acquire` page linked from public records.
- Buyers review the product, delivery model, pricing context, and requested terms before sending a structured acquisition request.
- Requests are stored in Supabase, appear in the buyer workspace, and route to the owning creator’s inbox.
- The flow deliberately stops before payment: fit, final price, delivery, licence, and support can be confirmed before a transaction.
- Reviewer operations can manually grant or revoke a buyer entitlement after terms and off-platform payment are confirmed. An entitlement exposes only a short-lived private download URL in the buyer workspace.

### Trust and policy pages

- `/about` manifesto explaining NORA’s alternative to proposal-first freelance marketplaces.
- `/licensing` guide covering single-project, agency, and custom terms; no-resale rules; delivery boundaries; and dependency attribution.
- `/terms` contains the prototype marketplace terms structure.
- `/contact` prepares a focused email handoff for buyer, creator, licensing, and partnership enquiries.

## Route map

| Route | Purpose |
| --- | --- |
| `/` | Home, featured applications, recent releases, creator invitation |
| `/catalogue` | Searchable, filterable unified marketplace |
| `/products/*` | Curated product records |
| `/listing?id=<record-id>` | Generated public page for an approved creator release |
| `/submit` | Creator record builder and draft flow |
| `/acquire` | Product-aware acquisition request flow |
| `/join` | Buyer or creator entry choice |
| `/account` | Sign-in and shared account overview |
| `/account/buyer` | Saved records and acquisition requests |
| `/account/creator` | Creator records, release manager, inbox, and ownership controls |
| `/account/review` | Restricted review queue |
| `/about` | Marketplace manifesto |
| `/licensing` | Licensing and delivery guide |
| `/terms` | Marketplace terms framework |
| `/contact` | Contact handoff |
| `/api/verify` | Signed GitHub Actions verification-result endpoint |

## Technical stack

- Next.js App Router
- React and TypeScript
- Framer Motion
- Supabase Auth, Postgres, Row Level Security, and Storage
- GitHub REST API for public repository evidence
- Vercel for the production Next.js deployment
- Plain CSS design system with custom properties and responsive media queries

## Project structure

```text
app/
  account/                 # Buyer, creator, and review workspaces
  acquire/                 # Acquisition request route
  catalogue/               # Public catalogue
  join/                    # Buyer/creator entry choice
  listing/                 # Generated creator listing route
  products/                # Curated NORA records
  submit/                  # Creator listing builder
  about/ licensing/ terms/ contact/

components/
  account-auth.tsx         # Supabase magic-link flow and return routing
  catalogue-marketplace.tsx # Unified curated + published listing feed
  listing-builder.tsx      # Draft, media, pricing, and evidence entry
  buyer-readiness.tsx      # Buyer-facing operator/setup contract
  proof-experience.tsx     # Buyer-facing proof environment
  fulfilment-dashboard.tsx # Reviewer-controlled manual entitlements
  creator-dashboard.tsx    # Creator records, inbox, and deletion
  release-manager.tsx      # Creator release metadata
  review-dashboard.tsx     # Approve/request-changes workspace
  public-listing-page.tsx  # Data-driven generated product page
  acquisition-form.tsx     # Buyer acquisition request

lib/
  catalogue.ts              # Curated catalogue metadata
  github-evidence.ts        # Public repository checks
  listing-preflight.ts      # Submission-completeness rules
  proof-environment.ts     # Proof-type structural validation
  pricing.ts                # Price formatting
  supabase.ts               # Browser client

supabase/
  schema.sql                # Profiles and listing drafts
  acquisition-requests.sql  # Buyer request records
  creator-routing.sql       # Creator ownership/request routing
  review-workspace.sql      # Reviewer access
  review-feedback.sql       # Review feedback state
  public-listings.sql       # Publication/public-read support
  listing-pricing.sql       # Price and commercial context
  listing-media.sql         # Cover image + Storage bucket/policies
  listing-gallery.sql       # Gallery URLs
  release-metadata.sql      # Version and release declaration
  fulfilment.sql            # Private source bundles and buyer entitlements
  manual-fulfilment.sql     # Reviewer grant/revoke operations
  buyer-readiness.sql       # Operator and setup declarations
  proof-environments.sql    # Creator proof-environment declarations
  saved-products.sql        # Buyer shortlist
  delete-listing.sql        # Irreversible creator deletion function
  technical-evidence.sql    # Technical evidence fields
  nora-verify.sql           # Verification state and GitHub Actions output

templates/
  nora-verify.yml           # GitHub Actions verification starter
```

## Live deployment

The production application is deployed at [nora-marketplace.vercel.app](https://nora-marketplace.vercel.app) from the `main` branch of this repository.

Vercel needs these environment variables in **Production**:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
NORA_VERIFY_WEBHOOK_SECRET
```

`SUPABASE_SERVICE_ROLE_KEY` and `NORA_VERIFY_WEBHOOK_SECRET` are server-side secrets. They must never be committed, exposed through a `NEXT_PUBLIC_` variable, or pasted into documentation. A deployment must be redeployed after changing its environment variables.

Supabase Auth is configured with these redirect URLs:

```text
https://nora-marketplace.vercel.app/account
http://localhost:3000/account
```

For GitHub Actions reporting, set repository secrets in each creator repository:

```text
NORA_VERIFY_ENDPOINT=https://nora-marketplace.vercel.app/api/verify
NORA_VERIFY_WEBHOOK_SECRET=<same private secret configured in Vercel>
```

## Local development

### Prerequisites

- Node.js compatible with the installed Next.js version
- npm
- A Supabase project with the required migrations applied

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npx tsc --noEmit
npm run build
```

## Supabase setup

Apply the SQL files in `supabase/` in dependency order: start with `schema.sql`, then requests/routing/review/publication, followed by saved products, pricing, media, gallery, review feedback, and release metadata.

The latest creator-listing experience specifically needs:

- `listing-media.sql`
- `listing-gallery.sql`
- `review-feedback.sql`
- `release-metadata.sql`
- `fulfilment.sql`
- `manual-fulfilment.sql`
- `buyer-readiness.sql`
- `proof-environments.sql`
- `nora-verify.sql`

Create a local `.env.local` (it is ignored by Git) with the same four variables used by Vercel. Never commit service-role keys or webhook secrets.

## Current boundaries and next milestone

NORA is a working marketplace prototype, not a completed payment platform.

Not yet implemented:

- checkout, payment processing, creator payouts, invoices, tax handling, or refunds automation;
- payment-webhook-driven source-bundle fulfilment (private storage, buyer entitlements, and manual reviewer fulfilment already exist);
- automatic verification execution infrastructure: NORA can receive signed GitHub Actions results, but the creator must still install the workflow and repository secrets;
- Google/GitHub sign-in and GitHub OAuth for private repository checks;
- automated lockfile, security, dependency-version, or open-source licence scanning;
- in-app messaging, notifications, disputes, and a complete audit trail;
- legal review and enforceable marketplace agreements.

The intended next commercial milestone is **fixed-price checkout → explicit licence acceptance → automatic entitlement grant → protected source-bundle delivery**. Payment-provider onboarding is currently deferred while account verification documents are unavailable.

## Product principles

- **Outcome first:** sell what the software does, not vague availability.
- **Proof before promise:** show that the work exists before a buyer reaches out.
- **Clear boundaries:** make delivery, requirements, support, ownership, versioning, and exclusions legible.
- **No proposal theatre:** no bidding race for an undefined brief.
- **Reusable work deserves product treatment:** good software can earn more than once.

---

NORA is being shaped into a calmer, clearer way to discover and acquire independent software: **make the thing. sell the thing.**
