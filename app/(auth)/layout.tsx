export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 w-full h-full overflow-auto">
      {/* Light mode: soft off‑white gradient with subtle accent glows */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f7f8fb] via-[#f4f6f9] to-[#f7f8fb] dark:hidden" />
      {/* Decorative, extremely subtle accent blobs for depth */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-2xl opacity-70 dark:hidden bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),rgba(99,102,241,0))]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-2xl opacity-70 dark:hidden bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),rgba(6,182,212,0))]" />

      {/* Dark mode: elegant slate gradient */}
      <div className="absolute inset-0 hidden dark:block bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      <div className="relative flex items-center justify-center min-h-screen w-full px-4 py-16">
        {children}
      </div>
    </div>
  );
}

