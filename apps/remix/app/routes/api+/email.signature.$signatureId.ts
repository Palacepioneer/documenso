import { verifyEmailAssetToken } from '@documenso/lib/server-only/email/email-asset-token';
import { prisma } from '@documenso/prisma';

import type { Route } from './+types/email.signature.$signatureId';

/**
 * Jess fork: serves a signed recipient's drawn signature image for the
 * completion-email "signed by" block.
 *
 * Auth is an HMAC-signed expiring token minted at send time (emails cannot
 * carry sessions) — see `email-asset-token.ts`. CID inline attachments were
 * dropped between Resend and Gmail, so signature images are referenced as
 * plain `https` URLs instead.
 */

const CACHE_CONTROL = 'private, max-age=86400';

export async function loader({ params, request }: Route.LoaderArgs) {
  const signatureId = Number(params.signatureId);

  const token = new URL(request.url).searchParams.get('token') ?? '';

  if (
    !Number.isInteger(signatureId) ||
    signatureId <= 0 ||
    !verifyEmailAssetToken({
      purpose: 'signature-image',
      assetId: String(signatureId),
      token,
    })
  ) {
    return Response.json({ status: 'error', message: 'Not found' }, { status: 404 });
  }

  const signature = await prisma.signature.findUnique({
    where: {
      id: signatureId,
    },
    select: {
      signatureImageAsBase64: true,
    },
  });

  const match = signature?.signatureImageAsBase64?.match(/^data:(image\/[a-z+.-]+);base64,(.*)$/i);

  if (!match) {
    return Response.json({ status: 'error', message: 'Not found' }, { status: 404 });
  }

  const content = Buffer.from(match[2], 'base64');

  return new Response(new Uint8Array(content), {
    headers: {
      'Content-Type': match[1],
      'Content-Length': content.length.toString(),
      'Cache-Control': CACHE_CONTROL,
    },
  });
}
