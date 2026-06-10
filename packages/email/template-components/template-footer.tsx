export type TemplateFooterProps = {
  isDocument?: boolean;
};

/**
 * Intentionally renders nothing.
 *
 * Operator ruling 2026-06-10: Jess lifecycle emails END just below Jess's
 * photo+signature card. The stock footer (a "sent using Documenso" line plus
 * a plain-text duplicate of the company details already shown in the
 * signature card) must never render after it — in any template.
 *
 * The component is kept (rather than deleted) so the many templates that
 * still mount `<TemplateFooter />` individually keep compiling and stay
 * trivially diffable against upstream.
 */
export const TemplateFooter = (_props: TemplateFooterProps) => {
  return null;
};

export default TemplateFooter;
