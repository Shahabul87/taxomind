"use client";

export function HeaderBackground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_2px,_rgba(255,255,255,0.1)_2px)] opacity-20" />
    </div>
  );
} 