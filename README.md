# NORA

**NORA — Network of Reusable Applications** is an outcome-first marketplace for finished software.

Instead of asking buyers to gamble on proposals and creators to compete for attention, NORA presents completed applications, tools, runtimes, and scoped integrations as clear product records. Buyers can inspect what a product does, test its proof environment, understand setup and delivery, and see its commercial terms before starting a conversation or acquiring it.

> **Sell the work. Skip the pitch.**

## What NORA is solving

Freelance marketplaces often force a buyer to evaluate a person before they can evaluate a solution. They reward pitching, profile polish, and availability even when the relevant software already exists.

NORA treats useful software as inventory. A listing is not a vague promise of future labour: it is a structured record of an outcome, proof, delivery path, technical boundary, and price or commercial terms.

Creators can offer:

- live products people can explore;
- deployable applications and source releases;
- reusable runtimes and developer tools; and
- fixed, scoped integrations or setup work.

## What is live

NORA is deployed at [nora-marketplace.vercel.app](https://nora-marketplace.vercel.app).

The working product includes a searchable catalogue, passwordless accounts, creator records and releases, buyer acquisition requests, an operator workspace, protected source-bundle delivery, and GitHub Actions build verification for linked public repositories.

NORA’s current verification loop is deliberately conservative: a repository-backed listing needs a current successful NORA Verify result before it can enter operations review, and an operator still makes the final publication decision.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app needs Supabase configuration in `.env.local`. Do not commit keys or webhook secrets.

## Project documentation

Detailed architecture, routes, Supabase migrations, Vercel configuration, GitHub verification setup, current boundaries, and operational notes live in [NORA PROJECT NOTES.txt](./NORA%20PROJECT%20NOTES.txt).

## Principles

- **Outcome first:** evaluate what the software achieves.
- **Proof before promise:** let buyers inspect or test it before committing.
- **Clear boundaries:** make delivery, setup, versioning, ownership, and support legible.
- **No proposal theatre:** reduce bidding for an undefined future brief.
- **Reusable work deserves product treatment:** good software should be able to earn more than once.

NORA is a working marketplace foundation, not yet a payment or payout platform. Paystack checkout, automated fulfilment, and payout operations are the next commercial layer once payment-provider onboarding is complete.
