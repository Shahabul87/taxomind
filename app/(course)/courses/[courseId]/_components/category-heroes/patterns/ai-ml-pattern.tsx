export function AIMLPattern() {
  return (
    <div className="absolute inset-0 opacity-10 pointer-events-none">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="neural-net" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="2" fill="white" opacity="0.3" />
            <circle cx="25" cy="25" r="2" fill="white" opacity="0.3" />
            <circle cx="75" cy="75" r="2" fill="white" opacity="0.3" />
            <line x1="50" y1="50" x2="25" y2="25" stroke="white" strokeWidth="0.5" opacity="0.2" />
            <line x1="50" y1="50" x2="75" y2="75" stroke="white" strokeWidth="0.5" opacity="0.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#neural-net)" />
      </svg>
    </div>
  );
}
