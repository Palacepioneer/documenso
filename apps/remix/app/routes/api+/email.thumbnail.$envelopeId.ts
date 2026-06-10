import {
  isEmailThumbnailAllowedForEnvelope,
  renderEmailDocumentThumbnail,
} from '@documenso/lib/server-only/document/get-email-document-thumbnail';
import { verifyEmailAssetToken } from '@documenso/lib/server-only/email/email-asset-token';
import { prisma } from '@documenso/prisma';

import type { Route } from './+types/email.thumbnail.$envelopeId';

/**
 * Jess fork: serves the page-1 document preview referenced by signing-request
 * and reminder emails.
 *
 * Auth is an HMAC-signed expiring token minted at send time (emails cannot
 * carry sessions) — see `email-asset-token.ts`. The route additionally
 * re-checks the same thumbnail gates that were applied at send time, so a
 * leaked URL stops working if the document is later locked down.
 */

const CACHE_CONTROL = 'private, max-age=86400';

export async function loader({ params, request }: Route.LoaderArgs) {
  const envelopeId = params.envelopeId;

  const token = new URL(request.url).searchParams.get('token') ?? '';

  if (
    !envelopeId ||
    !verifyEmailAssetToken({ purpose: 'document-thumbnail', assetId: envelopeId, token })
  ) {
    return Response.json({ status: 'error', message: 'Not found' }, { status: 404 });
  }

  const envelope = await prisma.envelope.findUnique({
    where: {
      id: envelopeId,
    },
    include: {
      documentMeta: true,
      envelopeItems: {
        include: {
          documentData: true,
        },
      },
    },
  });

  if (!envelope || !isEmailThumbnailAllowedForEnvelope(envelope)) {
    return Response.json({ status: 'error', message: 'Not found' }, { status: 404 });
  }

  const thumbnail = await renderEmailDocumentThumbnail({ envelope }).catch((err) => {
    console.error('[email-thumbnail-route] render failed', err);

    return null;
  });

  if (!thumbnail) {
    return Response.json({ status: 'error', message: 'Not found' }, { status: 404 });
  }

  return new Response(new Uint8Array(thumbnail), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': thumbnail.length.toString(),
      'Cache-Control': CACHE_CONTROL,
    },
  });
}
