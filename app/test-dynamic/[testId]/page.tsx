import { notFound } from 'next/navigation';
import Link from 'next/link';

type Props = {
  params: Promise<{ testId: string }>
};

export default async function TestDynamicPage(props: Props) {
  const params = await props.params;
  const testId = params.testId;

  // Simple validation
  if (!testId || testId.length < 3) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dynamic Route Test</h1>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            ✅ Dynamic Route Working!
          </h2>
          
          <div className="space-y-2 text-green-700">
            <p><strong>Route:</strong> /test-dynamic/[testId]</p>
            <p><strong>Test ID:</strong> {testId}</p>
            <p><strong>Status:</strong> Successfully rendered</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Test Different IDs:</h3>
          <ul className="space-y-1 text-blue-700">
            <li>• <Link href="/test-dynamic/abc123" className="underline hover:text-blue-900">/test-dynamic/abc123</Link></li>
            <li>• <Link href="/test-dynamic/test-course-456" className="underline hover:text-blue-900">/test-dynamic/test-course-456</Link></li>
            <li>• <Link href="/test-dynamic/dynamic-route-test" className="underline hover:text-blue-900">/test-dynamic/dynamic-route-test</Link></li>
          </ul>
        </div>

        <div className="mt-6">
          <Link 
            href="/" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 