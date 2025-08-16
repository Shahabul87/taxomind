import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const CommentPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  // Create array of page numbers to show
  const getPageNumbers = () => {
    // Always show first page, last page, and pages around current
    const pageNumbers: (number | string)[] = [];
    
    // Always add page 1
    pageNumbers.push(1);
    
    // If we're not at the beginning, we need an ellipsis or page 2
    if (currentPage > 3) {
      pageNumbers.push("...");
    } else if (currentPage > 2) {
      pageNumbers.push(2);
    }
    
    // Add the page before current (if valid)
    if (currentPage > 1 && currentPage - 1 > 1) {
      pageNumbers.push(currentPage - 1);
    }
    
    // Add the current page (if not 1 or last)
    if (currentPage !== 1 && currentPage !== totalPages) {
      pageNumbers.push(currentPage);
    }
    
    // Add the page after current (if valid)
    if (currentPage < totalPages && currentPage + 1 < totalPages) {
      pageNumbers.push(currentPage + 1);
    }
    
    // If we're not at the end, we need an ellipsis or the page before last
    if (currentPage < totalPages - 2) {
      pageNumbers.push("...");
    } else if (currentPage < totalPages - 1) {
      pageNumbers.push(totalPages - 1);
    }
    
    // Always add the last page (if different from 1)
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    // Remove duplicates
    return [...new Set(pageNumbers)];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center mt-8 gap-2">
      {/* Previous button */}
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        size="sm"
        className="px-2"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Page numbers */}
      {pageNumbers.map((page, index) => {
        // Render ellipsis
        if (page === "...") {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
              ...
            </span>
          );
        }
        
        // Render page button
        return (
          <Button
            key={`page-${page}`}
            onClick={() => onPageChange(page as number)}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className="w-8 h-8 p-0"
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </Button>
        );
      })}
      
      {/* Next button */}
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
        size="sm"
        className="px-2"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}; 