import React from 'react';

import { JESS_COLORS } from '../jess-brand';

export type TemplateCustomMessageBodyProps = {
  text?: string;
};

/**
 * The sender's note (meta.message). In the Jess fork this renders IN-CARD as
 * the hero body — navy ink at full size, not below-card fine print.
 */
export const TemplateCustomMessageBody = ({ text }: TemplateCustomMessageBodyProps) => {
  if (!text) {
    return null;
  }

  const normalized = text
    .trim()
    .replace(/\r\n?/g, '\n')
    .replace(/\n\s*\n+/g, '\n\n')
    .replace(/\n{2,}/g, '\n\n');

  const paragraphs = normalized.split('\n\n');

  return paragraphs.map((paragraph, i) => (
    <p
      key={`p-${i}`}
      className="my-2 whitespace-pre-line break-words text-left font-sans text-base leading-relaxed"
      style={{ color: JESS_COLORS.navy }}
    >
      {paragraph.split('\n').map((line, j) => (
        <React.Fragment key={`line-${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </p>
  ));
};

export default TemplateCustomMessageBody;
