import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LearningPathRecommendations } from "./_components/learning-path-recommendations";
import { MyLearningPaths } from "./_components/my-learning-paths";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Route } from "lucide-react";

const LearningPathsPage = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning Paths</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Personalized learning journeys designed to help you achieve your goals
        </p>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="my-paths" className="flex items-center gap-2">
            <Route className="w-4 h-4" />
            My Paths
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          <LearningPathRecommendations />
        </TabsContent>

        <TabsContent value="my-paths" className="space-y-6">
          <MyLearningPaths userId={session.user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningPathsPage;