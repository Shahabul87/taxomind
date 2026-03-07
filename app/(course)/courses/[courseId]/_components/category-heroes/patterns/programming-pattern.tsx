export function ProgrammingPattern() {
  return (
    <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.03) 2px,
            rgba(255,255,255,0.03) 4px
          )`,
        }}
      />
    </div>
  );
}
