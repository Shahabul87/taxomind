import { Suspense } from "react";
import { currentUser } from "@/lib/auth";
import { AIRecommendations } from "../_components/ai-recommendations";
import { LearningPathsBuilder } from "../_components/learning-paths-builder";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Explore Courses | Taxomind - Personalized Learning",
  description: "Discover personalized course recommendations, structured learning paths, and AI-powered suggestions tailored to your learning journey."
};

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ExplorePage() {
  const user = await currentUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore & Discover</h1>
          <p className="text-muted-foreground">
            Personalized recommendations and learning paths tailored for your journey
          </p>
        </div>

        <div className="space-y-12">
          {/* AI Recommendations Section */}
          <Suspense fallback={<LoadingSkeleton />}>
            <AIRecommendations
              userId={user?.id}
              userInterests={["web development", "react", "typescript"]} // Would come from user profile
              completedCourses={[]} // Would come from user's enrollment data
            />
          </Suspense>

          {/* Learning Paths Section */}
          <Suspense fallback={<LoadingSkeleton />}>
            <LearningPathsBuilder
              userId={user?.id}
              enrolledPaths={["frontend-master"]} // Would come from user's enrollment data
            />
          </Suspense>

          {/* Additional Features Info */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="font-semibold mb-2">🎯 Smart Course Comparison</h3>
              <p className="text-sm text-muted-foreground">
                Compare up to 3 courses side-by-side to make informed decisions. Available on each course card.
              </p>
            </div>
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="font-semibold mb-2">💾 Wishlist & Save for Later</h3>
              <p className="text-sm text-muted-foreground">
                Save interesting courses to your wishlist and get notified about price drops and updates.
              </p>
            </div>
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="font-semibold mb-2">📊 Learning Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Track your learning progress, time spent, and skill development across all your courses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}