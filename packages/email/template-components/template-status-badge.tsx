import { Column, Row, Section, Text } from '../components';
import { JESS_COLORS } from '../jess-brand';

export type StatusBadgeTone = 'gold' | 'navy' | 'terracotta' | 'muted';

export interface TemplateStatusBadgeProps {
  label: string;
  tone?: StatusBadgeTone;
  className?: string;
}

const TONE_COLOR: Record<StatusBadgeTone, string> = {
  gold: JESS_COLORS.goldDark,
  navy: JESS_COLORS.navy,
  terracotta: JESS_COLORS.terracotta,
  muted: JESS_COLORS.muted,
};

/**
 * Text-only status pill. No images, so it stays legible with images blocked
 * and never leaks vendor artwork. All tone colors are AA on cream (#F4EFE7).
 */
export const TemplateStatusBadge = ({ label, tone = 'gold', className }: TemplateStatusBadgeProps) => {
  const color = TONE_COLOR[tone];

  return (
    <Section className={className}>
      <Row>
        <Column align="center">
          <Text
            className="my-0 inline-block rounded-full border border-solid bg-white/60 px-4 py-1 text-center font-semibold text-xs tracking-[0.12em]"
            style={{ color, borderColor: color, textTransform: 'uppercase' }}
          >
            {label}
          </Text>
        </Column>
      </Row>
    </Section>
  );
};

export default TemplateStatusBadge;
