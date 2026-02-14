export function MathPattern() {
  return (
    <div className="absolute inset-0 opacity-10 pointer-events-none">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="math-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <line x1="0" y1="30" x2="60" y2="30" stroke="white" strokeWidth="0.5" opacity="0.3" />
            <line x1="30" y1="0" x2="30" y2="60" stroke="white" strokeWidth="0.5" opacity="0.3" />
            <text x="10" y="20" fill="white" fontSize="12" opacity="0.2">+</text>
            <text x="45" y="50" fill="white" fontSize="12" opacity="0.2">=</text>
            <text x="10" y="50" fill="white" fontSize="10" opacity="0.15">&#x03C0;</text>
            <text x="45" y="20" fill="white" fontSize="10" opacity="0.15">&#x221E;</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#math-grid)" />
      </svg>
    </div>
  );
}
