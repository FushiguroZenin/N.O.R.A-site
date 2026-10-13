# NORA commercial-launch legal review checklist

This is a briefing checklist for qualified legal counsel, not legal advice or an approval to launch paid transactions.

## Marketplace model

- Confirm NORA's role: marketplace operator, payment facilitator, licence intermediary, or seller of record.
- Review whether creators are independent sellers and how their tax, identity, and payout obligations are handled.
- Review platform fees, payout timing, reserves, chargebacks, refunds, and disputes once Paystack is connected.

## Software rights and licences

- Review the marketplace Terms, creator licence options, buyer restrictions, and ownership language.
- Define a practical process for copyright, copied-code, trademark, and open-source licence complaints.
- Confirm how NORA should handle GPL/AGPL and other dependency licence conflicts.

## Consumer, privacy, and data law

- Review refund and digital-goods rules for the countries NORA will serve.
- Review the Privacy notice, data retention, account-deletion process, and cross-border processing through Supabase, Vercel, GitHub, Resend, and Paystack.
- Confirm the lawful basis and sender-consent rules for transactional and marketing email separately.

## Operational policies

- Approve the support/escalation process, prohibited-content policy, suspension criteria, and record-preservation requirements.
- Define response expectations for security reports, creator/buyer disputes, and requests from authorities.
- Ensure customer-facing contact information and business identity requirements are met for the launch jurisdiction.

## Inputs to give counsel

- `app/terms/page.tsx`
- `app/privacy/page.tsx`
- `LICENSE.md`
- `NORA PROJECT NOTES.txt`
- A walkthrough of creator submission, buyer acquisition, operator fulfilment, and support-report flows.
