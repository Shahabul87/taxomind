import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { ConfettiProvider } from '@/components/providers/confetti-provider';

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
         
          <main className="min-h-screen w-full px-0 sm:px-2 md:px-4">             
              {children}
          </main> 
        </div>
      </div>
   </SessionProvider>
  )
}