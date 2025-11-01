export const transformPostChapters = (chapters: any[]) => {
  return chapters.map(chapter => ({
    ...chapter,
    isPublished: chapter.isPublished ?? false,  // Provide default value of false if null
    isFree: chapter.isFree ?? false  // Also handle isFree for consistency
  }));
}; 