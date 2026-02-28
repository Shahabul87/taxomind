import { Metadata } from "next";
import Link from "next/link";

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: "Accessibility Statement | Taxomind",
  description: "Taxomind is committed to making our learning platform accessible to everyone, including people with disabilities.",
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Last updated: February 11, 2026</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Accessibility Statement
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Taxomind is committed to ensuring digital accessibility for people of all abilities. We continually improve the user experience for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300">
            <h2>1. Our Commitment</h2>
            <p>
              Taxomind is committed to conforming with the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. These guidelines explain how to make web content more accessible for people with disabilities and more user-friendly for everyone.
            </p>
            <p>
              We believe that education should be accessible to all learners, regardless of ability. Our platform is designed with inclusivity at its core, and we continuously work to identify and remove barriers to accessibility.
            </p>

            <h2>2. Accessibility Features</h2>
            <p>
              We have implemented the following accessibility features across our platform:
            </p>

            <h3>Keyboard Navigation</h3>
            <ul>
              <li>All interactive elements are accessible via keyboard</li>
              <li>Visible focus indicators are provided for keyboard users</li>
              <li>Logical tab order throughout all pages</li>
              <li>Skip-to-content links are available on key pages</li>
              <li>Keyboard shortcuts do not conflict with assistive technology</li>
            </ul>

            <h3>Screen Reader Support</h3>
            <ul>
              <li>Semantic HTML structure with proper heading hierarchy</li>
              <li>ARIA labels and landmarks for navigation and interactive components</li>
              <li>Alternative text for all meaningful images</li>
              <li>Descriptive link text that makes sense out of context</li>
              <li>Form inputs with associated labels and error messages</li>
              <li>Live regions for dynamic content updates</li>
            </ul>

            <h3>Visual Design</h3>
            <ul>
              <li>Color contrast ratios meet or exceed WCAG AA standards (4.5:1 for normal text, 3:1 for large text)</li>
              <li>Information is not conveyed by color alone</li>
              <li>Dark mode support to reduce eye strain and accommodate light sensitivity</li>
              <li>Text can be resized up to 200% without loss of content or functionality</li>
              <li>Consistent and predictable navigation across all pages</li>
            </ul>

            <h3>Responsive Design</h3>
            <ul>
              <li>Fully responsive layout that works across devices and screen sizes</li>
              <li>Content reflows properly at different zoom levels</li>
              <li>Touch targets are adequately sized for mobile users</li>
              <li>Orientation is not locked; content works in both portrait and landscape</li>
            </ul>

            <h3>Multimedia</h3>
            <ul>
              <li>Video content includes captions where available</li>
              <li>Audio content provides transcripts where available</li>
              <li>No content flashes more than three times per second</li>
              <li>Animations respect the user&apos;s reduced-motion preferences</li>
            </ul>

            <h2>3. Known Limitations</h2>
            <p>
              While we strive for full accessibility, some areas of our platform may have limitations:
            </p>
            <ul>
              <li><strong>Third-party content:</strong> Some embedded content from third-party providers (such as certain video players or payment forms) may not fully conform to WCAG 2.1 AA standards. We work with our providers to improve accessibility.</li>
              <li><strong>User-generated content:</strong> Courses and posts created by instructors may not always meet accessibility standards. We provide guidance to content creators on making their materials accessible.</li>
              <li><strong>PDF documents:</strong> Some older PDF documents may not be fully accessible. We are working to remediate these and ensure all new documents meet accessibility standards.</li>
              <li><strong>AI-generated content:</strong> Content generated by our AI features may not always produce optimally accessible output. We continuously improve our AI systems to better support accessibility.</li>
            </ul>

            <h2>4. Assistive Technology Compatibility</h2>
            <p>
              Our platform is designed to be compatible with the following assistive technologies:
            </p>
            <ul>
              <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
              <li>Screen magnification software</li>
              <li>Speech recognition software</li>
              <li>Keyboard-only navigation</li>
              <li>Switch access devices</li>
            </ul>

            <h2>5. Requesting Accessible Alternatives</h2>
            <p>
              If you encounter content that is not accessible to you, we are happy to provide alternative formats. You can request:
            </p>
            <ul>
              <li>Text descriptions of visual content</li>
              <li>Accessible document formats</li>
              <li>Alternative ways to complete tasks or access features</li>
              <li>Transcripts of audio or video content</li>
            </ul>
            <p>
              Please contact us with your request, and we will respond within 5 business days.
            </p>

            <h2>6. Feedback and Contact</h2>
            <p>
              We welcome your feedback on the accessibility of Taxomind. If you experience any accessibility barriers or have suggestions for improvement, please contact us:
            </p>
            <ul>
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:accessibility@taxomind.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                  accessibility@taxomind.com
                </a>
              </li>
              <li><strong>Response time:</strong> We aim to respond within 3 business days</li>
              <li><strong>Resolution:</strong> We will work to resolve accessibility issues promptly and keep you informed of our progress</li>
            </ul>

            <h2>7. Compliance and Standards</h2>
            <p>
              Our accessibility efforts are guided by:
            </p>
            <ul>
              <li><strong>WCAG 2.1 Level AA</strong> &mdash; Web Content Accessibility Guidelines published by the W3C</li>
              <li><strong>Section 508</strong> &mdash; U.S. federal accessibility requirements</li>
              <li><strong>ADA</strong> &mdash; Americans with Disabilities Act</li>
              <li><strong>European Accessibility Act (EAA)</strong> &mdash; EU Directive 2019/882, applicable to digital services</li>
              <li><strong>EN 301 549</strong> &mdash; European standard for ICT accessibility</li>
            </ul>

            <h2>8. Enforcement Procedure</h2>
            <p>
              If you are not satisfied with our response to your accessibility concern, you have the right to file a complaint with the relevant enforcement body:
            </p>
            <ul>
              <li><strong>United States:</strong> You may file a complaint with the U.S. Department of Justice under the ADA, or with the relevant federal agency under Section 508.</li>
              <li><strong>European Union:</strong> You may contact your national enforcement body under the European Accessibility Act or the Web Accessibility Directive (EU 2016/2102).</li>
              <li><strong>United Kingdom:</strong> You may contact the Equality and Human Rights Commission (EHRC) or the Equality Advisory Support Service (EASS).</li>
            </ul>

            <h2>9. Continuous Improvement</h2>
            <p>
              We regularly review and test our platform for accessibility, including:
            </p>
            <ul>
              <li>Automated accessibility scanning during development</li>
              <li>Manual testing with assistive technologies</li>
              <li>Periodic third-party accessibility audits</li>
              <li>Incorporating user feedback into our accessibility roadmap</li>
            </ul>
            <p>
              For more information about our data practices, please see our{" "}
              <Link href="/legal/privacy" className="text-purple-600 dark:text-purple-400 hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
