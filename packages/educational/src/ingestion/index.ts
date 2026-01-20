/**
 * Content Ingestion Pipeline - Main Export
 * Enhanced Depth Analysis - January 2026
 *
 * Provides content extraction and normalization for course materials.
 */

// Types
export * from './types';

// Extractors
export {
  PDFExtractor,
  pdfExtractor,
  SlideExtractor,
  slideExtractor,
  TextExtractor,
  textExtractor,
  AttachmentRouter,
  attachmentRouter,
  contentTypeUtils,
} from './extractors';

// Pipeline
export {
  ContentIngestionPipeline,
  createContentIngestionPipeline,
  PIPELINE_VERSION,
} from './ingestion-pipeline';

// Store
export {
  PrismaContentSourceStore,
  createPrismaContentSourceStore,
} from './prisma-content-source-store';
