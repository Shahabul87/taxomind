export function DefaultPattern() {
  return (
    <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(30deg, transparent 48%, rgba(255,255,255,0.1) 49%, rgba(255,255,255,0.1) 51%, transparent 52%)`,
          backgroundSize: '20px 20px',
        }}
      />
    </div>
  );
}
