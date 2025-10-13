"use client";

interface PageBackgroundProps {
  children: React.ReactNode;
}

export function PageBackground({ children }: PageBackgroundProps) {
  return (
    <div className="relative w-full overflow-x-hidden min-h-screen bg-gradient-to-bl from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      {/* Glowing orbs - Light theme */}
      <div className="absolute -top-40 -right-20 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-10 dark:hidden"></div>
      <div className="absolute top-[30%] -left-20 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-10 dark:hidden"></div>

      {/* Glowing orbs - Dark theme */}
      <div className="hidden dark:block absolute -top-40 -right-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="hidden dark:block absolute top-[30%] -left-20 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="relative w-full">{children}</div>
    </div>
  );
}
