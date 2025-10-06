import React from 'react';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ChatBubbleIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg
    className={className}
    style={style}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);
