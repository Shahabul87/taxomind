import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen pt-14 xl:pt-16">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-96" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}
