import parse from 'html-react-parser';

// Utility function to clean and format HTML content
export const cleanHtmlContent = (htmlString: string | null): string => {
  if (!htmlString) return '';
  
  return htmlString
    .replace(/<br\s*\/?>/gi, '\n')           // Convert <br> tags to line breaks
    .replace(/<\/p>/gi, '\n\n')              // Convert </p> to double line breaks
    .replace(/<p[^>]*>/gi, '')               // Remove <p> opening tags
    .replace(/<[^>]*>/g, '')                 // Remove all other HTML tags
    .replace(/&nbsp;/g, ' ')                 // Replace &nbsp; with regular spaces
    .replace(/&amp;/g, '&')                  // Replace &amp; with &
    .replace(/&lt;/g, '<')                   // Replace &lt; with <
    .replace(/&gt;/g, '>')                   // Replace &gt; with >
    .replace(/&quot;/g, '"')                 // Replace &quot; with "
    .replace(/&#39;/g, "'")                  // Replace &#39; with '
    .replace(/\n\s*\n\s*\n/g, '\n\n')        // Replace multiple line breaks with double
    .trim();                                 // Remove leading/trailing whitespace
};

// Enhanced HTML parser for rich content
export const parseHtmlContent = (htmlString: string | null) => {
  if (!htmlString) return null;
  
  // Clean up common HTML entities and formatting
  const cleanedHtml = htmlString
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  return parse(cleanedHtml);
}; 