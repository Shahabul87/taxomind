import { FileText, Clock, Calendar, User, ExternalLink, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ArticleContentProps {
  articles: Array<{
    id: string;
    title: string;
    content?: string | null;
    summary?: string | null;
    author?: string | null;
    publishedAt?: Date | null;
    readTime?: number | null;
    category?: string | null;
    tags?: string[];
    wordCount?: number | null;
  }>;
}

export const ArticleContent = ({ articles }: ArticleContentProps) => {
  const formatDate = (date?: Date | null) => {
    if (!date) return "No date";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatReadTime = (minutes?: number | null) => {
    if (!minutes) return "5 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  const formatWordCount = (words?: number | null) => {
    if (!words) return "~500 words";
    if (words >= 1000) return `${(words / 1000).toFixed(1)}K words`;
    return `${words} words`;
  };

  const getSummary = (content?: string | null, summary?: string | null) => {
    if (summary) return summary;
    if (content) {
      // Extract first 200 characters and add ellipsis
      const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
      return text.length > 200 ? text.substring(0, 200) + '...' : text;
    }
    return "No summary available for this article.";
  };

  const getCategoryColor = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case "tutorial":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "guide":
        return "bg-green-50 text-green-700 border-green-200";
      case "reference":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "news":
        return "bg-red-50 text-red-700 border-red-200";
      case "opinion":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Articles Available
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Article content will appear here when available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Articles ({articles.length})
        </h3>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          <FileText className="w-3 h-3 mr-1" />
          Articles
        </Badge>
      </div>

      <div className="grid gap-6">
        {articles.map((article, index) => (
          <Card key={article.id} className="group hover:shadow-lg transition-all duration-200 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {article.category && (
                      <Badge variant="outline" className={`text-xs ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                      Article {index + 1}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-3">
                    {article.title}
                  </h4>
                  
                  {/* Article Metadata */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    {article.author && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{article.author}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatReadTime(article.readTime)}</span>
                    </div>
                    {article.wordCount && (
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{formatWordCount(article.wordCount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Article Summary */}
              <div className="mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {getSummary(article.content, article.summary)}
                </p>
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 4).map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                        #{tag}
                      </Badge>
                    ))}
                    {article.tags.length > 4 && (
                      <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                        +{article.tags.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Reading Progress Indicator */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Reading Progress</span>
                  <span>Not started</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 p-0"
                >
                  Read article
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
                
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatReadTime(article.readTime)} read
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}; 