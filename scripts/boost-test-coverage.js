#!/usr/bin/env node

/**
 * Script to systematically boost test coverage to 20%
 * Creates and runs minimal tests for critical files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Coverage Boost Script...\n');

// High-impact test files to create
const testsToCreate = [
  {
    name: '__tests__/lib/utils.test.ts',
    content: `
import { cn } from '@/lib/utils';

describe('utils', () => {
  describe('cn function', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', { active: true, disabled: false })).toContain('active');
    });

    it('should handle arrays', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('should handle undefined and null', () => {
      expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
    });
  });
});
`
  },
  {
    name: '__tests__/lib/format.test.ts',
    content: `
import { formatPrice } from '@/lib/format';

describe('formatPrice', () => {
  it('should format price correctly', () => {
    expect(formatPrice(99.99)).toBe('$99.99');
    expect(formatPrice(0)).toBe('Free');
    expect(formatPrice(1000)).toBe('$1,000.00');
  });

  it('should handle null and undefined', () => {
    expect(formatPrice(null)).toBe('Free');
    expect(formatPrice(undefined)).toBe('Free');
  });
});
`
  },
  {
    name: '__tests__/schemas/index.test.ts',
    content: `
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

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
      };
      
      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'new@example.com',
        password: 'password123',
        name: 'Test User',
      };
      
      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow registration without name', () => {
      const validData = {
        email: 'new@example.com',
        password: 'password123',
      };
      
      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
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
`
  },
  {
    name: '__tests__/data/user.test.ts',
    content: `
import { getUserByEmail, getUserById } from '@/data/user';
import { db } from '@/lib/db';

jest.mock('@/lib/db');

describe('User Data Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null for non-existent email', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      (db.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(getUserByEmail('test@example.com')).rejects.toThrow('DB Error');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserById('user-1');

      expect(result).toEqual(mockUser);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });
});
`
  },
  {
    name: '__tests__/hooks/use-debounce.test.ts',
    content: `
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/use-debounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });
    
    // Value shouldn't change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on value change', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 },
      }
    );

    rerender({ value: 'first', delay: 1000 });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });

    rerender({ value: 'second', delay: 1000 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should still be initial because we reset the timer
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now should be 'second'
    expect(result.current).toBe('second');
  });
});
`
  },
  {
    name: '__tests__/components/ui/badge.test.tsx',
    content: `
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  it('renders with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText('Secondary')).toHaveClass('bg-secondary');

    rerender(<Badge variant="destructive">Destructive</Badge>);
    expect(screen.getByText('Destructive')).toHaveClass('bg-destructive');

    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline')).toHaveClass('border');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    
    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('custom-class');
  });
});
`
  },
  {
    name: '__tests__/components/ui/progress.test.tsx',
    content: `
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress } from '@/components/ui/progress';

describe('Progress Component', () => {
  it('renders with value', () => {
    const { container } = render(<Progress value={50} />);
    
    const progressBar = container.querySelector('[data-state]');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles 0% progress', () => {
    const { container } = render(<Progress value={0} />);
    
    const progressBar = container.querySelector('[data-state]');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles 100% progress', () => {
    const { container } = render(<Progress value={100} />);
    
    const progressBar = container.querySelector('[data-state]');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Progress value={50} className="custom-progress" />);
    
    expect(container.firstChild).toHaveClass('custom-progress');
  });

  it('handles undefined value', () => {
    const { container } = render(<Progress />);
    
    const progressBar = container.querySelector('[data-state]');
    expect(progressBar).toBeInTheDocument();
  });
});
`
  }
];

// Create test files
console.log('📝 Creating test files...\n');

testsToCreate.forEach(test => {
  const filePath = path.join(process.cwd(), test.name);
  const dir = path.dirname(filePath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write test file
  fs.writeFileSync(filePath, test.content.trim());
  console.log(`✅ Created: ${test.name}`);
});

console.log('\n🧪 Running tests with coverage...\n');

// Run tests with coverage
try {
  execSync('npm test -- --coverage --silent', {
    stdio: 'inherit',
    env: { ...process.env, CI: 'true' }
  });
} catch (error) {
  console.log('\n⚠️  Some tests failed, but coverage was still collected.\n');
}

// Read and display coverage summary
try {
  const coverageSummary = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'coverage', 'coverage-summary.json'), 'utf8')
  );
  
  const total = coverageSummary.total;
  
  console.log('\n📊 Coverage Results:\n');
  console.log(`  Statements: ${total.statements.pct}%`);
  console.log(`  Branches:   ${total.branches.pct}%`);
  console.log(`  Functions:  ${total.functions.pct}%`);
  console.log(`  Lines:      ${total.lines.pct}%`);
  
  const average = (total.statements.pct + total.branches.pct + total.functions.pct + total.lines.pct) / 4;
  
  console.log(`\n  Average:    ${average.toFixed(2)}%`);
  
  if (average >= 20) {
    console.log('\n✅ SUCCESS: Reached 20% coverage target!');
  } else {
    console.log(`\n⚠️  Still need ${(20 - average).toFixed(2)}% more coverage to reach target.`);
    console.log('\n💡 Next steps:');
    console.log('  1. Fix failing tests');
    console.log('  2. Add more unit tests for utilities');
    console.log('  3. Test more server actions');
    console.log('  4. Add component tests');
  }
  
} catch (error) {
  console.error('Could not read coverage summary:', error.message);
}

console.log('\n🎯 Coverage boost script completed!\n');