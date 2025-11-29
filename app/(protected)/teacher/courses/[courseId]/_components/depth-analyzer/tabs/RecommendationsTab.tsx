"use client";

import { TabsContent } from "@/components/ui/tabs";
import { ImprovementRecommendations } from "../../improvement-recommendations";
import type { Recommendation, ImprovementPlan } from "../types";

interface RecommendationsTabProps {
  recommendations: Recommendation[];
  improvementPlan?: ImprovementPlan;
  onAskSam: (context: string) => void;
}

export function RecommendationsTab({
  recommendations,
  improvementPlan,
  onAskSam,
}: RecommendationsTabProps) {
  return (
    <TabsContent value="recommendations" className="mt-6">
      <ImprovementRecommendations
        recommendations={recommendations}
        improvementPlan={improvementPlan}
        onImplement={(rec) => onAskSam(`Help me implement: ${rec.title}`)}
      />
    </TabsContent>
  );
}
