import React from 'react';

/** The brand mark: two people-coloured circles whose overlap is the "both". */
export const OverlapMark: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <span
    className={`relative inline-block shrink-0 ${className}`}
    style={{ width: size * 1.6, height: size }}
    aria-hidden="true"
  >
    <span className="absolute left-0 top-0 rounded-full bg-you" style={{ width: size, height: size }} />
    <span className="absolute right-0 top-0 rounded-full bg-ai overflow-hidden" style={{ width: size, height: size }}>
      <span className="absolute top-0 rounded-full bg-both" style={{ width: size, height: size, left: -size * 0.6 }} />
    </span>
  </span>
);
