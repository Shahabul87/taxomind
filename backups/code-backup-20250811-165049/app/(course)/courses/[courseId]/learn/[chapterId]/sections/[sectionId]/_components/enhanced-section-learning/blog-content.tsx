import { useState } from "react";
import { BookOpen, Clock, Calendar, User, ExternalLink, Filter, SortAsc, SortDesc, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BlogContentProps {
  blogs: Array<{
    id: string;
    title: string;
    content?: string | null;
    excerpt?: string | null;
    author?: string | null;
    publishedAt?: Date | null;
    readTime?: number | null;
    tags?: string[];
    featured?: boolean;
  }>;
}

export const BlogContent = ({ blogs }: BlogContentProps) => {
  const [sortBy, setSortBy] = useState<'title' | 'date' | 'readTime' | 'author'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterAuthor, setFilterAuthor] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterFeatured, setFilterFeatured] = useState<string>('all');

  const formatDate = (date?: Date | null) => {
    if (!date) return "No date";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatReadTime = (minutes?: number | null) => {
    if (!minutes) return "5 min read";
    return `${minutes} min read`;
  };

  const getExcerpt = (content?: string | null, excerpt?: string | null) => {
    if (excerpt) return excerpt;
    if (content) {
      // Extract first 120 characters and add ellipsis
      const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
      return text.length > 120 ? text.substring(0, 120) + '...' : text;
    }
    return "No preview available for this blog post.";
  };

  const handleBlogClick = (blog: any) => {
    // You can implement blog URL logic here - for now opening a placeholder
    const blogUrl = blog.url || `#blog-${blog.id}`;
    window.open(blogUrl, '_blank', 'noopener,noreferrer');
  };

  // Get unique authors and tags
  const authors = Array.from(new Set(blogs.map(b => b.author).filter(Boolean)));
  const allTags = blogs.flatMap(b => b.tags || []);
  const uniqueTags = Array.from(new Set(allTags)).sort();

  // Filter and sort blogs
  const filteredAndSortedBlogs = blogs
    .filter(blog => {
      if (filterAuthor !== 'all' && blog.author !== filterAuthor) return false;
      if (filterTag !== 'all' && (!blog.tags || !blog.tags.includes(filterTag))) return false;
      if (filterFeatured === 'featured' && !blog.featured) return false;
      if (filterFeatured === 'regular' && blog.featured) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'readTime':
          comparison = (a.readTime || 5) - (b.readTime || 5);
          break;
        case 'author':
          comparison = (a.author || '').localeCompare(b.author || '');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (blogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Blog Posts Available
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Blog content will appear here when available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Blog Articles ({filteredAndSortedBlogs.length})
        </h3>
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
          <BookOpen className="w-3 h-3 mr-1" />
          Blogs
        </Badge>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
        </div>

        {/* Author Filter */}
        {authors.length > 0 && (
          <Select value={filterAuthor} onValueChange={setFilterAuthor}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Author" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Authors</SelectItem>
              {authors.map(author => (
                <SelectItem key={author} value={author || ''}>
                  {author}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Tag Filter */}
        {uniqueTags.length > 0 && (
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {uniqueTags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Featured Filter */}
        <Select value={filterFeatured} onValueChange={setFilterFeatured}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Articles</SelectItem>
            <SelectItem value="featured">Featured Only</SelectItem>
            <SelectItem value="regular">Regular Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="readTime">Read Time</SelectItem>
            <SelectItem value="author">Author</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1"
        >
          {sortOrder === 'asc' ? (
            <SortAsc className="w-4 h-4" />
          ) : (
            <SortDesc className="w-4 h-4" />
          )}
          {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        </Button>
      </div>

      {/* Blog List */}
      <div className="space-y-2">
        {filteredAndSortedBlogs.map((blog, index) => (
          <div
            key={blog.id}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-all duration-200 cursor-pointer group"
            onClick={() => handleBlogClick(blog)}
          >
            <div className="flex items-center gap-4 flex-1">
              {/* Blog Number */}
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {index + 1}
              </div>

              {/* Blog Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors truncate">
                    {blog.title}
                  </h4>
                  {blog.featured && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  )}
                </div>
                
                {/* Excerpt */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                  {getExcerpt(blog.content, blog.excerpt)}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {blog.author && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{blog.author}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(blog.publishedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatReadTime(blog.readTime)}</span>
                  </div>
                </div>

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {blog.tags.slice(0, 3).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs bg-white dark:bg-gray-800 h-5">
                          {tag}
                        </Badge>
                      ))}
                      {blog.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800 h-5">
                          +{blog.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* External Link Icon */}
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredAndSortedBlogs.length === 0 && blogs.length > 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            No articles match your filters
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your filter criteria to see more results.
          </p>
        </div>
      )}
    </div>
  );
}; 