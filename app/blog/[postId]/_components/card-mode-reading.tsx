"use client";

import React from "react";
import Image from "next/image";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import parse, { DOMNode, Element } from 'html-react-parser';
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
      <div className="flex items-center justify-center p-10 bg-blog-bg dark:bg-slate-900">
        <p className="text-blog-text-muted dark:text-slate-400 font-blog-body">No chapters available</p>
      </div>
    );
  }

  const parseHtmlContent = (htmlString: string) => {
    if (!htmlString) return null;

    try {
      return parse(htmlString, {
        replace: (domNode: DOMNode) => {
          if (domNode.type === 'tag') {
            const element = domNode as Element;
            switch (element.name) {
              case 'strong':
              case 'b':
                return <span className="font-bold text-blog-text dark:text-white">{element.children?.map((child) =>
                  (child as { data?: string }).data || ((child as Element).children && parse((child as Element).children as unknown as string))
                )}</span>;
              case 'em':
              case 'i':
                return <span className="italic text-blog-text-muted dark:text-slate-300">{element.children?.map((child) =>
                  (child as { data?: string }).data || ((child as Element).children && parse((child as Element).children as unknown as string))
                )}</span>;
              case 'u':
                return <span className="underline decoration-blog-primary/40">{element.children?.map((child) =>
                  (child as { data?: string }).data || ((child as Element).children && parse((child as Element).children as unknown as string))
                )}</span>;
            }
          }
          return undefined;
        }
      });
    } catch {
      return <p className="font-blog-body">{htmlString}</p>;
    }
  };

  const DummyContent = ({ chapter }: { chapter: ChapterData }) => {
    return (
      <div className="bg-blog-surface dark:bg-slate-800 p-8 md:p-14 rounded-3xl border border-blog-border dark:border-slate-700">
        {chapter.description ? (
          <div
            className={cn(
              "prose prose-slate dark:prose-invert max-w-none",
              "font-blog-body",
              "prose-headings:font-bold prose-headings:tracking-tight",
              "prose-headings:font-blog-display",
              "prose-p:text-blog-text dark:prose-p:text-slate-300",
              "prose-p:leading-[1.8] prose-p:text-base md:prose-p:text-2xl",
              "prose-a:text-blog-primary dark:prose-a:text-blog-primary-light",
              "prose-strong:text-blog-text dark:prose-strong:text-white",
              "prose-strong:font-bold",
              "prose-code:text-blog-accent dark:prose-code:text-blog-accent",
              "prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950",
              "prose-blockquote:border-l-blog-primary prose-blockquote:bg-blog-primary/5"
            )}
          >
            {parseHtmlContent(chapter.description)}
          </div>
        ) : (
          <p className="text-blog-text dark:text-slate-300 text-base md:text-2xl font-blog-body max-w-3xl mx-auto">
            <span className="font-bold text-blog-text dark:text-white font-blog-display">
              Chapter {chapter.position || 1}: {chapter.title}
            </span>{" "}
            Explore this chapter to discover amazing insights and knowledge.
          </p>
        )}

        {chapter.imageUrl && (
          <Image
            src={chapter.imageUrl}
            alt={chapter.title}
            width={800}
            height={600}
            className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain mt-8 rounded-2xl border border-blog-border dark:border-slate-700"
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
    <div className="w-full h-full py-10 md:py-20 bg-blog-bg dark:bg-slate-900/50">
      <h2 className="max-w-7xl pl-4 mx-auto text-2xl md:text-5xl font-bold text-blog-text dark:text-white font-blog-display mb-4">
        Explore Your Learning Journey
      </h2>
      <p className="max-w-7xl pl-4 mx-auto text-base md:text-xl text-blog-text-muted dark:text-slate-400 font-blog-body mb-8">
        Swipe through the chapters and click to dive deep into each topic.
      </p>
      <Carousel items={cards} />
    </div>
  );
};

export default CardModeReading;
