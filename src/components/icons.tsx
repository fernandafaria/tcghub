import type React from "react";

type IconProps = {
  className?: string;
};

function Svg({
  children,
  className,
  strokeWidth = 1.6,
}: {
  children: React.ReactNode;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      className={`ic ${className ?? ""}`}
      viewBox="0 0 17 17"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="7.5" cy="7.5" r="5" />
      <path d="m14 14-2.3-2.3" />
    </Svg>
  );
}

export function IconCart({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="6" cy="14.5" r="1" />
      <circle cx="12.5" cy="14.5" r="1" />
      <path d="M1.5 2h1.6l1.4 9a1.1 1.1 0 0 0 1.1 1h6.3a1.1 1.1 0 0 0 1.1-.9L14 5H4" />
    </Svg>
  );
}

export function IconSpark({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.5}>
      <path d="M8.5 2v3M8.5 12v3M2 8.5h3M12 8.5h3M4.2 4.2l1.8 1.8M11 11l1.8 1.8M12.8 4.2 11 6M6 11l-1.8 1.8" />
    </Svg>
  );
}

export function IconBell({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 6.5a4.5 4.5 0 0 1 9 0c0 3.5 1.5 4.5 1.5 4.5H2.5s1.5-1 1.5-4.5" />
      <path d="M7 14.5a1.5 1.5 0 0 0 3 0" />
    </Svg>
  );
}

export function IconChart({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M2.5 13.5V3.5M2.5 13.5h12" />
      <path d="M5 11l2.5-3 2 1.6L14 4.5" />
    </Svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M8.5 2 3.5 4v4c0 3 2 5.5 5 6.5 3-1 5-3.5 5-6.5V4Z" />
      <path d="m6.5 8.5 1.5 1.5 2.5-2.7" />
    </Svg>
  );
}

export function IconBack({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M13.5 8.5H3.5M7.5 4.5 3.5 8.5l4 4" />
    </Svg>
  );
}

export function IconArrow({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3.5 8.5h10M9.5 4.5l4 4-4 4" />
    </Svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={2}>
      <path d="M3.5 8.5 7 12l6.5-7" />
    </Svg>
  );
}

export function IconUp({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={2}>
      <path d="M5 10 8.5 6.5l3.5 3.5" />
    </Svg>
  );
}

export function IconDown({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={2}>
      <path d="M5 7.5 8.5 11l3.5-3.5" />
    </Svg>
  );
}

export function IconStore({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M2.5 6.5 3.4 2.5h10.2l1.1 4" />
      <path d="M2.5 6.5a2.2 2.2 0 0 0 4.5 0 2.2 2.2 0 0 0 4.5 0 2.2 2.2 0 0 0 3 0" />
      <path d="M3.5 7.5v7h10v-7" />
      <path d="M6.5 14.5v-3.5h4v3.5" />
    </Svg>
  );
}

export function IconTag({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M2 8.5V3.5a1.5 1.5 0 0 1 1.5-1.5h5l6.5 6.5-6.5 6.5Z" />
      <circle cx="5.5" cy="5.5" r="1" />
    </Svg>
  );
}

export function IconLayers({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m8.5 2 6.5 3.5-6.5 3.5L2 5.5Z" />
      <path d="m2 9.5 6.5 3.5 6.5-3.5" />
    </Svg>
  );
}

export function IconCards({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2" y="3" width="9" height="12" rx="1.5" />
      <path d="M11 5.5 13.3 6.3a1.5 1.5 0 0 1 .9 1.9L11.8 14" />
    </Svg>
  );
}

export function IconGrid({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="10" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="10" width="5" height="5" rx="1" />
      <rect x="10" y="10" width="5" height="5" rx="1" />
    </Svg>
  );
}

export function IconStar({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m8.5 2 1.9 4.1 4.5.5-3.3 3 1 4.4-4.1-2.4-4.1 2.4 1-4.4-3.3-3 4.5-.5Z" />
    </Svg>
  );
}

export function IconSun({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="8.5" cy="8.5" r="3" />
      <path d="M8.5 1.5v1.5M8.5 14v1.5M1.5 8.5H3M14 8.5h1.5M3.5 3.5l1 1M12.5 12.5l1 1M13.5 3.5l-1 1M4.5 12.5l-1 1" />
    </Svg>
  );
}

export function IconMoon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14 10.5A6 6 0 1 1 6.5 3a5 5 0 0 0 7.5 7.5Z" />
    </Svg>
  );
}

export function IconBrain({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 3a2.2 2.2 0 0 0-2.2 2.2 2.2 2.2 0 0 0-.8 4.3v2a2.2 2.2 0 0 0 3 2.1" />
      <path d="M11 3a2.2 2.2 0 0 1 2.2 2.2 2.2 2.2 0 0 1 .8 4.3v2a2.2 2.2 0 0 1-3 2.1" />
      <path d="M8.5 3v11" />
    </Svg>
  );
}

export function IconPkg({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14.5 6 8.5 2 2.5 6v5l6 4 6-4Z" />
      <path d="m2.5 6 6 4 6-4M8.5 10v5" />
    </Svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="6" cy="5.5" r="2.3" />
      <path d="M2 14a4 4 0 0 1 8 0" />
      <path d="M11 3.7a2.3 2.3 0 0 1 0 4.2M12 14a4 4 0 0 0-1.5-3.2" />
    </Svg>
  );
}

export function IconHeart({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M8.5 14.5S3.4 11.3 1.8 8.3C.5 6 1.8 3.5 4.2 3.5c1.5 0 2.3.9 2.8 1.8.5-.9 1.3-1.8 2.8-1.8 2.4 0 3.7 2.5 2.4 4.8-1.6 3-6.7 6.2-6.7 6.2Z" />
    </Svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={2}>
      <path d="M8.5 3.5v10M3.5 8.5h10" />
    </Svg>
  );
}

export function IconMinus({ className }: IconProps) {
  return (
    <Svg className={className} strokeWidth={2}>
      <path d="M3.5 8.5h10" />
    </Svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 4.5h11" />
      <path d="M5.5 4.5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5" />
      <path d="M6.5 7v6.5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V7" />
    </Svg>
  );
}
