export interface TemplateDocumentImageProps {
  assetBaseUrl: string;
  className?: string;
}

/**
 * Jess Intelligence fork: the generic grey "document stack" illustration
 * (`/static/document.png`, alt "Documenso") is intentionally removed from all
 * emails. The headline + status badge carry the hero instead, which also keeps
 * image-blocked clients clean and removes the vendor name from screen readers.
 */
export const TemplateDocumentImage = (_props: TemplateDocumentImageProps) => {
  return null;
};

export default TemplateDocumentImage;
