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
- No changes to signing logic, storage, auth, or any other subsystem.

## License & source offer (AGPL-3.0 §13)
Documenso is licensed under the GNU Affero General Public License v3.0
(see `LICENSE`). This modified source is published to satisfy AGPL §13: it
corresponds to the container image `documenso-jess:v2.11.0-jessmail.1`
which, once deployed, serves users at https://sign.jessintelligence.com.

Upstream project: https://github.com/documenso/documenso
Upstream base: tag `v2.11.0`
