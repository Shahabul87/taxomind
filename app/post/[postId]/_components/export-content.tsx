"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, BookOpen, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface ExportContentProps {
  postId: string;
  title: string;
  author?: string;
  content: string;
  chapters?: Array<{
    id: string;
    title: string;
    content: string | null;
  }>;
}

export function ExportContent({
  postId,
  title,
  author,
  content,
  chapters = [],
}: ExportContentProps) {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Export as PDF
   */
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // Title
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      const titleLines = pdf.splitTextToSize(title, maxWidth);
      pdf.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 10 + 5;

      // Author
      if (author) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text(`By ${author}`, margin, yPosition);
        yPosition += 10;
      }

      // Date
      pdf.setFontSize(10);
      pdf.setTextColor(128);
      pdf.text(new Date().toLocaleDateString(), margin, yPosition);
      yPosition += 15;
      pdf.setTextColor(0);

      // Separator line
      pdf.setDrawColor(200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Content
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");

      // Process chapters
      for (const chapter of chapters) {
        // Check if we need a new page
        if (yPosition > pageHeight - margin - 20) {
          pdf.addPage();
          yPosition = margin;
        }

        // Chapter title
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        const chapterTitleLines = pdf.splitTextToSize(chapter.title, maxWidth);
        pdf.text(chapterTitleLines, margin, yPosition);
        yPosition += chapterTitleLines.length * 8 + 5;

        // Chapter content
        if (chapter.content) {
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");

          // Strip HTML tags and get plain text
          const plainText = stripHTML(chapter.content);
          const contentLines = pdf.splitTextToSize(plainText, maxWidth);

          for (const line of contentLines) {
            if (yPosition > pageHeight - margin - 10) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(line, margin, yPosition);
            yPosition += 6;
          }

          yPosition += 10; // Space after chapter
        }
      }

      // Footer on each page
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(128);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        pdf.text(title, margin, pageHeight - 10);
      }

      // Save PDF
      pdf.save(`${sanitizeFilename(title)}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export as EPUB
   */
  const exportToEPUB = async () => {
    setIsExporting(true);
    try {
      // Create EPUB structure
      const epubContent = generateEPUBContent({
        title,
        author: author || "Unknown",
        chapters,
      });

      // Create blob and download
      const blob = new Blob([epubContent], { type: "application/epub+zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizeFilename(title)}.epub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("EPUB exported successfully");
    } catch (error) {
      console.error("Error exporting EPUB:", error);
      toast.error("Failed to export EPUB");
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export as Markdown
   */
  const exportToMarkdown = () => {
    try {
      let markdown = `# ${title}\n\n`;

      if (author) {
        markdown += `*By ${author}*\n\n`;
      }

      markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;
      markdown += `---\n\n`;

      for (const chapter of chapters) {
        markdown += `## ${chapter.title}\n\n`;

        if (chapter.content) {
          // Convert HTML to markdown (basic conversion)
          const plainText = stripHTML(chapter.content);
          markdown += `${plainText}\n\n`;
        }
      }

      // Create blob and download
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizeFilename(title)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Markdown exported successfully");
    } catch (error) {
      console.error("Error exporting Markdown:", error);
      toast.error("Failed to export Markdown");
    }
  };

  /**
   * Export as plain text
   */
  const exportToText = () => {
    try {
      let text = `${title}\n`;
      text += `${"=".repeat(title.length)}\n\n`;

      if (author) {
        text += `By ${author}\n`;
      }

      text += `Exported on ${new Date().toLocaleDateString()}\n\n`;
      text += `${"─".repeat(50)}\n\n`;

      for (const chapter of chapters) {
        text += `${chapter.title}\n`;
        text += `${"-".repeat(chapter.title.length)}\n\n`;

        if (chapter.content) {
          const plainText = stripHTML(chapter.content);
          text += `${plainText}\n\n`;
        }
      }

      // Create blob and download
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizeFilename(title)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Text file exported successfully");
    } catch (error) {
      console.error("Error exporting text:", error);
      toast.error("Failed to export text");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="w-4 h-4 mr-2" />
          PDF Document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToEPUB}>
          <BookOpen className="w-4 h-4 mr-2" />
          EPUB E-book
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToMarkdown}>
          <FileText className="w-4 h-4 mr-2" />
          Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToText}>
          <FileText className="w-4 h-4 mr-2" />
          Plain Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Helper: Strip HTML tags
 */
function stripHTML(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

/**
 * Helper: Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()
    .substring(0, 50);
}

/**
 * Helper: Generate EPUB content
 */
function generateEPUBContent(data: {
  title: string;
  author: string;
  chapters: Array<{ id: string; title: string; content: string | null }>;
}): string {
  // Basic EPUB structure (simplified)
  let epub = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXML(data.title)}</dc:title>
    <dc:creator>${escapeXML(data.author)}</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>${new Date().toISOString()}</dc:date>
  </metadata>
  <manifest>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
`;

  data.chapters.forEach((chapter, index) => {
    epub += `    <item id="chapter${index}" href="chapter${index}.xhtml" media-type="application/xhtml+xml"/>\n`;
  });

  epub += `  </manifest>
  <spine>
`;

  data.chapters.forEach((chapter, index) => {
    epub += `    <itemref idref="chapter${index}"/>\n`;
  });

  epub += `  </spine>
</package>`;

  return epub;
}

/**
 * Helper: Escape XML
 */
function escapeXML(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
