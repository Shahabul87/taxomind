import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | Taxomind",
  description: "Learn how Taxomind uses cookies and similar technologies to enhance your learning experience.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Last updated: February 11, 2026</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Cookie Policy
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              This policy explains how Taxomind uses cookies and similar technologies when you visit our platform.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300">
            <h2>1. What Are Cookies</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and give website owners useful information about how their site is being used.
            </p>
            <p>
              We also use similar technologies such as local storage, session storage, and pixel tags, which function in a comparable way. References to &quot;cookies&quot; in this policy include these similar technologies.
            </p>

            <h2>2. How We Use Cookies</h2>
            <p>
              Taxomind uses cookies for the following purposes:
            </p>
            <ul>
              <li>To authenticate you and keep you signed in during your session</li>
              <li>To remember your preferences and settings (such as dark mode and language)</li>
              <li>To understand how you use our platform so we can improve it</li>
              <li>To deliver relevant content and measure its effectiveness</li>
              <li>To ensure the security and integrity of our platform</li>
            </ul>

            <h2>3. Types of Cookies We Use</h2>

            <h3>Strictly Necessary Cookies</h3>
            <p>
              These cookies are essential for the operation of our platform. They enable core functionality such as authentication, security, and session management. You cannot opt out of these cookies as the platform would not function properly without them.
            </p>
            <ul>
              <li><strong>next-auth.session-token</strong> &mdash; Manages your authenticated session (NextAuth.js)</li>
              <li><strong>next-auth.csrf-token</strong> &mdash; Prevents cross-site request forgery attacks</li>
              <li><strong>next-auth.callback-url</strong> &mdash; Stores the redirect URL after authentication</li>
              <li><strong>__Host-next-auth.csrf-token</strong> &mdash; Secure CSRF protection (HTTPS)</li>
            </ul>

            <h3>Functional Cookies</h3>
            <p>
              These cookies enable personalized features and remember your choices to provide an enhanced experience.
            </p>
            <ul>
              <li><strong>theme</strong> &mdash; Remembers your light/dark mode preference</li>
              <li><strong>locale</strong> &mdash; Stores your language preference</li>
              <li><strong>sidebar-collapsed</strong> &mdash; Remembers your dashboard layout preference</li>
              <li><strong>cookie-consent</strong> &mdash; Records your cookie consent choices</li>
            </ul>

            <h3>Analytics Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with our platform by collecting anonymous usage data. This information helps us improve our services and learning experience.
            </p>
            <ul>
              <li>Page visit counts and navigation patterns</li>
              <li>Feature usage and learning engagement metrics</li>
              <li>Error and performance monitoring</li>
            </ul>

            <h3>Marketing Cookies</h3>
            <p>
              We currently do not use marketing or advertising cookies. If this changes in the future, we will update this policy and request your consent before placing any marketing cookies.
            </p>

            <h2>4. Third-Party Cookies</h2>
            <p>
              Some cookies on our platform are set by third-party services that we use to provide specific functionality:
            </p>
            <ul>
              <li><strong>Stripe</strong> &mdash; Payment processing cookies that are strictly necessary for secure payment transactions. These cookies are governed by{" "}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Stripe&apos;s Privacy Policy
                </a>.
              </li>
              <li><strong>Vercel Analytics</strong> &mdash; Anonymous performance and usage analytics. Governed by{" "}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Vercel&apos;s Privacy Policy
                </a>.
              </li>
            </ul>

            <h2>5. Managing Cookies</h2>
            <p>
              You can control and manage cookies in several ways:
            </p>
            <ul>
              <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or delete cookies through their settings. Instructions can typically be found in your browser&apos;s &quot;Help&quot; or &quot;Settings&quot; section.</li>
              <li><strong>Cookie Consent:</strong> When you first visit our platform, you can choose which categories of cookies to accept through our cookie consent banner.</li>
              <li><strong>Individual Cookie Removal:</strong> You can delete individual cookies through your browser&apos;s developer tools or settings.</li>
            </ul>
            <p>
              Please note that disabling certain cookies may affect the functionality of our platform. Strictly necessary cookies cannot be disabled as they are required for the platform to function.
            </p>

            <h2>6. Cookie Retention</h2>
            <p>
              Cookie retention periods vary depending on their purpose:
            </p>
            <ul>
              <li><strong>Session cookies</strong> &mdash; Deleted when you close your browser</li>
              <li><strong>Authentication cookies</strong> &mdash; Up to 30 days (or until you sign out)</li>
              <li><strong>Preference cookies</strong> &mdash; Up to 1 year</li>
              <li><strong>Analytics cookies</strong> &mdash; Up to 2 years</li>
              <li><strong>Consent cookies</strong> &mdash; Up to 1 year</li>
            </ul>

            <h2>7. Your Rights</h2>
            <p>
              Under GDPR and similar data protection laws, you have the right to:
            </p>
            <ul>
              <li>Be informed about the cookies we use (this policy)</li>
              <li>Choose which non-essential cookies to accept or reject</li>
              <li>Withdraw your consent at any time by clearing cookies or adjusting your preferences</li>
              <li>Request information about the data collected through cookies</li>
            </ul>
            <p>
              For more information about how we handle your personal data, please see our{" "}
              <Link href="/legal/privacy" className="text-purple-600 dark:text-purple-400 hover:underline">
                Privacy Policy
              </Link>.
            </p>

            <h2>8. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business practices. We will notify you of significant changes by posting a notice on our platform.
            </p>

            <h2>9. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us at{" "}
              <a href="mailto:privacy@taxomind.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                privacy@taxomind.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
