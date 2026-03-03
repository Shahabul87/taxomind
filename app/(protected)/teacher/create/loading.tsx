import { Skeleton } from "@/components/ui/skeleton";

export default function CreateCourseLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <Skeleton className="h-8 w-56" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
    </div>
  );
}
