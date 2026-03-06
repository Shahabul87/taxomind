import React from 'react';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter';

/**
 * Test suite for PasswordStrengthMeter component.
 *
 * The component evaluates passwords against 5 criteria:
 *   1. At least 12 characters
 *   2. Contains uppercase letter (A-Z)
 *   3. Contains lowercase letter (a-z)
 *   4. Contains number (0-9)
 *   5. Contains special character (!@#$%^&*)
 *
 * Met criteria count maps to strength levels:
 *   0 -> "Very Weak" (0%)
 *   1 -> "Weak" (20%)
 *   2 -> "Fair" (40%)
 *   3 -> "Good" (60%)
 *   4 -> "Strong" (80%)
 *   5 -> "Very Strong" (100%)
 *
 * framer-motion and lucide-react are mocked globally via jest.setup.js.
 *
 * The lucide-react mock renders SVGs. Due to the module resolution behavior
 * between the Proxy-based mock and SWC ESM interop, we distinguish met vs
 * unmet criteria by their visual indicators:
 *   - Met: Check icon with strokeWidth="3", wrapped in a bg-green-500 circle
 *   - Unmet: X icon with strokeWidth="2", wrapped in a bg-gray-300 circle
 */

// ---------------------------------------------------------------------------
// Criterion labels exactly as they appear in the component source
// ---------------------------------------------------------------------------
const CRITERION_LABELS = [
  'At least 12 characters',
  'Contains uppercase letter (A-Z)',
  'Contains lowercase letter (a-z)',
  'Contains number (0-9)',
] as const;

// The special character label contains & which is rendered as &amp; in HTML
// but RTL's getByText handles this correctly
const SPECIAL_CHAR_LABEL = 'Contains special character (!@#$%^&*)';

const ALL_LABELS = [...CRITERION_LABELS, SPECIAL_CHAR_LABEL];

// ---------------------------------------------------------------------------
// Test data factory - passwords that meet a precise number of criteria
// ---------------------------------------------------------------------------
interface PasswordFixture {
  password: string;
  metCount: number;
  label: string;
  percent: number;
  description: string;
}

const PASSWORD_FIXTURES: PasswordFixture[] = [
  {
    password: '!!!',
    metCount: 1,
    label: 'Weak',
    percent: 20,
    description: 'only special characters (1 criterion: special)',
  },
  {
    password: 'a',
    metCount: 1,
    label: 'Weak',
    percent: 20,
    description: 'only lowercase (1 criterion: lowercase)',
  },
  {
    password: 'aA',
    metCount: 2,
    label: 'Fair',
    percent: 40,
    description: 'lower + upper (2 criteria)',
  },
  {
    password: 'aA1',
    metCount: 3,
    label: 'Good',
    percent: 60,
    description: 'lower + upper + number (3 criteria)',
  },
  {
    password: 'aA1!',
    metCount: 4,
    label: 'Strong',
    percent: 80,
    description: 'lower + upper + number + special (4 criteria)',
  },
  {
    password: 'aA1!longpasswd',
    metCount: 5,
    label: 'Very Strong',
    percent: 100,
    description: 'all 5 criteria met (12+ chars, upper, lower, number, special)',
  },
];

// ---------------------------------------------------------------------------
// Helpers: count met/unmet criteria via their visual DOM indicators.
//
// The component wraps each icon in a circle div:
//   - Met: class includes "bg-green-500" and the icon has strokeWidth=3
//   - Unmet: class includes "bg-gray-300" and the icon has strokeWidth=2
// ---------------------------------------------------------------------------
function countMetCriteria(container: HTMLElement): number {
  // Met criteria have a wrapper div with bg-green-500 class
  return container.querySelectorAll(
    '.flex-shrink-0.w-5.h-5.rounded-full.flex.items-center.justify-center.bg-green-500',
  ).length;
}

function countUnmetCriteria(container: HTMLElement): number {
  // Unmet criteria have a wrapper div with bg-gray-300 class
  return container.querySelectorAll(
    '.flex-shrink-0.w-5.h-5.rounded-full.flex.items-center.justify-center.bg-gray-300',
  ).length;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PasswordStrengthMeter', () => {
  // -----------------------------------------------------------------------
  // 1. Empty password returns null (component renders nothing)
  // -----------------------------------------------------------------------
  it('returns null when the password is an empty string', () => {
    const { container } = render(<PasswordStrengthMeter password="" />);
    expect(container.firstChild).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 2. Static labels are always visible for non-empty passwords
  // -----------------------------------------------------------------------
  it('displays the "Password Strength" label', () => {
    render(<PasswordStrengthMeter password="x" />);
    expect(screen.getByText('Password Strength')).toBeInTheDocument();
  });

  it('displays the "Password must contain:" label', () => {
    render(<PasswordStrengthMeter password="x" />);
    expect(screen.getByText('Password must contain:')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 3. All 5 criterion labels are rendered
  // -----------------------------------------------------------------------
  it('displays all 5 criterion labels', () => {
    render(<PasswordStrengthMeter password="x" />);

    ALL_LABELS.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 4. Strength level labels, progress bar, and icon counts
  // -----------------------------------------------------------------------
  describe.each(PASSWORD_FIXTURES)(
    'when password is "$password" ($description)',
    ({ password, metCount, label }) => {
      it(`shows strength label "${label}"`, () => {
        render(<PasswordStrengthMeter password={password} />);
        expect(screen.getByText(label)).toBeInTheDocument();
      });

      it(`renders ${metCount} met and ${5 - metCount} unmet criteria indicators`, () => {
        const { container } = render(
          <PasswordStrengthMeter password={password} />,
        );

        expect(countMetCriteria(container)).toBe(metCount);
        expect(countUnmetCriteria(container)).toBe(5 - metCount);
      });

      it('renders a progress bar track', () => {
        const { container } = render(
          <PasswordStrengthMeter password={password} />,
        );

        // The progress bar track has h-2, bg-gray-200, rounded-full classes
        const progressTrack = container.querySelector(
          '.h-2.bg-gray-200.rounded-full.overflow-hidden',
        );
        expect(progressTrack).toBeInTheDocument();
      });
    },
  );

  // -----------------------------------------------------------------------
  // 5. "Very Weak" level (0 criteria met) - special case
  // -----------------------------------------------------------------------
  it('shows "Very Weak" with 0% for a password meeting zero criteria', () => {
    // "+" meets no criteria: not 12 chars, no upper, no lower, no digit, not in [!@#$%^&*]
    render(<PasswordStrengthMeter password="+" />);
    expect(screen.getByText('Very Weak')).toBeInTheDocument();
  });

  it('shows all 5 unmet indicators for a password meeting zero criteria', () => {
    const { container } = render(<PasswordStrengthMeter password="+" />);
    expect(countMetCriteria(container)).toBe(0);
    expect(countUnmetCriteria(container)).toBe(5);
  });

  // -----------------------------------------------------------------------
  // 6. Individual criterion met/unmet verification
  // -----------------------------------------------------------------------
  describe('individual criteria evaluation', () => {
    it('marks only lowercase as met for password "a"', () => {
      const { container } = render(<PasswordStrengthMeter password="a" />);
      expect(countMetCriteria(container)).toBe(1);
      expect(countUnmetCriteria(container)).toBe(4);
    });

    it('marks only uppercase as met for password "A"', () => {
      const { container } = render(<PasswordStrengthMeter password="A" />);
      expect(countMetCriteria(container)).toBe(1);
      expect(countUnmetCriteria(container)).toBe(4);
    });

    it('marks only number as met for password "5"', () => {
      const { container } = render(<PasswordStrengthMeter password="5" />);
      expect(countMetCriteria(container)).toBe(1);
      expect(countUnmetCriteria(container)).toBe(4);
    });

    it('marks only special character as met for password "!"', () => {
      const { container } = render(<PasswordStrengthMeter password="!" />);
      expect(countMetCriteria(container)).toBe(1);
      expect(countUnmetCriteria(container)).toBe(4);
    });

    it('marks only length as met for password of 12 spaces', () => {
      // 12 spaces: meets length but none of the regex criteria
      const { container } = render(
        <PasswordStrengthMeter password="            " />,
      );
      expect(countMetCriteria(container)).toBe(1);
      expect(countUnmetCriteria(container)).toBe(4);
    });
  });

  // -----------------------------------------------------------------------
  // 7. Boundary: exactly 11 characters does not meet length criterion
  // -----------------------------------------------------------------------
  it('does not meet length criterion for an 11-character password', () => {
    // "aA1!1234567" is 11 chars: meets lower, upper, number, special but NOT length
    const password = 'aA1!1234567';
    expect(password.length).toBe(11);

    const { container } = render(
      <PasswordStrengthMeter password={password} />,
    );

    // 4 criteria met (all except length)
    expect(countMetCriteria(container)).toBe(4);
    expect(countUnmetCriteria(container)).toBe(1);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 8. Boundary: exactly 12 characters meets length criterion
  // -----------------------------------------------------------------------
  it('meets length criterion for a 12-character password', () => {
    // "aA1!12345678" is 12 chars: meets all 5 criteria
    const password = 'aA1!12345678';
    expect(password.length).toBe(12);

    const { container } = render(
      <PasswordStrengthMeter password={password} />,
    );

    expect(countMetCriteria(container)).toBe(5);
    expect(countUnmetCriteria(container)).toBe(0);
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 9. Special characters: each recognized special char works
  // -----------------------------------------------------------------------
  describe('special character recognition', () => {
    const SPECIAL_CHARS = ['!', '@', '#', '$', '%', '^', '&', '*'];

    it.each(SPECIAL_CHARS)(
      'recognizes "%s" as a special character',
      (char) => {
        const { container } = render(
          <PasswordStrengthMeter password={char} />,
        );

        // The special character criterion should be met (at least 1 green indicator)
        expect(countMetCriteria(container)).toBeGreaterThanOrEqual(1);
      },
    );

    it('does not recognize "+" as a special character', () => {
      // "+" is not in the set [!@#$%^&*]
      const { container } = render(<PasswordStrengthMeter password="+" />);

      // No criteria met
      expect(countMetCriteria(container)).toBe(0);
      expect(countUnmetCriteria(container)).toBe(5);
    });
  });

  // -----------------------------------------------------------------------
  // 10. Color classes applied to strength label
  // -----------------------------------------------------------------------
  describe('strength label color classes', () => {
    it('applies red text color for "Very Weak" (0 criteria met)', () => {
      render(<PasswordStrengthMeter password="+" />);
      const label = screen.getByText('Very Weak');
      expect(label.className).toContain('text-red-600');
    });

    it('applies red text color for "Weak" (1 criterion met)', () => {
      render(<PasswordStrengthMeter password="a" />);
      const label = screen.getByText('Weak');
      expect(label.className).toContain('text-red-600');
    });

    it('applies orange text color for "Fair" (2 criteria met)', () => {
      render(<PasswordStrengthMeter password="aA" />);
      const label = screen.getByText('Fair');
      expect(label.className).toContain('text-orange-600');
    });

    it('applies yellow text color for "Good" (3 criteria met)', () => {
      render(<PasswordStrengthMeter password="aA1" />);
      const label = screen.getByText('Good');
      expect(label.className).toContain('text-yellow-600');
    });

    it('applies blue text color for "Strong" (4 criteria met)', () => {
      render(<PasswordStrengthMeter password="aA1!" />);
      const label = screen.getByText('Strong');
      expect(label.className).toContain('text-blue-600');
    });

    it('applies green text color for "Very Strong" (5 criteria met)', () => {
      render(<PasswordStrengthMeter password="aA1!longpasswd" />);
      const label = screen.getByText('Very Strong');
      expect(label.className).toContain('text-green-600');
    });
  });

  // -----------------------------------------------------------------------
  // 11. Progress bar background color changes with strength
  // -----------------------------------------------------------------------
  describe('progress bar color classes', () => {
    it('uses bg-red-500 for "Very Weak"', () => {
      const { container } = render(
        <PasswordStrengthMeter password="+" />,
      );
      const progressBar = container.querySelector('.bg-red-500.rounded-full.h-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('uses bg-red-500 for "Weak"', () => {
      const { container } = render(
        <PasswordStrengthMeter password="a" />,
      );
      const progressBar = container.querySelector('.bg-red-500.rounded-full.h-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('uses bg-orange-500 for "Fair"', () => {
      const { container } = render(
        <PasswordStrengthMeter password="aA" />,
      );
      const progressBar = container.querySelector('.bg-orange-500.rounded-full.h-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('uses bg-yellow-500 for "Good"', () => {
      const { container } = render(
        <PasswordStrengthMeter password="aA1" />,
      );
      const progressBar = container.querySelector('.bg-yellow-500.rounded-full.h-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('uses bg-blue-500 for "Strong"', () => {
      const { container } = render(
        <PasswordStrengthMeter password="aA1!" />,
      );
      const progressBar = container.querySelector('.bg-blue-500.rounded-full.h-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('uses bg-green-500 for "Very Strong"', () => {
      const { container } = render(
        <PasswordStrengthMeter password="aA1!longpasswd" />,
      );
      const progressBar = container.querySelector('.bg-green-500.rounded-full.h-full');
      expect(progressBar).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 12. Criterion item visual state (green vs gray background)
  // -----------------------------------------------------------------------
  describe('criterion item visual indicators', () => {
    it('applies green background to met criteria icon wrappers', () => {
      const { container } = render(
        <PasswordStrengthMeter password="a" />,
      );

      // There should be exactly 1 green-bg circle (the met criterion: lowercase)
      const greenCircles = container.querySelectorAll(
        '.flex-shrink-0.w-5.h-5.rounded-full.flex.items-center.justify-center.bg-green-500',
      );
      expect(greenCircles.length).toBe(1);
    });

    it('applies gray background to unmet criteria icon wrappers', () => {
      const { container } = render(
        <PasswordStrengthMeter password="a" />,
      );

      // 4 unmet criteria should have gray backgrounds
      const grayCircles = container.querySelectorAll(
        '.flex-shrink-0.w-5.h-5.rounded-full.flex.items-center.justify-center.bg-gray-300',
      );
      expect(grayCircles.length).toBe(4);
    });
  });

  // -----------------------------------------------------------------------
  // 13. Met criterion text has green color and font-medium
  // -----------------------------------------------------------------------
  it('applies green text and font-medium to met criterion labels', () => {
    render(<PasswordStrengthMeter password="a" />);

    const lowercaseLabel = screen.getByText('Contains lowercase letter (a-z)');
    expect(lowercaseLabel.className).toContain('text-green-700');
    expect(lowercaseLabel.className).toContain('font-medium');
  });

  // -----------------------------------------------------------------------
  // 14. Unmet criterion text has gray color
  // -----------------------------------------------------------------------
  it('applies gray text to unmet criterion labels', () => {
    render(<PasswordStrengthMeter password="a" />);

    const uppercaseLabel = screen.getByText('Contains uppercase letter (A-Z)');
    expect(uppercaseLabel.className).toContain('text-gray-600');
  });

  // -----------------------------------------------------------------------
  // 15. Component re-renders correctly when password prop changes
  // -----------------------------------------------------------------------
  it('updates strength when password prop changes', () => {
    const { rerender } = render(<PasswordStrengthMeter password="a" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();

    rerender(<PasswordStrengthMeter password="aA1!longpasswd" />);
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
  });

  it('returns null when password changes from non-empty to empty', () => {
    const { container, rerender } = render(
      <PasswordStrengthMeter password="abc" />,
    );
    expect(container.firstChild).not.toBeNull();

    rerender(<PasswordStrengthMeter password="" />);
    expect(container.firstChild).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 16. Total criteria count always equals 5 for any non-empty password
  // -----------------------------------------------------------------------
  it('always renders exactly 5 criteria indicators for any non-empty password', () => {
    const testPasswords = ['a', 'AB', '123', '!@#', 'aA1!longpasswd', '+'];

    testPasswords.forEach((password) => {
      const { container, unmount } = render(
        <PasswordStrengthMeter password={password} />,
      );

      const totalIndicators = countMetCriteria(container) + countUnmetCriteria(container);
      expect(totalIndicators).toBe(5);

      unmount();
    });
  });

  // -----------------------------------------------------------------------
  // 17. Each SVG icon has the correct strokeWidth for met vs unmet
  // -----------------------------------------------------------------------
  describe('icon strokeWidth differentiation', () => {
    it('uses strokeWidth=3 for met criterion icons (Check)', () => {
      const { container } = render(
        <PasswordStrengthMeter password="a" />,
      );

      // The met criterion's icon wrapper has bg-green-500
      const metWrapper = container.querySelector(
        '.bg-green-500.flex-shrink-0',
      );
      expect(metWrapper).toBeInTheDocument();

      const svg = metWrapper?.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.getAttribute('stroke-width')).toBe('3');
    });

    it('uses strokeWidth=2 for unmet criterion icons (X)', () => {
      const { container } = render(
        <PasswordStrengthMeter password="a" />,
      );

      // The unmet criterion's icon wrapper has bg-gray-300
      const unmetWrapper = container.querySelector(
        '.bg-gray-300.flex-shrink-0',
      );
      expect(unmetWrapper).toBeInTheDocument();

      const svg = unmetWrapper?.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.getAttribute('stroke-width')).toBe('2');
    });
  });
});
