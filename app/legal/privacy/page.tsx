import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Taxomind",
  description: "Learn how Taxomind collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Last updated: February 11, 2026</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300">
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul>
              <li>Account information (name, email, password)</li>
              <li>Profile information (photo, bio, preferences)</li>
              <li>Payment information (processed securely via Stripe)</li>
              <li>Course progress and learning data</li>
              <li>Communications with us (support requests, feedback)</li>
              <li>AI interaction data, including conversations with our AI tutor (SAM), learning analytics processed by AI, and AI-generated assessments and feedback</li>
            </ul>
            <p>We also automatically collect certain information when you use our platform, including device information, IP address, browser type, and usage patterns.</p>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Personalize your learning experience</li>
              <li>Power AI-driven personalized learning experiences via third-party AI providers (see our{" "}
                <Link href="/legal/ai-policy" className="text-purple-600 dark:text-purple-400 hover:underline">
                  AI Transparency &amp; Usage Policy
                </Link> for details)
              </li>
              <li>Analyze usage patterns to improve our platform</li>
              <li>Detect and prevent fraudulent activity</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul>
              <li>Service providers who assist in our operations</li>
              <li>
                <strong>AI service providers:</strong> We use Anthropic (Claude), OpenAI, and DeepSeek to power our AI-driven learning features. When you interact with AI features, relevant learning context and your messages are processed by these providers. Your data is transmitted securely and is not used to train their AI models. For complete details, see our{" "}
                <Link href="/legal/ai-policy" className="text-purple-600 dark:text-purple-400 hover:underline">
                  AI Transparency &amp; Usage Policy
                </Link>.
              </li>
              <li>Payment processors (Stripe) for transaction processing</li>
              <li>Professional advisors (lawyers, accountants)</li>
              <li>Law enforcement when required by law</li>
              <li>Other parties with your consent</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including encryption, access controls, and regular security audits. All data transmitted to third-party services, including AI providers, is encrypted using TLS 1.2 or higher. For more information, visit our <Link href="/security" className="text-purple-600 dark:text-purple-400 hover:underline">Security page</Link>.
            </p>

            <h2>5. Data Retention</h2>
            <p>
              We retain your information according to the following schedule:
            </p>
            <ul>
              <li><strong>Account data:</strong> Retained while your account is active, plus 30 days after account deletion to allow for account recovery</li>
              <li><strong>Learning analytics and progress data:</strong> Retained for up to 3 years to support long-term learning insights and skill tracking</li>
              <li><strong>AI conversation logs:</strong> Retained for up to 1 year, after which they are anonymized or deleted</li>
              <li><strong>Payment records:</strong> Retained for 7 years as required by applicable tax and financial regulations</li>
              <li><strong>Support communications:</strong> Retained for up to 2 years after resolution</li>
            </ul>
            <p>
              You can request deletion of your data at any time by contacting us. Some data may be retained longer where required by law or for legitimate business purposes.
            </p>

            <h2>6. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data (&quot;right to be forgotten&quot;)</li>
              <li>Export your data in a portable, machine-readable format (data portability)</li>
              <li>Restrict the processing of your data</li>
              <li>Object to processing, including automated profiling and AI-driven personalization</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent at any time, where processing is based on consent</li>
              <li>Not be subject to decisions based solely on automated processing that produce legal or similarly significant effects (Article 22, GDPR)</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:privacy@taxomind.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                privacy@taxomind.com
              </a>. We will respond to your request within 30 days.
            </p>

            <h2>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts. You can control cookies through your browser settings or our cookie consent mechanism.
            </p>
            <p>
              For complete details about the cookies we use and how to manage them, please see our{" "}
              <Link href="/legal/cookies" className="text-purple-600 dark:text-purple-400 hover:underline">
                Cookie Policy
              </Link>.
            </p>

            <h2>8. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own, including the United States. When we transfer personal data outside of the European Economic Area (EEA), United Kingdom, or Switzerland, we ensure appropriate safeguards are in place, including:
            </p>
            <ul>
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Data Processing Agreements with all third-party providers, including AI service providers</li>
              <li>Adequacy decisions where applicable</li>
            </ul>

            <h2>9. Children&apos;s Privacy</h2>
            <p>
              Our services are not directed to children under 13. We do not knowingly collect information from children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete that information promptly.
            </p>

            <h2>10. California Privacy Rights (CCPA)</h2>
            <p>
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):
            </p>
            <ul>
              <li><strong>Right to know:</strong> You can request details about the categories and specific pieces of personal information we have collected about you.</li>
              <li><strong>Right to delete:</strong> You can request deletion of your personal information, subject to certain exceptions.</li>
              <li><strong>Right to opt-out of sale:</strong> We do not sell your personal information. If this changes, we will provide a &quot;Do Not Sell My Personal Information&quot; mechanism.</li>
              <li><strong>Right to non-discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</li>
              <li><strong>Right to correct:</strong> You can request that we correct inaccurate personal information.</li>
              <li><strong>Right to limit use of sensitive data:</strong> You can limit how we use sensitive personal information.</li>
            </ul>
            <p>
              To exercise your CCPA rights, contact us at{" "}
              <a href="mailto:privacy@taxomind.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                privacy@taxomind.com
              </a> or call our privacy line. We will verify your identity before processing your request.
            </p>

            <h2>11. AI Transparency</h2>
            <p>
              Taxomind uses artificial intelligence extensively to provide personalized learning experiences. For comprehensive information about our AI practices, including what data is processed by AI, how AI decisions are made, and your rights regarding AI, please see our{" "}
              <Link href="/legal/ai-policy" className="text-purple-600 dark:text-purple-400 hover:underline">
                AI Transparency &amp; Usage Policy
              </Link>.
            </p>

            <h2>12. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of significant changes by email or through our platform. Your continued use of the platform after changes are posted constitutes acceptance of the revised policy.
            </p>

            <h2>13. Contact Us</h2>
            <p>
              If you have questions about this privacy policy, please contact us at{" "}
              <a href="mailto:privacy@taxomind.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                privacy@taxomind.com
              </a>
            </p>
            <p>
              <strong>Data Protection Officer:</strong>{" "}
              <a href="mailto:dpo@taxomind.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                dpo@taxomind.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
