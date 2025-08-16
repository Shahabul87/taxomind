import { PreviewEditor } from "@/components/preview-editor";
import { db } from "@/lib/db";

async function getArticle(articleId: string) {
  const article = await db.article.findUnique({
    where: {
      id: articleId
    },
    select: {
      id: true,
      title: true,
      content: true,
      summary: true
    }
  });

  if (!article) {
    throw new Error("Article not found");
  }

  return article;
}

interface ArticlePageProps {
  params: Promise<{
    articleId: string;
  }>;
}

export default async function ArticlePage(props: ArticlePageProps) {
  const params = await props.params;
  const article = await getArticle(params.articleId);

  return (
    <div className="prose prose-invert max-w-none">
      <PreviewEditor content={article.content || article.summary || ''} />
    </div>
  );
} 