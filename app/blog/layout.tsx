import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { ConfettiProvider } from '@/components/providers/confetti-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  other: {
    'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
  },
};

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  const session = await auth();

  return (
   <SessionProvider session={session}>
      <div className="relative min-h-screen">
        <div className="antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
          <ConfettiProvider />
         
          <main className="min-h-screen w-full">             
              {children}
          </main> 
        </div>
      </div>
   </SessionProvider>
  )
}