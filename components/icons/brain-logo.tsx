import React from "react";

interface BrainLogoProps {
  className?: string;
}

/**
 * Taxomind Brain Logo
 * A simple, clean brain icon representing intelligence and learning
 */
export function BrainLogo({ className = "w-6 h-6" }: BrainLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Taxomind Brain Logo"
    >
      {/* Brain outline */}
      <path
        d="M12 2C10.5 2 9.2 2.6 8.3 3.5C7.4 2.6 6.1 2 4.6 2C2.1 2 0 4.1 0 6.6C0 7.8 0.4 8.9 1.1 9.8C0.4 10.7 0 11.8 0 13C0 15.5 2.1 17.6 4.6 17.6C5.2 17.6 5.8 17.5 6.3 17.3C7.2 19.9 9.4 22 12 22C14.6 22 16.8 19.9 17.7 17.3C18.2 17.5 18.8 17.6 19.4 17.6C21.9 17.6 24 15.5 24 13C24 11.8 23.6 10.7 22.9 9.8C23.6 8.9 24 7.8 24 6.6C24 4.1 21.9 2 19.4 2C17.9 2 16.6 2.6 15.7 3.5C14.8 2.6 13.5 2 12 2Z"
        fill="currentColor"
        opacity="0.2"
      />

      {/* Brain detail lines */}
      <path
        d="M8 8C8 8 9 9 10 9C11 9 12 8 12 8M12 8C12 8 13 9 14 9C15 9 16 8 16 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M8 12C8 12 9 13 10 13C11 13 12 12 12 12M12 12C12 12 13 13 14 13C15 13 16 12 16 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Center vertical line */}
      <path
        d="M12 6V16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
    </svg>
  );
}
