import { type SentMessageInfo, type Transport } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type MailMessage from 'nodemailer/lib/mailer/mail-message';
import { Resend } from 'resend';

/**
 * Jess fork: local copy of @documenso/nodemailer-resend's transport with two
 * fixes the upstream package drops on the floor:
 *
 * 1. `cid` is mapped to Resend's `contentId` so inline images (document
 *    page-1 thumbnails, signature blocks) render via `cid:` references
 *    instead of appearing as loose attachments with broken <img> tags.
 * 2. `replyTo` is forwarded (upstream silently discarded it, breaking the
 *    reply-to-jess@ flow on Resend sends).
 */
export const RESEND_ERROR_CODES_BY_KEY: Record<string, number> = {
  missing_required_field: 422,
  invalid_access: 422,
  invalid_parameter: 422,
  invalid_region: 422,
  rate_limit_exceeded: 429,
  missing_api_key: 401,
  invalid_api_Key: 403,
  invalid_from_address: 403,
  validation_error: 403,
  not_found: 404,
  method_not_allowed: 405,
  application_error: 500,
  internal_server_error: 500,
};

export type ResendTransportOptions = {
  apiKey: string;
};

export class ResendTransport implements Transport<SentMessageInfo> {
  public name = 'JessResendMailTransport';
  public version = '1.0.0';

  private _client: Resend;

  public static makeTransport(options: Partial<ResendTransportOptions>) {
    return new ResendTransport(options);
  }

  constructor(options: Partial<ResendTransportOptions>) {
    const { apiKey = '' } = options;

    this._client = new Resend(apiKey);
  }

  public send(mail: MailMessage, callback: (_err: Error | null, _info: SentMessageInfo) => void) {
    if (!mail.data.to || !mail.data.from) {
      return callback(new Error('Missing required fields "to" or "from"'), null);
    }

    this._client.emails
      .send({
        subject: mail.data.subject ?? '',
        from: this.toResendFromAddress(mail.data.from),
        to: this.toResendAddresses(mail.data.to),
        cc: this.toResendAddresses(mail.data.cc),
        bcc: this.toResendAddresses(mail.data.bcc),
        replyTo: mail.data.replyTo ? this.toResendAddresses(mail.data.replyTo) : undefined,
        html: mail.data.html?.toString() || '',
        text: mail.data.text?.toString() || '',
        attachments: this.toResendAttachments(mail.data.attachments),
      })
      .then((response) => {
        if (response.error) {
          const statusCode = RESEND_ERROR_CODES_BY_KEY[response.error.name] ?? 500;

          throw new Error(`[${statusCode}]: ${response.error.name} ${response.error.message}`);
        }

        callback(null, response.data);
      })
      .catch((error) => {
        callback(error, null);
      });
  }

  public toResendAddresses(addresses: Mail.Options['to']) {
    if (!addresses) {
      return [];
    }

    if (typeof addresses === 'string') {
      return [addresses];
    }

    if (Array.isArray(addresses)) {
      return addresses.map((address) => {
        if (typeof address === 'string') {
          return address;
        }

        return address.address;
      });
    }

    return [addresses.address];
  }

  public toResendFromAddress(address: Mail.Options['from']): string {
    if (!address) {
      return '';
    }

    if (typeof address === 'string') {
      return address;
    }

    if (Array.isArray(address)) {
      return this.toResendFromAddress(address[0]);
    }

    return `${address.name} <${address.address}>`;
  }

  public toResendAttachments(attachments: Mail.Options['attachments']) {
    if (!attachments) {
      return [];
    }

    return attachments.map((attachment) => {
      if (!attachment.filename || !attachment.content) {
        throw new Error('Attachment is missing filename or content');
      }

      if (typeof attachment.filename !== 'string') {
        throw new Error('Attachment filename must be a string');
      }

      let content: Buffer;

      if (typeof attachment.content === 'string') {
        content = Buffer.from(attachment.content);
      } else if (attachment.content instanceof Buffer) {
        content = attachment.content;
      } else {
        throw new Error('Attachment content must be a string or a buffer');
      }

      return {
        filename: attachment.filename,
        content,
        contentType: attachment.contentType,
        // Inline images: nodemailer `cid` -> Resend `contentId` so `cid:`
        // references in the HTML resolve.
        contentId: attachment.cid,
      };
    });
  }
}
