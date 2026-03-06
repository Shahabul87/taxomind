import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================

// Mock framer-motion with Proxy pattern to handle any motion element
jest.mock('framer-motion', () => {
  const ReactFM = require('react');
  const makeMotion = (tag: string) => {
    const Comp = ReactFM.forwardRef(
      ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLElement>) => {
        const {
          initial, animate, exit, transition, variants,
          whileHover, whileTap, whileInView, viewport,
          drag, dragConstraints, dragElastic,
          onAnimationStart, onAnimationComplete, layout, layoutId,
          ...htmlProps
        } = props;
        return ReactFM.createElement(tag, { ...htmlProps, ref }, children);
      },
    );
    Comp.displayName = `motion.${tag}`;
    return Comp;
  };
  return {
    motion: new Proxy(
      {},
      { get: (_t: Record<string, unknown>, prop: string) => makeMotion(prop) },
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn(), set: jest.fn() }),
    useMotionValue: (v: number) => ({ get: () => v, set: jest.fn(), subscribe: jest.fn() }),
    useInView: () => [null, true],
    useReducedMotion: () => false,
  };
});

// Mock lucide-react icons (uses the global mock from moduleNameMapper, but override here
// to ensure consistent data-testid naming in this test file)
jest.mock('lucide-react', () => {
  const ReactLR = require('react');
  const MockIcon = ReactLR.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<SVGSVGElement>) =>
      ReactLR.createElement('svg', { ref, 'data-testid': 'icon-default', 'aria-hidden': 'true', ...props }),
  );
  MockIcon.displayName = 'MockIcon';
  return new Proxy(
    {},
    {
      get: (_: Record<string, unknown>, name: string) => {
        if (name === '__esModule') return true;
        return MockIcon;
      },
    },
  );
});

// ============================================================================
// Import component under test AFTER mocks are set up
// ============================================================================

import {
  CelebrationOverlay,
  MiniCelebration,
  useCelebration,
  type CelebrationData,
  type CelebrationType,
} from '@/components/sam/CelebrationOverlay';

// ============================================================================
// Test Data Factories
// ============================================================================

function createCelebration(overrides: Partial<CelebrationData> = {}): CelebrationData {
  return {
    type: 'step_complete',
    title: 'Step Complete!',
    message: 'You finished a learning step.',
    ...overrides,
  };
}

const ALL_CELEBRATION_TYPES: CelebrationType[] = [
  'step_complete',
  'plan_complete',
  'goal_achieved',
  'streak_milestone',
  'level_up',
  'achievement_unlocked',
];

// ============================================================================
// Tests: CelebrationOverlay
// ============================================================================

describe('CelebrationOverlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // --------------------------------------------------------------------------
  // Visible / Hidden State
  // --------------------------------------------------------------------------

  describe('visible and hidden state', () => {
    it('renders nothing when celebration is null', () => {
      const onDismiss = jest.fn();
      const { container } = render(
        <CelebrationOverlay celebration={null} onDismiss={onDismiss} />,
      );
      // The component should produce no visible output
      expect(container.innerHTML).toBe('');
    });

    it('renders overlay content when celebration is provided', () => {
      const data = createCelebration({ title: 'Great Job!', message: 'You did it.' });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.getByText('Great Job!')).toBeInTheDocument();
      expect(screen.getByText('You did it.')).toBeInTheDocument();
    });

    it('shows dismiss hint text when visible', () => {
      const data = createCelebration();
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.getByText('Tap anywhere to continue')).toBeInTheDocument();
    });

    it('removes content when celebration transitions from data to null', () => {
      const data = createCelebration({ title: 'Completed' });
      const onDismiss = jest.fn();
      const { rerender } = render(
        <CelebrationOverlay celebration={data} onDismiss={onDismiss} />,
      );

      expect(screen.getByText('Completed')).toBeInTheDocument();

      rerender(<CelebrationOverlay celebration={null} onDismiss={onDismiss} />);

      expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Celebration Types
  // --------------------------------------------------------------------------

  describe('celebration types', () => {
    it.each(ALL_CELEBRATION_TYPES)(
      'renders correctly for celebration type "%s"',
      (type) => {
        const data = createCelebration({
          type,
          title: `Title for ${type}`,
          message: `Message for ${type}`,
        });
        const onDismiss = jest.fn();
        render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

        expect(screen.getByText(`Title for ${type}`)).toBeInTheDocument();
        expect(screen.getByText(`Message for ${type}`)).toBeInTheDocument();
      },
    );

    it('displays XP badge when xpEarned is provided and greater than zero', () => {
      const data = createCelebration({ xpEarned: 150 });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.getByText('+150 XP')).toBeInTheDocument();
    });

    it('does not display XP badge when xpEarned is zero', () => {
      const data = createCelebration({ xpEarned: 0 });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
    });

    it('does not display XP badge when xpEarned is undefined', () => {
      const data = createCelebration({ xpEarned: undefined });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
    });

    it('displays level badge for level_up celebration type', () => {
      const data = createCelebration({
        type: 'level_up',
        title: 'Level Up!',
        message: 'You reached a new level.',
        newLevel: 5,
      });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.getByText('Level 5')).toBeInTheDocument();
    });

    it('does not display level badge when type is level_up but newLevel is missing', () => {
      const data = createCelebration({
        type: 'level_up',
        title: 'Level Up!',
        message: 'You reached a new level.',
      });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.queryByText(/Level \d+/)).not.toBeInTheDocument();
    });

    it('does not display level badge for non-level_up types even if newLevel is set', () => {
      const data = createCelebration({
        type: 'step_complete',
        newLevel: 3,
      });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.queryByText('Level 3')).not.toBeInTheDocument();
    });

    it('displays streak badge for streak_milestone celebration type', () => {
      const data = createCelebration({
        type: 'streak_milestone',
        title: 'Streak!',
        message: 'Keep it up.',
        streakDays: 30,
      });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.getByText('30 Day Streak!')).toBeInTheDocument();
    });

    it('does not display streak badge when type is streak_milestone but streakDays is missing', () => {
      const data = createCelebration({
        type: 'streak_milestone',
        title: 'Streak!',
        message: 'Keep it up.',
      });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.queryByText(/Day Streak/)).not.toBeInTheDocument();
    });

    it('does not display streak badge for non-streak types even if streakDays is set', () => {
      const data = createCelebration({
        type: 'goal_achieved',
        streakDays: 10,
      });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.queryByText('10 Day Streak!')).not.toBeInTheDocument();
    });

    it('can display both XP and level for a level_up celebration', () => {
      const data = createCelebration({
        type: 'level_up',
        title: 'Level Up!',
        message: 'Amazing!',
        xpEarned: 500,
        newLevel: 10,
      });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.getByText('+500 XP')).toBeInTheDocument();
      expect(screen.getByText('Level 10')).toBeInTheDocument();
    });

    it('can display both XP and streak for a streak_milestone celebration', () => {
      const data = createCelebration({
        type: 'streak_milestone',
        title: 'Streak!',
        message: 'On fire!',
        xpEarned: 200,
        streakDays: 7,
      });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      expect(screen.getByText('+200 XP')).toBeInTheDocument();
      expect(screen.getByText('7 Day Streak!')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Dismiss Callback
  // --------------------------------------------------------------------------

  describe('dismiss callback', () => {
    it('calls onDismiss when backdrop (outer wrapper) is clicked', () => {
      const data = createCelebration({ title: 'Dismiss Me' });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      // The outermost motion.div has onClick={onDismiss}
      // The backdrop overlay div is the first child of the outer wrapper.
      // Clicking the backdrop fires the outer click handler.
      const backdropDiv = screen.getByText('Dismiss Me').closest('.fixed');
      expect(backdropDiv).toBeTruthy();
      fireEvent.click(backdropDiv!);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not call onDismiss when the card content is clicked (stopPropagation)', () => {
      const data = createCelebration({ title: 'Card Click' });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      // Clicking the title text inside the card should not dismiss
      // because the card has onClick={(e) => e.stopPropagation()}
      const cardContainer = screen.getByText('Card Click').closest('.max-w-sm');
      expect(cardContainer).toBeTruthy();
      fireEvent.click(cardContainer!);

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('does not call onDismiss when celebration is null', () => {
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={null} onDismiss={onDismiss} />);

      // Advance past default auto-dismiss time to ensure timer was not started
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Auto-Dismiss Timer
  // --------------------------------------------------------------------------

  describe('auto-dismiss timer', () => {
    it('auto-dismisses after the default 5000ms', () => {
      const data = createCelebration();
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      // Timer should not have fired yet
      act(() => {
        jest.advanceTimersByTime(4999);
      });
      expect(onDismiss).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('auto-dismisses after custom autoDismissMs', () => {
      const data = createCelebration();
      const onDismiss = jest.fn();
      render(
        <CelebrationOverlay celebration={data} onDismiss={onDismiss} autoDismissMs={2000} />,
      );

      act(() => {
        jest.advanceTimersByTime(1999);
      });
      expect(onDismiss).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not auto-dismiss when autoDismissMs is 0', () => {
      const data = createCelebration();
      const onDismiss = jest.fn();
      render(
        <CelebrationOverlay celebration={data} onDismiss={onDismiss} autoDismissMs={0} />,
      );

      act(() => {
        jest.advanceTimersByTime(30000);
      });
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('clears the timer when celebration changes to null before timeout', () => {
      const data = createCelebration();
      const onDismiss = jest.fn();
      const { rerender } = render(
        <CelebrationOverlay celebration={data} onDismiss={onDismiss} autoDismissMs={5000} />,
      );

      // Advance partway
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Remove the celebration
      rerender(<CelebrationOverlay celebration={null} onDismiss={onDismiss} autoDismissMs={5000} />);

      // Advance past the original timeout
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // onDismiss should NOT have been called since the timer was cleared
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('resets the timer when celebration data changes', () => {
      const data1 = createCelebration({ title: 'First' });
      const data2 = createCelebration({ title: 'Second' });
      const onDismiss = jest.fn();
      const { rerender } = render(
        <CelebrationOverlay celebration={data1} onDismiss={onDismiss} autoDismissMs={5000} />,
      );

      // Advance partway through the first timer
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(onDismiss).not.toHaveBeenCalled();

      // Switch to a new celebration - should reset the timer
      rerender(
        <CelebrationOverlay celebration={data2} onDismiss={onDismiss} autoDismissMs={5000} />,
      );

      // 3000ms into the second timer should not dismiss yet
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(onDismiss).not.toHaveBeenCalled();

      // Complete the second timer (2000ms more)
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // Confetti Particles
  // --------------------------------------------------------------------------

  describe('confetti particles', () => {
    it('generates confetti particles when celebration is shown', () => {
      const data = createCelebration();
      const onDismiss = jest.fn();
      const { container } = render(
        <CelebrationOverlay celebration={data} onDismiss={onDismiss} />,
      );

      // Confetti container has class "pointer-events-none" and children are
      // motion.div elements with confetti color classes
      const confettiContainer = container.querySelector('.pointer-events-none.overflow-hidden');
      expect(confettiContainer).toBeTruthy();

      // Should have 50 confetti particle divs
      const particles = confettiContainer!.querySelectorAll('div');
      expect(particles.length).toBe(50);
    });

    it('does not render confetti particles when celebration is null', () => {
      const onDismiss = jest.fn();
      const { container } = render(
        <CelebrationOverlay celebration={null} onDismiss={onDismiss} />,
      );

      const confettiContainer = container.querySelector('.pointer-events-none');
      expect(confettiContainer).toBeNull();
    });

    it('regenerates confetti when celebration changes', () => {
      const data1 = createCelebration({ title: 'First' });
      const data2 = createCelebration({ title: 'Second' });
      const onDismiss = jest.fn();
      const { container, rerender } = render(
        <CelebrationOverlay celebration={data1} onDismiss={onDismiss} />,
      );

      const confettiContainer1 = container.querySelector('.pointer-events-none.overflow-hidden');
      const particles1 = confettiContainer1!.querySelectorAll('div');
      expect(particles1.length).toBe(50);

      // Re-render with new celebration
      rerender(<CelebrationOverlay celebration={data2} onDismiss={onDismiss} />);

      const confettiContainer2 = container.querySelector('.pointer-events-none.overflow-hidden');
      const particles2 = confettiContainer2!.querySelectorAll('div');
      expect(particles2.length).toBe(50);
    });
  });

  // --------------------------------------------------------------------------
  // Message Display
  // --------------------------------------------------------------------------

  describe('message display', () => {
    it('renders the title from celebration data', () => {
      const data = createCelebration({ title: 'Amazing Achievement!' });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      const heading = screen.getByText('Amazing Achievement!');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('renders the message from celebration data', () => {
      const data = createCelebration({ message: 'You completed all tasks successfully.' });
      const onDismiss = jest.fn();
      render(<CelebrationOverlay celebration={data} onDismiss={onDismiss} />);

      const message = screen.getByText('You completed all tasks successfully.');
      expect(message).toBeInTheDocument();
      expect(message.tagName).toBe('P');
    });

    it('renders icons within the overlay', () => {
      const data = createCelebration({ type: 'goal_achieved' });
      const onDismiss = jest.fn();
      const { container } = render(
        <CelebrationOverlay celebration={data} onDismiss={onDismiss} />,
      );

      // The icon mock renders <svg data-testid="icon-default" />
      const icons = container.querySelectorAll('svg[data-testid="icon-default"]');
      // Should have at least one icon (the celebration icon, plus BurstStars icons)
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders burst star elements', () => {
      const data = createCelebration();
      const onDismiss = jest.fn();
      const { container } = render(
        <CelebrationOverlay celebration={data} onDismiss={onDismiss} />,
      );

      // BurstStars renders 12 star elements, each containing a Star icon (svg)
      // They are inside a div with class "pointer-events-none" that also has "flex items-center"
      const burstContainer = container.querySelector('.pointer-events-none.flex.items-center');
      expect(burstContainer).toBeTruthy();

      // Each burst star is a motion.div containing an svg icon
      const burstIcons = burstContainer!.querySelectorAll('svg');
      expect(burstIcons.length).toBe(12);
    });
  });

  // --------------------------------------------------------------------------
  // Backdrop and Layout
  // --------------------------------------------------------------------------

  describe('backdrop and layout', () => {
    it('renders with a fixed positioning overlay', () => {
      const data = createCelebration();
      const onDismiss = jest.fn();
      const { container } = render(
        <CelebrationOverlay celebration={data} onDismiss={onDismiss} />,
      );

      const fixedOverlay = container.querySelector('.fixed.inset-0');
      expect(fixedOverlay).toBeTruthy();
    });

    it('renders backdrop with blur class', () => {
      const data = createCelebration();
      const onDismiss = jest.fn();
      const { container } = render(
        <CelebrationOverlay celebration={data} onDismiss={onDismiss} />,
      );

      const backdrop = container.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeTruthy();
    });

    it('renders the card container with rounded corners and shadow', () => {
      const data = createCelebration();
      const onDismiss = jest.fn();
      const { container } = render(
        <CelebrationOverlay celebration={data} onDismiss={onDismiss} />,
      );

      const card = container.querySelector('.rounded-2xl.shadow-2xl');
      expect(card).toBeTruthy();
    });
  });
});

// ============================================================================
// Tests: useCelebration Hook
// ============================================================================

describe('useCelebration', () => {
  // Helper component to test the hook
  function TestHookComponent() {
    const { celebration, showCelebration, dismissCelebration } = useCelebration();
    return (
      <div>
        <span data-testid="hook-state">
          {celebration ? celebration.title : 'none'}
        </span>
        <button
          data-testid="show-btn"
          onClick={() =>
            showCelebration({
              type: 'goal_achieved',
              title: 'Goal Done!',
              message: 'Congratulations!',
              xpEarned: 100,
            })
          }
        >
          Show
        </button>
        <button data-testid="dismiss-btn" onClick={dismissCelebration}>
          Dismiss
        </button>
      </div>
    );
  }

  it('starts with celebration as null', () => {
    render(<TestHookComponent />);
    expect(screen.getByTestId('hook-state')).toHaveTextContent('none');
  });

  it('sets celebration data when showCelebration is called', () => {
    render(<TestHookComponent />);
    fireEvent.click(screen.getByTestId('show-btn'));
    expect(screen.getByTestId('hook-state')).toHaveTextContent('Goal Done!');
  });

  it('clears celebration data when dismissCelebration is called', () => {
    render(<TestHookComponent />);
    fireEvent.click(screen.getByTestId('show-btn'));
    expect(screen.getByTestId('hook-state')).toHaveTextContent('Goal Done!');

    fireEvent.click(screen.getByTestId('dismiss-btn'));
    expect(screen.getByTestId('hook-state')).toHaveTextContent('none');
  });
});

// ============================================================================
// Tests: MiniCelebration
// ============================================================================

describe('MiniCelebration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when show is false', () => {
    const { container } = render(
      <MiniCelebration show={false} title="Hidden Toast" />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the title when show is true', () => {
    render(<MiniCelebration show={true} title="Quick Win!" />);
    expect(screen.getByText('Quick Win!')).toBeInTheDocument();
  });

  it('renders XP display when xp is provided', () => {
    render(<MiniCelebration show={true} title="XP Toast" xp={50} />);
    expect(screen.getByText('+50 XP')).toBeInTheDocument();
  });

  it('does not render XP display when xp is not provided', () => {
    render(<MiniCelebration show={true} title="Simple Toast" />);
    expect(screen.queryByText(/\+\d+ XP/)).not.toBeInTheDocument();
  });

  it('calls onComplete after 3000ms when show is true', () => {
    const onComplete = jest.fn();
    render(
      <MiniCelebration show={true} title="Auto Complete" onComplete={onComplete} />,
    );

    act(() => {
      jest.advanceTimersByTime(2999);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call onComplete when show is false', () => {
    const onComplete = jest.fn();
    render(
      <MiniCelebration show={false} title="Hidden" onComplete={onComplete} />,
    );

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('does not call onComplete when it is not provided', () => {
    // This test verifies no error is thrown when onComplete is undefined
    render(<MiniCelebration show={true} title="No Callback" />);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // No crash - test passes implicitly
    expect(screen.getByText('No Callback')).toBeInTheDocument();
  });

  it('clears timer on unmount to prevent memory leaks', () => {
    const onComplete = jest.fn();
    const { unmount } = render(
      <MiniCelebration show={true} title="Unmount Test" onComplete={onComplete} />,
    );

    // Advance partway then unmount
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    unmount();

    // Advance past the timer
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should never have been called because the component unmounted
    expect(onComplete).not.toHaveBeenCalled();
  });
});
