/**
 * @sam-ai/adapter-taxomind - Taxomind Integration Profile
 * Complete profile configuration for Taxomind LMS
 */
import { type IntegrationProfile, type EntityMappings, type ToolConfigurations, type DataSourceConfiguration } from '@sam-ai/integration';
/**
 * Entity mappings for Taxomind Prisma models
 */
export declare const taxomindEntityMappings: EntityMappings;
/**
 * Tool configurations for Taxomind
 */
export declare const taxomindToolConfigurations: ToolConfigurations;
/**
 * Data source configurations for Taxomind
 */
export declare const taxomindDataSources: DataSourceConfiguration[];
/**
 * Create the complete Taxomind integration profile
 */
export declare function createTaxomindIntegrationProfile(options?: {
    isDevelopment?: boolean;
    region?: string;
}): IntegrationProfile;
export declare const TAXOMIND_PROFILE_ID = "taxomind-lms";
export declare const TAXOMIND_PROFILE_VERSION = "1.0.0";
//# sourceMappingURL=taxomind-profile.d.ts.map