interface Props {
  color: string;
  size?: number;
}

/**
 * A flat, illustrated product mark rather than a photo — keeps the app fully
 * self-contained (no external image hosting/CDN dependency) while still
 * giving each variant a distinct, recognizable visual identity via color.
 */
export function ProductIllustration({ color, size = 84 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      style={{ transition: 'color 160ms ease' }}
    >
      <path
        d="M34 34 C34 22 40 16 48 16 C56 16 62 22 62 34"
        stroke={color}
        strokeOpacity="0.5"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 34 H72 L67 78 C66.4 82.5 62.6 86 58 86 H38 C33.4 86 29.6 82.5 29 78 Z"
        fill={color}
      />
      <line x1="24" y1="46" x2="72" y2="46" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
    </svg>
  );
}
