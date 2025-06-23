import React from 'react';
import { cn } from '../../lib/utils';

interface HumbleIconProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export function HumbleIcon({
  name,
  className,
  size = 'md',
  style
}: HumbleIconProps) {
  return (
    <svg
      className={cn('humbleicons inline-block', sizeClasses[size], className)}
      style={style}
      aria-hidden="true"
    >
      <use xlinkHref={`/humbleicons.svg#${name}`} />
    </svg>
  );
}

// Alternative component for direct SVG embedding (useful for custom styling)
interface HumbleIconInlineProps {
  name: string;
  className?: string;
  children?: React.ReactNode;
}

export function HumbleIconInline({ name, className, children }: HumbleIconInlineProps) {
  // Note: This would require importing individual SVG files
  // For now, we'll just use the sprite version
  return (
    <HumbleIcon name={name} className={className} />
  );
}
