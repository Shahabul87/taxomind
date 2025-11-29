"use client";

import { TabsContent } from "@/components/ui/tabs";
import { ChapterDepthAnalysis } from "../../chapter-depth-analysis";
import type { ChapterAnalysisItem } from "../types";

interface ChaptersTabProps {
  chapters: ChapterAnalysisItem[];
  onAskSam: (context: string) => void;
}

export function ChaptersTab({ chapters, onAskSam }: ChaptersTabProps) {
  return (
    <TabsContent value="chapters" className="mt-6">
      <ChapterDepthAnalysis
        chapters={chapters}
        onImproveChapter={(chapter) => onAskSam(`How can I improve the depth of chapter: ${chapter}?`)}
      />
    </TabsContent>
  );
}
