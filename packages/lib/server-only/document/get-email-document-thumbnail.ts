import type { DocumentMeta, Envelope, Recipient } from '@prisma/client';

import { extractDerivedDocumentEmailSettings } from '../../types/document-email';
import { getFileServerSide } from '../../universal/upload/get-file.server';
import { extractDocumentAuthMethods } from '../../utils/document-auth';
import { pdfFirstPageToPng } from '../ai/pdf-to-images';

/**
 * Jess fork: page-1 document preview embedded in signing request and
 * reminder emails as an inline CID image.
 */

export const EMAIL_DOCUMENT_THUMBNAIL_CID = 'jess-document-preview';

/** Display width inside the email (the PNG is rendered at 2x for retina). */
const THUMBNAIL_TARGET_WIDTH = 600;
const THUMBNAIL_FALLBACK_WIDTH = 300;

/** Never inline more than this into an email. */
const MAX_THUMBNAIL_BYTES = 100 * 1024;

type ThumbnailEnvelope = Pick<Envelope, 'authOptions'> & {
  documentMeta?: DocumentMeta | null;
  envelopeItems: Array<{
    order: number;
    documentData: Parameters<typeof getFileServerSide>[0];
  }>;
};

/**
 * Renders page 1 of the envelope's first document to a PNG buffer for use as
 * an email hero image.
 *
 * Returns `null` (and never throws — a missing preview must not block an
 * email send) when:
 * - the `emailDocumentThumbnail` email setting is off,
 * - the envelope requires global access authentication (sensitive documents
 *   must not leak page 1 into inboxes),
 * - the rendered PNG exceeds the inline size budget even at fallback width.
 */
export const getEmailDocumentThumbnail = async ({
  envelope,
}: {
  envelope: ThumbnailEnvelope;
}): Promise<Buffer | null> => {
  try {
    const emailSettings = extractDerivedDocumentEmailSettings(envelope.documentMeta);

    if (!emailSettings.emailDocumentThumbnail) {
      return null;
    }

    const { documentAuthOption } = extractDocumentAuthMethods({
      documentAuth: envelope.authOptions,
    });

    if (documentAuthOption.globalAccessAuth.length > 0) {
      return null;
    }

    const firstItem = [...envelope.envelopeItems].sort((a, b) => a.order - b.order)[0];

    if (!firstItem) {
      return null;
    }

    const file = await getFileServerSide(firstItem.documentData);
    const pdfBytes = new Uint8Array(file);

    let { image } = await pdfFirstPageToPng(pdfBytes, { targetWidth: THUMBNAIL_TARGET_WIDTH });

    if (image.length > MAX_THUMBNAIL_BYTES) {
      ({ image } = await pdfFirstPageToPng(pdfBytes, { targetWidth: THUMBNAIL_FALLBACK_WIDTH }));
    }

    if (image.length > MAX_THUMBNAIL_BYTES) {
      return null;
    }

    return image;
  } catch (err) {
    console.error('[email-document-thumbnail] generation failed, sending without preview', err);

    return null;
  }
};

/**
 * Recipient-level gate: when the derived access auth for this recipient is
 * non-empty (their own auth options or the envelope's global ones), the
 * document content must not be previewed in their inbox.
 */
export const isEmailThumbnailAllowedForRecipient = ({
  envelope,
  recipient,
}: {
  envelope: Pick<Envelope, 'authOptions'>;
  recipient: Pick<Recipient, 'authOptions'>;
}): boolean => {
  const { recipientAccessAuthRequired } = extractDocumentAuthMethods({
    documentAuth: envelope.authOptions,
    recipientAuth: recipient.authOptions,
  });

  return !recipientAccessAuthRequired;
};

/** Standard inline attachment payload for the thumbnail. */
export const emailDocumentThumbnailAttachment = (thumbnail: Buffer) => ({
  filename: 'document-preview.png',
  content: thumbnail,
  contentType: 'image/png',
  cid: EMAIL_DOCUMENT_THUMBNAIL_CID,
  contentDisposition: 'inline' as const,
});
