"use client";

import React from "react";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import parse from 'html-react-parser';
import { cn } from "@/lib/utils";

interface ChapterData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  postId: string;
  isPublished: boolean | null;
  isFree: boolean | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CardModeReadingProps {
  chapters: ChapterData[];
}

export const CardModeReading: React.FC<CardModeReadingProps> = ({ chapters }) => {
  const placeholderImage = "https://images.unsplash.com/photo-1706885093487-7eda37b48a60?q=80&w=3387&auto=format&fit=crop";

  // Handle null/undefined chapters
  if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500 dark:text-gray-400">No chapters available</p>
      </div>
    );
  }

  const parseHtmlContent = (htmlString: string) => {
    if (!htmlString) return null;

    try {
      return parse(htmlString, {
        replace: (domNode: any) => {
          if (domNode.type === 'tag') {
            switch (domNode.name) {
              case 'strong':
              case 'b':
                return <span className="font-bold">{domNode.children?.map((child: any) =>
                  child.data || (child.children && parse(child.children))
                )}</span>;
              case 'em':
              case 'i':
                return <span className="italic">{domNode.children?.map((child: any) =>
                  child.data || (child.children && parse(child.children))
                )}</span>;
              case 'u':
                return <span className="underline">{domNode.children?.map((child: any) =>
                  child.data || (child.children && parse(child.children))
                )}</span>;
            }
          }
          return undefined;
        }
      });
    } catch (error) {
      return <p>{htmlString}</p>;
    }
  };

  const DummyContent = ({ chapter }: { chapter: ChapterData }) => {
    return (
      <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl">
        {chapter.description ? (
          <div
            className={cn(
              "prose prose-slate dark:prose-invert max-w-none",
              "prose-headings:font-bold prose-headings:tracking-tight",
              "prose-p:text-neutral-600 dark:prose-p:text-neutral-400",
              "prose-p:leading-relaxed prose-p:text-base md:prose-p:text-2xl",
              "prose-a:text-blue-600 dark:prose-a:text-blue-400",
              "prose-strong:text-neutral-700 dark:prose-strong:text-neutral-200",
              "prose-strong:font-bold",
              "prose-code:text-purple-600 dark:prose-code:text-purple-400",
              "prose-pre:bg-neutral-900 dark:prose-pre:bg-neutral-950"
            )}
          >
            {parseHtmlContent(chapter.description)}
          </div>
        ) : (
          <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
            <span className="font-bold text-neutral-700 dark:text-neutral-200">
              Chapter {chapter.position || 1}: {chapter.title}
            </span>{" "}
            Explore this chapter to discover amazing insights and knowledge.
          </p>
        )}

        {chapter.imageUrl && (
          <img
            src={chapter.imageUrl}
            alt={chapter.title}
            className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain mt-8 rounded-2xl"
          />
        )}
      </div>
    );
  };

  const data = chapters.map((chapter, index) => ({
    category: chapter.isFree ? "Free Chapter" : `Chapter ${chapter.position || index + 1}`,
    title: chapter.title,
    src: chapter.imageUrl || placeholderImage,
    content: <DummyContent chapter={chapter} />,
  }));

  const cards = data.map((card, index) => (
    <Card key={card.src + index} card={card} index={index} />
  ));

  return (
    <div className="w-full h-full py-10 md:py-20">
      <h2 className="max-w-7xl pl-4 mx-auto text-2xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 font-sans mb-4">
        Explore Your Learning Journey
      </h2>
      <p className="max-w-7xl pl-4 mx-auto text-base md:text-xl text-neutral-600 dark:text-neutral-400 font-sans mb-8">
        Swipe through the chapters and click to dive deep into each topic.
      </p>
      <Carousel items={cards} />
    </div>
  );
};

export default CardModeReading;
