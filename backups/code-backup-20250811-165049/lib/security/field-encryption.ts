import { dataEncryption, type EncryptedData } from './encryption';

/**
 * Field-level encryption for PII and sensitive data
 * 
 * Features:
 * - Transparent encryption/decryption for database fields
 * - PII detection and automatic encryption
 * - Search-friendly encrypted fields with hashing
 * - Batch operations for performance
 * - Audit logging for sensitive operations
 * 
 * @example
 * ```typescript
 * const fieldEncryption = new FieldEncryption();
 * 
 * // Encrypt user data
 * const encryptedUser = await fieldEncryption.encryptUserFields({
 *   email: 'user@example.com',
 *   phone: '+1234567890',
 *   ssn: '123-45-6789'
 * });
 * 
 * // Decrypt user data
 * const decryptedUser = await fieldEncryption.decryptUserFields(encryptedUser);
 * ```
 */

// PII field definitions
export const PII_FIELDS = {
  // Personal identifiers
  email: { encrypted: true, searchable: true, piiLevel: 'high' },
  phone: { encrypted: true, searchable: true, piiLevel: 'high' },
  ssn: { encrypted: true, searchable: false, piiLevel: 'critical' },
  
  // Financial information
  creditCardNumber: { encrypted: true, searchable: false, piiLevel: 'critical' },
  bankAccount: { encrypted: true, searchable: false, piiLevel: 'critical' },
  taxId: { encrypted: true, searchable: false, piiLevel: 'critical' },
  
  // Personal information
  dateOfBirth: { encrypted: true, searchable: false, piiLevel: 'high' },
  address: { encrypted: true, searchable: true, piiLevel: 'medium' },
  emergencyContact: { encrypted: true, searchable: false, piiLevel: 'medium' },
  
  // Educational records
  transcripts: { encrypted: true, searchable: false, piiLevel: 'medium' },
  academicRecords: { encrypted: true, searchable: false, piiLevel: 'medium' },
  certifications: { encrypted: true, searchable: false, piiLevel: 'low' },
} as const;

export type PIIField = keyof typeof PII_FIELDS;
export type PIILevel = 'low' | 'medium' | 'high' | 'critical';

export interface EncryptedField {
  value: EncryptedData;
  hash?: string; // For searchable fields
  fieldType: PIIField;
  encryptedAt: Date;
  version: number;
}

export interface FieldEncryptionOptions {
  auditLog?: boolean;
  batchMode?: boolean;
  userId?: string;
  context?: string;
}

export class FieldEncryption {
  private version = 1; // For key rotation and format changes
  
  constructor() {
    this.validateConfiguration();
  }

  private validateConfiguration() {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      throw new Error('Field encryption requires ENCRYPTION_MASTER_KEY');
    }
  }

  /**
   * Encrypts a single field based on its PII classification
   */
  async encryptField(
    fieldName: PIIField,
    value: string,
    options: FieldEncryptionOptions = {}
  ): Promise<EncryptedField> {
    try {
      const fieldConfig = PII_FIELDS[fieldName];
      if (!fieldConfig) {
        throw new Error(`Unknown PII field: ${fieldName}`);
      }

      // Encrypt the value
      const encryptedValue = await dataEncryption.encrypt(value);
      
      // Generate search hash for searchable fields
      let hash: string | undefined;
      if (fieldConfig.searchable) {
        hash = dataEncryption.generateHash(value.toLowerCase().trim());
      }

      const encryptedField: EncryptedField = {
        value: encryptedValue,
        hash,
        fieldType: fieldName,
        encryptedAt: new Date(),
        version: this.version,
      };

      // Audit logging
      if (options.auditLog !== false) {
        await this.logFieldOperation('encrypt', fieldName, {
          userId: options.userId,
          context: options.context,
          piiLevel: fieldConfig.piiLevel,
        });
      }

      return encryptedField;
    } catch (error) {
      throw new Error(`Failed to encrypt field ${fieldName}: ${error.message}`);
    }
  }

  /**
   * Decrypts a single field
   */
  async decryptField(
    encryptedField: EncryptedField,
    options: FieldEncryptionOptions = {}
  ): Promise<string> {
    try {
      const decryptedValue = await dataEncryption.decrypt(encryptedField.value);

      // Audit logging for high-risk fields
      const fieldConfig = PII_FIELDS[encryptedField.fieldType];
      if (fieldConfig.piiLevel === 'critical' || fieldConfig.piiLevel === 'high') {
        if (options.auditLog !== false) {
          await this.logFieldOperation('decrypt', encryptedField.fieldType, {
            userId: options.userId,
            context: options.context,
            piiLevel: fieldConfig.piiLevel,
          });
        }
      }

      return decryptedValue;
    } catch (error) {
      throw new Error(`Failed to decrypt field ${encryptedField.fieldType}: ${error.message}`);
    }
  }

  /**
   * Encrypts multiple user fields at once
   */
  async encryptUserFields(
    userData: Record<string, any>,
    options: FieldEncryptionOptions = {}
  ): Promise<Record<string, EncryptedField | any>> {
    const encryptedData: Record<string, EncryptedField | any> = {};
    
    for (const [key, value] of Object.entries(userData)) {
      if (this.isPIIField(key) && value != null) {
        encryptedData[`${key}_encrypted`] = await this.encryptField(
          key as PIIField,
          String(value),
          options
        );
        // Remove original field for security
        // encryptedData[key] = undefined;
      } else {
        encryptedData[key] = value;
      }
    }

    return encryptedData;
  }

  /**
   * Decrypts multiple user fields at once
   */
  async decryptUserFields(
    encryptedUserData: Record<string, EncryptedField | any>,
    options: FieldEncryptionOptions = {}
  ): Promise<Record<string, any>> {
    const decryptedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(encryptedUserData)) {
      if (key.endsWith('_encrypted') && this.isEncryptedField(value)) {
        const originalFieldName = key.replace('_encrypted', '');
        decryptedData[originalFieldName] = await this.decryptField(
          value as EncryptedField,
          options
        );
      } else {
        decryptedData[key] = value;
      }
    }

    return decryptedData;
  }

  /**
   * Creates a searchable hash for encrypted fields
   */
  async createSearchHash(fieldName: PIIField, value: string): Promise<string> {
    const fieldConfig = PII_FIELDS[fieldName];
    if (!fieldConfig.searchable) {
      throw new Error(`Field ${fieldName} is not searchable`);
    }
    
    return dataEncryption.generateHash(value.toLowerCase().trim());
  }

  /**
   * Searches encrypted fields using hash comparison
   */
  async searchEncryptedField(
    fieldName: PIIField,
    searchValue: string,
    encryptedRecords: Array<{ [key: string]: EncryptedField }>
  ): Promise<Array<{ [key: string]: EncryptedField }>> {
    const fieldConfig = PII_FIELDS[fieldName];
    if (!fieldConfig.searchable) {
      throw new Error(`Field ${fieldName} is not searchable`);
    }

    const searchHash = await this.createSearchHash(fieldName, searchValue);
    
    return encryptedRecords.filter(record => {
      const encryptedField = record[`${fieldName}_encrypted`];
      return encryptedField?.hash === searchHash;
    });
  }

  /**
   * Bulk encryption for performance
   */
  async bulkEncryptFields(
    records: Array<Record<string, any>>,
    options: FieldEncryptionOptions = {}
  ): Promise<Array<Record<string, EncryptedField | any>>> {
    const batchOptions = { ...options, batchMode: true };
    
    return Promise.all(
      records.map(record => this.encryptUserFields(record, batchOptions))
    );
  }

  /**
   * Bulk decryption for performance
   */
  async bulkDecryptFields(
    encryptedRecords: Array<Record<string, EncryptedField | any>>,
    options: FieldEncryptionOptions = {}
  ): Promise<Array<Record<string, any>>> {
    const batchOptions = { ...options, batchMode: true };
    
    return Promise.all(
      encryptedRecords.map(record => this.decryptUserFields(record, batchOptions))
    );
  }

  /**
   * Key rotation for encrypted fields
   */
  async rotateFieldKeys(
    encryptedField: EncryptedField,
    newMasterKey: string
  ): Promise<EncryptedField> {
    // Decrypt with old key
    const decryptedValue = await dataEncryption.decrypt(encryptedField.value);
    
    // Re-encrypt with new key
    const newEncryption = await dataEncryption.rotateKey(
      encryptedField.value,
      newMasterKey
    );

    return {
      ...encryptedField,
      value: newEncryption,
      encryptedAt: new Date(),
      version: this.version + 1,
    };
  }

  /**
   * Validates if a field is classified as PII
   */
  private isPIIField(fieldName: string): fieldName is PIIField {
    return fieldName in PII_FIELDS;
  }

  /**
   * Type guard for encrypted field objects
   */
  private isEncryptedField(value: any): value is EncryptedField {
    return (
      value &&
      typeof value === 'object' &&
      'value' in value &&
      'fieldType' in value &&
      'encryptedAt' in value &&
      'version' in value
    );
  }

  /**
   * Audit logging for sensitive operations
   */
  private async logFieldOperation(
    operation: 'encrypt' | 'decrypt',
    fieldName: PIIField,
    metadata: {
      userId?: string;
      context?: string;
      piiLevel: PIILevel;
    }
  ) {
    // This would integrate with your audit logging system
    console.log(`[AUDIT] Field ${operation}: ${fieldName}`, {
      timestamp: new Date().toISOString(),
      operation,
      fieldName,
      piiLevel: metadata.piiLevel,
      userId: metadata.userId,
      context: metadata.context,
      version: this.version,
    });
    
    // TODO: Integrate with enterprise audit system
    // await auditLogger.log({
    //   action: `field_${operation}`,
    //   resource: `pii_field:${fieldName}`,
    //   userId: metadata.userId,
    //   metadata: {
    //     piiLevel: metadata.piiLevel,
    //     context: metadata.context,
    //   },
    // });
  }

  /**
   * Gets field configuration
   */
  getFieldConfig(fieldName: PIIField) {
    return PII_FIELDS[fieldName];
  }

  /**
   * Lists all PII fields by sensitivity level
   */
  getFieldsByPIILevel(level: PIILevel): PIIField[] {
    return Object.entries(PII_FIELDS)
      .filter(([_, config]) => config.piiLevel === level)
      .map(([fieldName]) => fieldName as PIIField);
  }

  /**
   * Validates field encryption configuration
   */
  validateFieldEncryption(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.ENCRYPTION_MASTER_KEY) {
      errors.push('ENCRYPTION_MASTER_KEY is required for field encryption');
    }

    // Check critical PII fields are properly configured
    const criticalFields = this.getFieldsByPIILevel('critical');
    if (criticalFields.length === 0) {
      errors.push('No critical PII fields configured');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Singleton instance for global use
 */
export const fieldEncryption = new FieldEncryption();

/**
 * Prisma middleware for automatic field encryption
 */
export function createEncryptionMiddleware() {
  return async (params: any, next: any) => {
    // Auto-encrypt on create/update operations
    if (params.action === 'create' || params.action === 'update') {
      if (params.args?.data) {
        params.args.data = await fieldEncryption.encryptUserFields(
          params.args.data,
          { auditLog: true }
        );
      }
    }

    // Auto-decrypt on find operations
    const result = await next(params);
    
    if (params.action.startsWith('find') && result) {
      if (Array.isArray(result)) {
        return fieldEncryption.bulkDecryptFields(result);
      } else {
        return fieldEncryption.decryptUserFields(result);
      }
    }

    return result;
  };
}

/**
 * Environment variables for field encryption:
 * 
 * ENCRYPTION_MASTER_KEY=your-256-bit-key-here (required)
 * FIELD_ENCRYPTION_ENABLED=true (optional, defaults to true)
 * PII_AUDIT_LOGGING=true (optional, defaults to true)
 */