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
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Last updated: February 11, 2026</p>
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
              Taxomind provides an AI-powered learning management system that enables users to create, share, and consume educational content. The Service includes course creation tools, learning analytics, community features, and AI-powered capabilities including:
            </p>
            <ul>
              <li>SAM (Smart AI Mentor) &mdash; an intelligent tutoring system for personalized learning guidance</li>
              <li>AI-assisted course and assessment generation</li>
              <li>AI-driven learning analytics, skill assessments, and adaptive recommendations</li>
              <li>Depth analysis and knowledge mapping using Bloom&apos;s Taxonomy</li>
              <li>Personalized skill roadmaps and learning paths</li>
            </ul>
            <p>
              AI-powered features are designed to supplement and enhance the learning experience. They are not intended to replace professional instruction, qualified educators, or authoritative academic sources.
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
            <p>
              <strong>AI Processing:</strong> Content you submit through AI-powered features (such as questions to SAM, course drafts for AI enhancement, or assessment responses for AI feedback) may be processed by our third-party AI providers (Anthropic, OpenAI, DeepSeek). This processing is necessary to deliver the AI-powered features you are using. Your content is not used to train third-party AI models. For full details, see our{" "}
              <Link href="/legal/ai-policy" className="text-purple-600 dark:text-purple-400 hover:underline">
                AI Transparency &amp; Usage Policy
              </Link>.
            </p>
            <p>You agree not to post content that:</p>
            <ul>
              <li>Infringes intellectual property rights</li>
              <li>Contains harmful or malicious code</li>
              <li>Is false, misleading, or defamatory</li>
              <li>Violates any applicable law</li>
            </ul>

            <h2>5. Payments, Subscriptions, and Refunds</h2>
            <p>
              Certain features require payment. All payments are processed securely through Stripe.
            </p>
            <ul>
              <li><strong>Subscriptions:</strong> Paid plans are billed on a recurring basis (monthly or annually, depending on your selected plan). Your subscription automatically renews at the end of each billing period unless you cancel before the renewal date.</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period, and you will retain access until that date.</li>
              <li><strong>Refunds:</strong> Refunds are available within 30 days of purchase for courses that have not been substantially completed (more than 25% of content accessed).</li>
              <li><strong>Price changes:</strong> We may change subscription prices with at least 30 days&apos; notice. Continued use after a price change constitutes acceptance of the new price.</li>
              <li><strong>EU consumers:</strong> If you are a consumer in the European Union, you have the right to withdraw from a purchase within 14 days of the transaction (&quot;cooling-off period&quot;), unless you have accessed or downloaded digital content and expressly consented to waive this right.</li>
            </ul>

            <h2>6. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding user content) are protected by copyright, trademark, and other laws. Our trademarks may not be used without prior written consent.
            </p>

            <h2>7. Prohibited Activities</h2>
            <p>You may not:</p>
            <ul>
              <li>Use the Service for illegal purposes</li>
              <li>Attempt to gain unauthorized access to systems or data</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Scrape or harvest data without permission</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Use AI features to generate content for fraudulent academic submissions or misrepresent AI-generated work as entirely your own in contexts where this is prohibited</li>
              <li>Attempt to manipulate AI assessments, skill evaluations, or learning analytics to falsify progress or credentials</li>
              <li>Reverse-engineer, extract, or attempt to access the underlying models, prompts, or algorithms of our AI systems</li>
              <li>Use the platform&apos;s AI features to generate harmful, discriminatory, or illegal content</li>
            </ul>

            <h2>8. AI Features &amp; Limitations</h2>
            <p>
              Our AI-powered features are subject to the following terms:
            </p>
            <ul>
              <li><strong>Accuracy:</strong> AI-generated content, including tutoring responses, assessments, feedback, and recommendations, may contain errors or inaccuracies. While we strive for quality, AI outputs should be verified by the user, especially in professional, medical, legal, or safety-critical contexts.</li>
              <li><strong>No liability for AI advice:</strong> Taxomind is not liable for decisions made based on AI-generated content. AI features provide educational support, not professional advice.</li>
              <li><strong>Availability:</strong> AI features depend on third-party AI provider availability and may experience downtime or degraded performance. We do not guarantee uninterrupted access to AI features.</li>
              <li><strong>Evolution:</strong> AI features may change, improve, or be modified over time. We reserve the right to update AI models, providers, or capabilities to improve the service.</li>
            </ul>
            <p>
              For complete details about our AI practices, see our{" "}
              <Link href="/legal/ai-policy" className="text-purple-600 dark:text-purple-400 hover:underline">
                AI Transparency &amp; Usage Policy
              </Link>.
            </p>

            <h2>9. Termination</h2>
            <p>
              We may suspend or terminate your account for violations of these terms. You may also delete your account at any time. Upon termination, your right to use the Service ceases immediately.
            </p>

            <h2>10. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, whether express or implied. We do not guarantee that the Service will be uninterrupted, secure, or error-free. Without limiting the foregoing:
            </p>
            <ul>
              <li>AI-generated content is provided without warranty of accuracy, completeness, or fitness for any particular purpose.</li>
              <li>AI-powered assessments and skill evaluations are approximations and should not be relied upon as definitive measures of competency.</li>
              <li>We do not warrant that AI features will meet your specific learning objectives or requirements.</li>
            </ul>

            <h2>11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Taxomind shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to damages arising from reliance on AI-generated content.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the platform. Continued use after changes constitutes acceptance of the new terms. If you do not agree to the updated terms, you should stop using the Service.
            </p>

            <h2>13. Governing Law &amp; Dispute Resolution</h2>
            <p>
              These terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.
            </p>
            <ul>
              <li><strong>Arbitration:</strong> Any dispute arising from these Terms or the Service shall be resolved through binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules, rather than in court, except that either party may seek injunctive relief in a court of competent jurisdiction.</li>
              <li><strong>Class action waiver:</strong> You agree that any dispute resolution proceedings will be conducted on an individual basis and not as a class action, collective action, or representative action.</li>
              <li><strong>EU consumer rights:</strong> If you are a consumer in the European Union, nothing in these terms affects your statutory rights under applicable EU consumer protection laws, including the right to bring proceedings in your country of residence. EU consumers may also use the European Commission&apos;s Online Dispute Resolution platform.</li>
              <li><strong>UK consumer rights:</strong> If you are a consumer in the United Kingdom, nothing in these terms affects your statutory rights under applicable UK consumer law.</li>
            </ul>

            <h2>14. Contact</h2>
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
