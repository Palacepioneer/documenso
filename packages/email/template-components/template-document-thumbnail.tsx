import { Img, Link, Section } from '../components';

export interface TemplateDocumentThumbnailProps {
  /** Image source — `cid:` reference in real sends, data URI in previews. */
  src: string;
  /** Accessible name, usually the document display name. */
  alt: string;
  /** Where clicking the preview takes the recipient (the signing link). */
  href: string;
}

/**
 * Page-1 preview of the actual document, framed like a sheet of paper
 * resting on the cream card. The PNG is rendered server-side at 2x and
 * displayed at 300px wide; the whole sheet links to the signing flow.
 */
export const TemplateDocumentThumbnail = ({ src, alt, href }: TemplateDocumentThumbnailProps) => {
  return (
    <Section className="mt-6 text-center">
      <Link href={href}>
        <Img
          src={src}
          alt={alt}
          width={300}
          className="mx-auto"
          style={{
            width: '300px',
            maxWidth: '85%',
            border: '1px solid #E5E0D5',
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
          }}
        />
      </Link>
    </Section>
  );
};

export default TemplateDocumentThumbnail;
