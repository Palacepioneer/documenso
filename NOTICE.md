# NOTICE — Jess Intelligence email-template fork of Documenso

This branch (`jess-email`) is a modified version of [Documenso](https://github.com/documenso/documenso),
forked from the upstream tag **v2.11.0**.

## What was modified
- `packages/email/**` — email visual design and copy: Jess Intelligence design
  system (gold `#C2933B` / cream `#F4EFE7` / navy `#15243B`, WCAG-AA checked),
  shared card shell with image-blocked and dark-mode fallbacks, removal of the
  stock document illustration, text-only status badges, and rewritten lifecycle
  template copy (invite, reminder, completed, recipient-signed, rejected,
  rejection-confirmed, pending, cancel).
- `packages/lib/**` (email handlers only) — hardcoded email subjects and
  fallback strings rewritten; `meta.subject` is now honored for all
  document-completed emails; the recipient-signed notification carries a
  document link.
- jessmail.2 increment: page-1 document thumbnail embedded in signing
  request/reminder emails (new `emailDocumentThumbnail` email setting, default
  on; disabled whenever recipient access authentication is required), a
  "signed by" signature block plus a 7MB attachment guard on the completed
  email, cache-busting `?v=<hash>` on branding logo URLs, and a local Resend
  transport that supports inline `cid` images and `replyTo`.
- jessmail.3 increment: all structural email copy rewritten to first person
  (the sender speaks as "I") with sentence capitalization; header logo
  rendered at 3rem; document thumbnails and signature images switched from
  inline CID attachments to HMAC-signed expiring `https` URLs served by two
  new routes (`apps/remix/app/routes/api+/email.thumbnail.$envelopeId.ts`,
  `apps/remix/app/routes/api+/email.signature.$signatureId.ts`, helper in
  `packages/lib/server-only/email/email-asset-token.ts`) — inline CID images
  were not rendered by Gmail when sent through the Resend API.
- jessmail.4 increment: stock lime theme replaced with Jess gold/navy at the
  root (`packages/ui/styles/theme.css`, `packages/tailwind-config/index.cjs`,
  `packages/lib/constants/theme.ts`); Jess mark on all recipient/embed
  surfaces; dark mode disabled on recipient routes; completion page rewritten
  (share widget and signup pitch removed); Jess signature block on all
  lifecycle emails; header logo at 6rem.
- jessmail.5 increment: canonical brand palette re-sampled from the
  operator-approved 2026-06-10 logo — navy `#1A2844`, gold `#B39139` replace
  the interim `#15243B`/`#C2933B` everywhere (theme.css, tailwind `documenso`
  ramp, email tokens, signature ink); new logo + favicon set (script "J." mark)
  shipped in `apps/remix/public`; sign-in page shows the Jess mark; completion
  page download CTA promoted to the primary action ("Download signed copy");
  "Share Signing Card" dropdown items removed; last off-palette email colors
  (lime `#7AC455` text, lime `completed.png`, blue `clock.png`) recolored.
- jessmail.6–.7 increments: final branding/signature polish — email design
  system tokens, thumbnail routes, and the Jess signature phone line
  (727) 621-6757 (the three commits ending at `c23c069e`).
- No changes to signing logic, storage, auth, or any other subsystem.

## License & source offer (AGPL-3.0 §13)
Documenso is licensed under the GNU Affero General Public License v3.0
(see `LICENSE`). This modified source is published to satisfy AGPL §13: it
corresponds to the container image `documenso-jess:v2.11.0-jessmail.7`
(built from commit `c23c069e` of this branch)
which serves users at https://sign.jessintelligence.com.

Upstream project: https://github.com/documenso/documenso
Upstream base: tag `v2.11.0`
