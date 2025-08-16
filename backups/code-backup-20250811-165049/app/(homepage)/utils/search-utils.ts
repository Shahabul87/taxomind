// Helper function to escape regex special characters
export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Function to highlight matching terms in text
export const highlightMatches = (text: string, query: string): string => {
  if (!query.trim()) return text;
  
  // Split query into words for more granular highlighting
  const terms = query.trim().toLowerCase().split(/\s+/).filter(term => term.length >= 2);
  
  // If no valid terms, return original text
  if (terms.length === 0) return text;
  
  let result = text;
  
  // First try to highlight the full query
  const fullQueryRegex = new RegExp(escapeRegExp(query.trim()), 'gi');
  result = result.replace(fullQueryRegex, match => `<mark class="bg-yellow-200 dark:bg-yellow-900 dark:text-white px-0.5 rounded-sm">${match}</mark>`);
  
  // Then highlight individual terms if they're not already within a highlight
  terms.forEach(term => {
    // Don't highlight terms that are part of already highlighted text
    const safeRegex = new RegExp(`(?<!<mark[^>]*>)(?!.*?</mark>)(${escapeRegExp(term)})(?![^<]*</mark>)`, 'gi');
    result = result.replace(safeRegex, match => `<mark class="bg-yellow-100 dark:bg-yellow-800/50 dark:text-gray-200 px-0.5 rounded-sm">${match}</mark>`);
  });
  
  return result;
}; 