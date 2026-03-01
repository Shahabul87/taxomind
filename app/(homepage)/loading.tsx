import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="space-y-4 px-6 pt-12 pb-8">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <Skeleton className="h-10 w-40 mx-auto rounded-full" />
      </div>
      {/* Course grid skeleton */}
      <div className="grid gap-6 px-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
