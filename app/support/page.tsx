import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageWithMobileLayout } from "@/components/layouts/PageWithMobileLayout";

export const dynamic = 'force-dynamic';
import { SupportHero } from "./_components/support-hero";
import { QuickActions } from "./_components/quick-actions";
import { FAQSection } from "./_components/faq-section";
import { ContactForm } from "./_components/contact-form";
import { SupportStats } from "./_components/support-stats";
import { ResourceSection } from "./_components/resource-section";

export default async function SupportPage() {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  return (
    <PageWithMobileLayout
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={true}
      contentClassName="bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800"
    >
      <div className="min-h-screen">
        {/* Hero Section */}
        <SupportHero />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-16">
          {/* Quick Actions */}
          <QuickActions />

          {/* Support Stats */}
          <SupportStats />

          {/* FAQ Section */}
          <section id="faq">
            <FAQSection />
          </section>

          {/* Contact Form */}
          <section id="contact">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contact Support
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Still Need Help?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Submit a support ticket and our team will get back to you within 2 hours
              </p>
            </div>
            <ContactForm userId={user.id!} />
          </section>

          {/* Resources */}
          <section id="resources">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Learning Resources
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Helpful Resources
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Explore our collection of guides, tutorials, and documentation
              </p>
            </div>
            <ResourceSection />
          </section>
        </div>
      </div>
    </PageWithMobileLayout>
  );
} 