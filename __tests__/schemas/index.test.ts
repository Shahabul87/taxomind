import * as z from 'zod';
import { LoginSchema, RegisterSchema, ResetSchema } from '@/schemas';

describe('Schemas', () => {
  describe('LoginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const result = LoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };
      
      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };
      
      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'new@example.com',
        password: 'Password123!', // Complex password with uppercase, lowercase, number, and special char
        name: 'Test User',
        acceptTermsAndPrivacy: true,
      };

      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject registration without name', () => {
      const validData = {
        email: 'new@example.com',
        password: 'Password123!',
      };
      
      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(false); // Name is required in RegisterSchema
    });
  });

  describe('ResetSchema', () => {
    it('should validate email for password reset', () => {
      const validData = {
        email: 'reset@example.com',
      };
      
      const result = ResetSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});