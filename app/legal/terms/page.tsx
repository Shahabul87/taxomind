import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Taxomind",
  description: "Read the terms and conditions for using Taxomind's learning platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Last updated: January 20, 2026</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Please read these terms carefully before using our platform.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Taxomind (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Taxomind provides an AI-powered learning management system that enables users to create, share, and consume educational content. The Service includes course creation tools, learning analytics, and community features.
            </p>

            <h2>3. User Accounts</h2>
            <p>To access certain features, you must create an account. You agree to:</p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h2>4. User Content</h2>
            <p>
              You retain ownership of content you create. By posting content, you grant us a worldwide, non-exclusive license to use, display, and distribute your content in connection with the Service.
            </p>
            <p>You agree not to post content that:</p>
            <ul>
              <li>Infringes intellectual property rights</li>
              <li>Contains harmful or malicious code</li>
              <li>Is false, misleading, or defamatory</li>
              <li>Violates any applicable law</li>
            </ul>

            <h2>5. Payments and Refunds</h2>
            <p>
              Certain features require payment. All payments are processed securely through Stripe. Refunds are available within 30 days of purchase for courses that have not been substantially completed.
            </p>

            <h2>6. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding user content) are protected by copyright, trademark, and other laws. Our trademarks may not be used without prior written consent.
            </p>

            <h2>7. Prohibited Activities</h2>
            <p>You may not:</p>
            <ul>
              <li>Use the Service for illegal purposes</li>
              <li>Attempt to gain unauthorized access</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Scrape or harvest data without permission</li>
              <li>Impersonate others or misrepresent your affiliation</li>
            </ul>

            <h2>8. Termination</h2>
            <p>
              We may suspend or terminate your account for violations of these terms. You may also delete your account at any time. Upon termination, your right to use the Service ceases immediately.
            </p>

            <h2>9. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the Service will be uninterrupted, secure, or error-free.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Taxomind shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
            </p>

            <h2>11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of significant changes. Continued use after changes constitutes acceptance of the new terms.
            </p>

            <h2>12. Governing Law</h2>
            <p>
              These terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.
            </p>

            <h2>13. Contact</h2>
            <p>
              For questions about these terms, contact us at{" "}
              <a href="mailto:legal@taxomind.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                legal@taxomind.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
