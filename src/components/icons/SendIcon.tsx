import React from 'react';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SendIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg
    className={className}
    style={style}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);
