import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '../lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-md text-xs font-medium ring-1 ring-inset w-fit', {
  variants: {
    variant: {
      neutral: 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20',
      destructive: 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20',
      warning:
        'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20',
      default:
        'bg-documenso-100 text-documenso-800 ring-documenso-500/30 dark:bg-documenso-500/10 dark:text-documenso-300 dark:ring-documenso-400/30',
      secondary:
        'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30',
      orange:
        'bg-orange-50 text-orange-700 ring-orange-700/10 dark:bg-orange-400/10 dark:text-orange-400 dark:ring-orange-400/30',
    },
    size: {
      small: 'px-1.5 py-0.5 text-xs',
      default: 'px-2 py-1.5 text-xs',
      large: 'px-3 py-2 text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div role="status" className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
