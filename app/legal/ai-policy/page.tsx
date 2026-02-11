import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Transparency & Usage Policy | Taxomind",
  description: "Learn how Taxomind uses artificial intelligence to power personalized learning experiences, including our AI providers, data practices, and your rights.",
};

export default function AIPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Last updated: February 11, 2026</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              AI Transparency &amp; Usage Policy
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              At Taxomind, we believe in transparency about how we use artificial intelligence to enhance your learning experience. This policy explains our AI practices, the data involved, and your rights.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300">
            <h2>1. AI-Powered Features</h2>
            <p>
              Taxomind integrates artificial intelligence throughout the platform to deliver personalized, adaptive learning experiences. Our AI-powered features include:
            </p>
            <ul>
              <li><strong>SAM (Smart AI Mentor):</strong> An intelligent tutoring system that provides real-time guidance, answers questions, explains concepts, and adapts to your learning style and pace.</li>
              <li><strong>Course Generation:</strong> AI assists instructors in creating structured course content, including lesson outlines, learning objectives, and educational materials.</li>
              <li><strong>Exam &amp; Assessment Creation:</strong> AI generates practice questions, quizzes, and assessments aligned with Bloom&apos;s Taxonomy to evaluate understanding at different cognitive levels.</li>
              <li><strong>Learning Analytics:</strong> AI analyzes your learning patterns, progress, and performance to provide personalized insights and recommendations.</li>
              <li><strong>Skill Roadmaps:</strong> AI creates customized learning paths based on your goals, current skill level, and areas for improvement.</li>
              <li><strong>Depth Analysis:</strong> AI evaluates the depth and breadth of your knowledge using taxonomic frameworks to identify gaps and suggest focused study areas.</li>
              <li><strong>Adaptive Difficulty:</strong> AI adjusts the difficulty of content and assessments based on your demonstrated proficiency.</li>
            </ul>

            <h2>2. AI Providers</h2>
            <p>
              We partner with leading AI providers to deliver high-quality, reliable AI capabilities. Our current AI providers include:
            </p>
            <ul>
              <li><strong>Anthropic (Claude):</strong> Used for conversational AI, content analysis, and educational reasoning. Selected for its strong safety practices and nuanced understanding of educational content.</li>
              <li><strong>OpenAI (GPT models):</strong> Used for content generation, question creation, and language processing tasks.</li>
              <li><strong>DeepSeek:</strong> Used for specialized analytical tasks and as a cost-effective option for certain AI operations.</li>
            </ul>
            <p>
              We carefully evaluate all AI providers for quality, safety, privacy practices, and educational suitability before integration. The specific provider used for a given task may vary based on the nature of the request, availability, and performance considerations.
            </p>

            <h2>3. What Data Is Sent to AI Providers</h2>
            <p>
              When you use AI-powered features, certain data is sent to our AI providers to generate responses. This includes:
            </p>
            <ul>
              <li>Your messages, questions, and prompts to SAM</li>
              <li>Course content context relevant to your current learning session</li>
              <li>Your learning progress and performance data (anonymized where possible)</li>
              <li>Assessment responses for AI-powered feedback</li>
              <li>Skill level indicators for adaptive content generation</li>
            </ul>
            <p>
              <strong>We never send the following data to AI providers:</strong>
            </p>
            <ul>
              <li>Your password or authentication credentials</li>
              <li>Payment information or financial data</li>
              <li>Government-issued identification numbers</li>
              <li>Data from other users without their consent</li>
              <li>Any data beyond what is necessary for the specific AI feature being used</li>
            </ul>

            <h2>4. AI-Generated Content Disclaimer</h2>
            <p>
              AI-generated content on Taxomind is provided as a learning aid and should be understood in the following context:
            </p>
            <ul>
              <li><strong>Accuracy:</strong> AI-generated content may contain errors, inaccuracies, or outdated information. While we strive for accuracy, AI outputs should not be treated as authoritative sources.</li>
              <li><strong>Not a substitute:</strong> AI-powered features are designed to supplement, not replace, professional instruction, textbooks, or qualified educators.</li>
              <li><strong>Verification:</strong> Users should verify important information from AI-generated content with authoritative sources, especially in professional, medical, legal, or safety-critical contexts.</li>
              <li><strong>Academic integrity:</strong> AI-generated content should be used as a learning tool, not submitted as original work in academic settings unless permitted by your institution.</li>
            </ul>

            <h2>5. How AI Decisions Are Made</h2>
            <p>
              Our AI systems make or assist with several types of decisions that affect your learning experience:
            </p>
            <ul>
              <li><strong>Adaptive difficulty:</strong> Based on your performance history and demonstrated understanding, AI adjusts the complexity of content and assessments. This is determined by analyzing response patterns, time-on-task, and accuracy rates.</li>
              <li><strong>Skill assessments:</strong> AI evaluates your responses against Bloom&apos;s Taxonomy levels to provide a multi-dimensional view of your knowledge depth. These assessments consider factual recall, comprehension, application, analysis, evaluation, and creation.</li>
              <li><strong>Content recommendations:</strong> AI suggests courses, topics, and learning materials based on your stated goals, learning history, and areas where improvement is indicated.</li>
              <li><strong>Learning path optimization:</strong> AI sequences learning activities to build knowledge progressively, ensuring prerequisites are met before advancing to more complex topics.</li>
            </ul>
            <p>
              No AI-driven decision on our platform results in significant legal or similarly impactful consequences. AI recommendations are always advisory in nature.
            </p>

            <h2>6. Your Rights Regarding AI</h2>
            <p>
              As a Taxomind user, you have the following rights with respect to our AI features:
            </p>
            <ul>
              <li><strong>Transparency:</strong> You have the right to know when you are interacting with AI-generated content or AI-powered features. We clearly label AI interactions throughout the platform.</li>
              <li><strong>Opt-out:</strong> Where feasible, you can choose not to use AI-powered features. Core platform functionality (browsing courses, reading content, manual assessments) remains available without AI.</li>
              <li><strong>Human review:</strong> You can request human review of AI-generated assessments, feedback, or recommendations by contacting our support team.</li>
              <li><strong>Data access:</strong> You can request a copy of the data we have processed through AI systems on your behalf.</li>
              <li><strong>Objection to profiling:</strong> Under GDPR, you have the right to object to automated profiling. You can exercise this right by contacting us.</li>
              <li><strong>Deletion:</strong> You can request deletion of your AI interaction history, subject to our data retention requirements.</li>
            </ul>

            <h2>7. AI Bias and Fairness</h2>
            <p>
              We are committed to ensuring our AI systems are fair, unbiased, and equitable:
            </p>
            <ul>
              <li>We regularly evaluate our AI outputs for bias across demographic groups, learning styles, and educational backgrounds.</li>
              <li>Our AI prompts and system configurations are designed to provide inclusive, culturally sensitive responses.</li>
              <li>We use Taxomind&apos;s built-in safety and quality systems (including bias detection and fairness modules) to monitor AI behavior.</li>
              <li>We actively work with our AI providers to address identified biases and improve fairness.</li>
              <li>If you believe you have experienced biased or unfair AI behavior on our platform, please report it to{" "}
                <a href="mailto:ai@taxomind.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                  ai@taxomind.com
                </a>. We take all such reports seriously.
              </li>
            </ul>

            <h2>8. Data Handling by AI Providers</h2>
            <p>
              We have carefully reviewed the data practices of our AI providers and have the following safeguards in place:
            </p>
            <ul>
              <li><strong>No training on your data:</strong> Our agreements with AI providers stipulate that your data sent through our platform is not used to train their AI models.</li>
              <li><strong>Data processing agreements:</strong> We have executed Data Processing Agreements (DPAs) with all AI providers, ensuring compliance with GDPR and other applicable data protection laws.</li>
              <li><strong>Data minimization:</strong> We only send the minimum amount of data necessary for each AI operation.</li>
              <li><strong>Encryption:</strong> All data transmitted to AI providers is encrypted in transit using TLS 1.2 or higher.</li>
              <li><strong>Retention limits:</strong> AI providers are contractually required to delete processing data within their specified retention windows (typically 30 days or less).</li>
              <li><strong>Geographic processing:</strong> Data may be processed in the United States or European Union, depending on the provider. We ensure appropriate safeguards (such as Standard Contractual Clauses) are in place for any cross-border transfers.</li>
            </ul>

            <h2>9. EU AI Act Compliance</h2>
            <p>
              Taxomind is committed to compliance with the European Union&apos;s Artificial Intelligence Act (EU AI Act). Our AI systems are classified as follows:
            </p>
            <ul>
              <li><strong>Risk classification:</strong> Our AI-powered learning features are designed to fall within the &quot;limited risk&quot; category under the EU AI Act. They provide educational assistance and recommendations but do not make decisions with significant legal or life-impacting effects.</li>
              <li><strong>Transparency obligations (Article 50):</strong> In accordance with Article 50 of the EU AI Act (effective August 2026), we clearly disclose when users are interacting with AI systems and provide this policy as a comprehensive transparency measure.</li>
              <li><strong>Human oversight:</strong> All AI-driven features include mechanisms for human oversight. Instructors and administrators can review and override AI-generated content and assessments.</li>
              <li><strong>Record-keeping:</strong> We maintain logs of AI system usage, outputs, and any reported issues for audit and compliance purposes.</li>
            </ul>

            <h2>10. Changes to This Policy</h2>
            <p>
              As AI technology evolves, we may update this policy to reflect new features, providers, or regulatory requirements. We will notify you of significant changes by email or through our platform. We encourage you to review this policy periodically.
            </p>

            <h2>11. Related Policies</h2>
            <p>
              This AI Transparency &amp; Usage Policy should be read alongside our other policies:
            </p>
            <ul>
              <li>
                <Link href="/legal/privacy" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Privacy Policy
                </Link> &mdash; How we collect, use, and protect your personal data
              </li>
              <li>
                <Link href="/legal/terms" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Terms of Service
                </Link> &mdash; Terms governing your use of the platform, including AI features
              </li>
              <li>
                <Link href="/legal/cookies" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Cookie Policy
                </Link> &mdash; How we use cookies and similar technologies
              </li>
            </ul>

            <h2>12. Contact Us</h2>
            <p>
              If you have questions, concerns, or feedback about our AI practices, please contact us at{" "}
              <a href="mailto:ai@taxomind.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                ai@taxomind.com
              </a>
            </p>
            <p>
              For general privacy inquiries, contact{" "}
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
