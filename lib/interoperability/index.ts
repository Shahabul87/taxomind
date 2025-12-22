/**
 * Taxomind LMS Interoperability Module
 *
 * Provides standards-compliant integration with external LMS platforms:
 * - xAPI (Experience API / Tin Can) for learning activity tracking
 * - QTI 2.1 for question/test import and export
 * - SCORM 2004 4th Edition for content packaging and runtime
 *
 * Standards Compliance:
 * - xAPI 1.0.3 (IEEE 9274.1.1)
 * - QTI 2.1 (IMS Global)
 * - SCORM 2004 4th Edition (ADL)
 */

// xAPI Exports
export {
  xAPIClient,
  TaxomindxAPIService,
  getxAPIService,
  XAPI_VERBS,
  XAPI_ACTIVITY_TYPES,
  type xAPIStatement,
  type xAPIActor,
  type xAPIVerb,
  type xAPIObject,
  type xAPIResult,
  type xAPIContext,
  type xAPIStatementQuery,
  type xAPIStatementResult,
  type xAPILRSConfig,
} from './xapi-client';

// QTI Exports
export {
  QTIExporter,
  QTIImporter,
  createQTIExporter,
  createQTIImporter,
  type TaxomindQuestion,
  type TaxomindExam,
  type QTIExportOptions,
} from './qti-exporter';

// SCORM Exports
export {
  SCORMWrapper,
  SCORMManifestGenerator,
  TaxomindSCORMService,
  taxomindSCORM,
  SCORMErrorCode,
  type SCORMDataModel,
  type SCORMInteraction,
  type SCORMObjective,
  type SCORMComment,
} from './scorm-wrapper';
