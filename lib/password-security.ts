/**
 * Password Security Utilities
 * Enterprise-grade password validation and management
 */

import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

interface PasswordStrengthResult {
  score: number;        // 0-5 score
  feedback: string[];   // Feedback messages
  valid: boolean;       // Whether password meets requirements
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
}

export class PasswordSecurity {
  // Minimum requirements
  private static readonly MIN_LENGTH = 12;
  private static readonly MIN_UPPERCASE = 1;
  private static readonly MIN_LOWERCASE = 1;
  private static readonly MIN_NUMBERS = 1;
  private static readonly MIN_SPECIAL = 1;
  private static readonly SALT_ROUNDS = 12;
  
  // Common weak passwords to check against
  private static readonly COMMON_PASSWORDS = [
    'password123', 'admin123', 'letmein', 'welcome123', 'password',
    '12345678', 'qwerty', 'abc123', '123456789', 'password1',
    'iloveyou', 'welcome', 'monkey', 'dragon', 'master'
  ];

  /**
   * Hash a password
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  static validateStrength(password: string, username?: string, email?: string): PasswordStrengthResult {
    let score = 0;
    const feedback: string[] = [];
    
    // Check length
    if (password.length < this.MIN_LENGTH) {
      feedback.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    } else {
      score++;
      if (password.length >= 16) score++;
      if (password.length >= 20) score++;
    }
    
    // Check for uppercase letters
    const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
    if (uppercaseCount < this.MIN_UPPERCASE) {
      feedback.push(`Include at least ${this.MIN_UPPERCASE} uppercase letter(s)`);
    } else {
      score += 0.5;
      if (uppercaseCount >= 3) score += 0.5;
    }
    
    // Check for lowercase letters
    const lowercaseCount = (password.match(/[a-z]/g) || []).length;
    if (lowercaseCount < this.MIN_LOWERCASE) {
      feedback.push(`Include at least ${this.MIN_LOWERCASE} lowercase letter(s)`);
    } else {
      score += 0.5;
      if (lowercaseCount >= 3) score += 0.5;
    }
    
    // Check for numbers
    const numberCount = (password.match(/[0-9]/g) || []).length;
    if (numberCount < this.MIN_NUMBERS) {
      feedback.push(`Include at least ${this.MIN_NUMBERS} number(s)`);
    } else {
      score += 0.5;
      if (numberCount >= 3) score += 0.5;
    }
    
    // Check for special characters
    const specialCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
    if (specialCount < this.MIN_SPECIAL) {
      feedback.push(`Include at least ${this.MIN_SPECIAL} special character(s)`);
    } else {
      score += 0.5;
      if (specialCount >= 3) score += 0.5;
    }
    
    // Check for common passwords
    const lowerPassword = password.toLowerCase();
    if (this.COMMON_PASSWORDS.includes(lowerPassword)) {
      feedback.push('This password is too common. Please choose a unique password');
      score = Math.max(0, score - 2);
    }
    
    // Check for sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
      feedback.push('Avoid sequential letters');
      score = Math.max(0, score - 0.5);
    }
    
    if (/(?:012|123|234|345|456|567|678|789|890)/i.test(password)) {
      feedback.push('Avoid sequential numbers');
      score = Math.max(0, score - 0.5);
    }
    
    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeating characters');
      score = Math.max(0, score - 0.5);
    }
    
    // Check if password contains username or email
    if (username && password.toLowerCase().includes(username.toLowerCase())) {
      feedback.push('Password should not contain your username');
      score = Math.max(0, score - 1);
    }
    
    if (email) {
      const emailPrefix = email.split('@')[0];
      if (password.toLowerCase().includes(emailPrefix.toLowerCase())) {
        feedback.push('Password should not contain parts of your email');
        score = Math.max(0, score - 1);
      }
    }
    
    // Calculate final score (max 5)
    score = Math.min(5, Math.max(0, score));
    
    // Determine strength level
    let strength: PasswordStrengthResult['strength'];
    if (score < 2) strength = 'weak';
    else if (score < 3) strength = 'fair';
    else if (score < 4) strength = 'good';
    else if (score < 4.5) strength = 'strong';
    else strength = 'excellent';
    
    // Check if password meets minimum requirements
    const valid = feedback.length === 0 && score >= 3;
    
    // Add encouragement for strong passwords
    if (score >= 4.5) {
      feedback.push('Excellent password strength!');
    } else if (score >= 4) {
      feedback.push('Strong password! Consider adding more unique characters for maximum security.');
    } else if (score >= 3 && valid) {
      feedback.push('Good password strength.');
    }
    
    return {
      score,
      feedback,
      valid,
      strength
    };
  }

  /**
   * Check if password has been used before
   */
  static async hasBeenUsedBefore(userId: string, password: string, limit: number = 5): Promise<boolean> {
    try {
      const passwordHistories = await db.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      
      for (const history of passwordHistories) {
        if (await this.verify(password, history.hashedPassword)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking password history:', error);
      return false;
    }
  }

  /**
   * Save password to history
   */
  static async saveToHistory(userId: string, hashedPassword: string): Promise<void> {
    try {
      await db.passwordHistory.create({
        data: {
          userId,
          hashedPassword
        }
      });
      
      // Keep only the last 10 passwords
      const histories = await db.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 10
      });
      
      if (histories.length > 0) {
        await db.passwordHistory.deleteMany({
          where: {
            id: {
              in: histories.map(h => h.id)
            }
          }
        });
      }
    } catch (error) {
      console.error('Error saving password to history:', error);
    }
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + special;
    let password = '';
    
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check if password needs to be changed (based on age)
   */
  static async shouldChangePassword(userId: string, maxAgeDays: number = 90): Promise<boolean> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { passwordChangedAt: true }
      });
      
      if (!user?.passwordChangedAt) {
        return true; // No record of password change
      }
      
      const daysSinceChange = Math.floor(
        (Date.now() - user.passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return daysSinceChange > maxAgeDays;
    } catch (error) {
      console.error('Error checking password age:', error);
      return false;
    }
  }

  /**
   * Update password with security checks
   */
  static async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get user
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { password: true, email: true, name: true }
      });
      
      if (!user?.password) {
        return { success: false, message: 'User not found' };
      }
      
      // Verify current password
      const isValid = await this.verify(currentPassword, user.password);
      if (!isValid) {
        // Log failed attempt
        await db.enhancedAuditLog.create({
          data: {
            userId,
            action: 'PASSWORD_CHANGE_FAILED',
            resource: 'AUTH',
            severity: 'WARNING',
            metadata: { reason: 'Invalid current password' }
          }
        });
        return { success: false, message: 'Current password is incorrect' };
      }
      
      // Validate new password strength
      const strength = this.validateStrength(newPassword, user.name || undefined, user.email || undefined);
      if (!strength.valid) {
        return { 
          success: false, 
          message: `Password does not meet requirements: ${strength.feedback.join(', ')}` 
        };
      }
      
      // Check if password has been used before
      const hasBeenUsed = await this.hasBeenUsedBefore(userId, newPassword);
      if (hasBeenUsed) {
        return { 
          success: false, 
          message: 'This password has been used recently. Please choose a different password.' 
        };
      }
      
      // Hash new password
      const hashedPassword = await this.hash(newPassword);
      
      // Update password
      await db.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date()
        }
      });
      
      // Save to password history
      await this.saveToHistory(userId, hashedPassword);
      
      // Audit log
      await db.enhancedAuditLog.create({
        data: {
          userId,
          action: 'PASSWORD_CHANGED',
          resource: 'AUTH',
          metadata: { strength: strength.strength }
        }
      });
      
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Error updating password:', error);
      return { success: false, message: 'Failed to update password' };
    }
  }
}

/**
 * Password strength indicator component helper
 */
export function getPasswordStrengthColor(strength: PasswordStrengthResult['strength']): string {
  switch (strength) {
    case 'weak': return 'red';
    case 'fair': return 'orange';
    case 'good': return 'yellow';
    case 'strong': return 'green';
    case 'excellent': return 'emerald';
    default: return 'gray';
  }
}

export function getPasswordStrengthWidth(score: number): string {
  return `${(score / 5) * 100}%`;
}