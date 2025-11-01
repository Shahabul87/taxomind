/**
 * CSV Export Utility
 * Enterprise-grade CSV export with proper escaping and formatting
 */

import { Post } from "@/lib/types/post";
import { format } from "date-fns";

/**
 * Escape CSV field value
 * Handles quotes, commas, and newlines according to RFC 4180
 */
function escapeCSVField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If field contains quotes, commas, or newlines, it must be quoted
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    // Escape quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert posts array to CSV string
 */
export function convertPostsToCSV(posts: Post[]): string {
  // Define CSV headers
  const headers = [
    "ID",
    "Title",
    "Category",
    "Status",
    "Views",
    "Likes",
    "Comments",
    "Created Date",
    "Updated Date",
    "Description",
    "Image URL",
  ];

  // Create CSV rows
  const rows = posts.map((post) => {
    const status = post.published ? "Published" : "Draft";
    const createdDate = format(new Date(post.createdAt), "yyyy-MM-dd HH:mm:ss");
    const updatedDate = format(new Date(post.updatedAt), "yyyy-MM-dd HH:mm:ss");
    const description = post.description?.replace(/\n/g, " ").trim() || "";

    return [
      escapeCSVField(post.id),
      escapeCSVField(post.title),
      escapeCSVField(post.category || "Uncategorized"),
      escapeCSVField(status),
      escapeCSVField(post.views),
      escapeCSVField(post.likes?.length || post._count?.likes || 0),
      escapeCSVField(post.comments?.length || post._count?.comments || 0),
      escapeCSVField(createdDate),
      escapeCSVField(updatedDate),
      escapeCSVField(description),
      escapeCSVField(post.imageUrl || ""),
    ].join(",");
  });

  // Combine headers and rows
  return [headers.join(","), ...rows].join("\n");
}

/**
 * Download CSV file to user's browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export posts to CSV with automatic filename
 */
export function exportPostsToCSV(
  posts: Post[],
  options: {
    filename?: string;
    filterType?: "all" | "published" | "drafts";
  } = {}
): void {
  const { filename, filterType = "all" } = options;

  // Generate filename with timestamp
  const timestamp = format(new Date(), "yyyy-MM-dd_HHmmss");
  const defaultFilename = `posts_${filterType}_${timestamp}.csv`;
  const finalFilename = filename || defaultFilename;

  // Convert to CSV
  const csvContent = convertPostsToCSV(posts);

  // Download
  downloadCSV(csvContent, finalFilename);
}

/**
 * Export selected posts to CSV
 */
export function exportSelectedPostsToCSV(
  allPosts: Post[],
  selectedPostIds: string[]
): void {
  const selectedPosts = allPosts.filter((post) =>
    selectedPostIds.includes(post.id)
  );

  const timestamp = format(new Date(), "yyyy-MM-dd_HHmmss");
  const filename = `posts_selected_${selectedPosts.length}_${timestamp}.csv`;

  const csvContent = convertPostsToCSV(selectedPosts);
  downloadCSV(csvContent, filename);
}
