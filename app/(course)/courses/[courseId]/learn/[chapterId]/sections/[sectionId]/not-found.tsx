import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SectionNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <FileQuestion className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Section Not Found</CardTitle>
              <CardDescription>
                The section you&apos;re looking for doesn&apos;t exist or has been removed.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/my-courses">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Courses
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
