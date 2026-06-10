import { createHmac, timingSafeEqual } from 'node:crypto';

import { NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';
import { DOCUMENSO_ENCRYPTION_KEY } from '../../constants/crypto';

/**
 * Jess fork: HMAC-signed, expiring URLs for email-embedded assets (document
 * page-1 thumbnails and signature images).
 *
 * Emails can't carry session auth, and inline CID attachments proved
 * unreliable through the Resend API (the operator's Gmail showed the alt
 * text instead of the page-1 preview). These tokens make a plain `https`
 * <img> reference safe: the URL only works for the exact asset it was
 * minted for, and stops working after the expiry.
 *
 * Token format: `<expiresAtMs>.<hex hmac-sha256 over "purpose:assetId:expiresAtMs">`
 * keyed with NEXT_PRIVATE_ENCRYPTION_KEY.
 */

export type EmailAssetPurpose = 'document-thumbnail' | 'signature-image';

/** Thumbnails live as long as the signing links they sit next to (~3 months). */
export const EMAIL_THUMBNAIL_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 92;

/** Completion emails are kept around — give signature images a year. */
export const EMAIL_SIGNATURE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 366;

const signPayload = (payload: string): string | null => {
  if (!DOCUMENSO_ENCRYPTION_KEY) {
    return null;
  }

  return createHmac('sha256', DOCUMENSO_ENCRYPTION_KEY).update(payload).digest('hex');
};

export const createEmailAssetToken = ({
  purpose,
  assetId,
  ttlMs,
}: {
  purpose: EmailAssetPurpose;
  assetId: string;
  ttlMs: number;
}): string | null => {
  const expiresAt = Date.now() + ttlMs;

  const signature = signPayload(`${purpose}:${assetId}:${expiresAt}`);

  if (!signature) {
    return null;
  }

  return `${expiresAt}.${signature}`;
};

export const verifyEmailAssetToken = ({
  purpose,
  assetId,
  token,
}: {
  purpose: EmailAssetPurpose;
  assetId: string;
  token: string;
}): boolean => {
  const [expiresAtRaw, providedSignature] = token.split('.');

  const expiresAt = Number(expiresAtRaw);

  if (!expiresAtRaw || !providedSignature || Number.isNaN(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const expectedSignature = signPayload(`${purpose}:${assetId}:${expiresAt}`);

  if (!expectedSignature) {
    return false;
  }

  const expected = Buffer.from(expectedSignature, 'utf8');
  const provided = Buffer.from(providedSignature, 'utf8');

  return expected.length === provided.length && timingSafeEqual(expected, provided);
};

/** Absolute, signed URL for an email asset route. Returns null without a server key. */
export const createEmailAssetUrl = ({
  path,
  purpose,
  assetId,
  ttlMs,
}: {
  path: string;
  purpose: EmailAssetPurpose;
  assetId: string;
  ttlMs: number;
}): string | null => {
  const token = createEmailAssetToken({ purpose, assetId, ttlMs });

  if (!token) {
    return null;
  }

  const baseUrl = NEXT_PUBLIC_WEBAPP_URL() || 'http://localhost:3000';

  return `${baseUrl}${path}?token=${token}`;
};
