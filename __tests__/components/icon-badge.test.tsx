import React from 'react';
import { render, screen } from '@testing-library/react';
import { IconBadge } from '@/components/icon-badge';
import { CheckCircle2, AlertCircle, Star, User } from 'lucide-react';

describe('IconBadge Component', () => {
  it('should render with default props', () => {
    const { container } = render(<IconBadge icon={CheckCircle2} />);
    
    const badge = container.firstChild as HTMLElement;
    const icon = badge.querySelector('svg');
    
    expect(badge).toHaveClass('bg-sky-100', 'rounded-full', 'p-2');
    expect(icon).toHaveClass('text-sky-700', 'h-8', 'w-8');
  });

  it('should render with success variant', () => {
    render(<IconBadge icon={CheckCircle2} variant="success" />);
    
    const container = screen.getByRole('generic');
    const icon = container.querySelector('svg');
    
    expect(container).toHaveClass('bg-emerald-100');
    expect(icon).toHaveClass('text-emerald-700');
  });

  it('should render with small size', () => {
    render(<IconBadge icon={Star} size="sm" />);
    
    const container = screen.getByRole('generic');
    const icon = container.querySelector('svg');
    
    expect(container).toHaveClass('p-1');
    expect(icon).toHaveClass('h-4', 'w-4');
  });

  it('should render with success variant and small size', () => {
    render(<IconBadge icon={User} variant="success" size="sm" />);
    
    const container = screen.getByRole('generic');
    const icon = container.querySelector('svg');
    
    expect(container).toHaveClass('bg-emerald-100', 'p-1');
    expect(icon).toHaveClass('text-emerald-700', 'h-4', 'w-4');
  });

  it('should render different icons correctly', () => {
    const icons = [CheckCircle2, AlertCircle, Star, User];
    
    icons.forEach((IconComponent, index) => {
      const { unmount } = render(<IconBadge icon={IconComponent} />);
      
      const container = screen.getByRole('generic');
      const icon = container.querySelector('svg');
      
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-sky-700', 'h-8', 'w-8');
      
      unmount();
    });
  });

  it('should have proper accessibility structure', () => {
    render(<IconBadge icon={CheckCircle2} />);
    
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
    
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should combine background and icon classes correctly', () => {
    render(<IconBadge icon={AlertCircle} />);
    
    const container = screen.getByRole('generic');
    const icon = container.querySelector('svg');
    
    // Background should have background variant classes
    expect(container).toHaveClass('rounded-full', 'flex', 'items-center', 'justify-center');
    
    // Icon should have icon variant classes
    expect(icon).toBeInstanceOf(SVGElement);
  });

  it('should render with all variant combinations', () => {
    const variants = ['default', 'success'] as const;
    const sizes = ['default', 'sm'] as const;
    
    variants.forEach((variant) => {
      sizes.forEach((size) => {
        const { unmount } = render(
          <IconBadge icon={CheckCircle2} variant={variant} size={size} />
        );
        
        const container = screen.getByRole('generic');
        const icon = container.querySelector('svg');
        
        expect(container).toBeInTheDocument();
        expect(icon).toBeInTheDocument();
        
        // Check background variant
        if (variant === 'success') {
          expect(container).toHaveClass('bg-emerald-100');
          expect(icon).toHaveClass('text-emerald-700');
        } else {
          expect(container).toHaveClass('bg-sky-100');
          expect(icon).toHaveClass('text-sky-700');
        }
        
        // Check size
        if (size === 'sm') {
          expect(container).toHaveClass('p-1');
          expect(icon).toHaveClass('h-4', 'w-4');
        } else {
          expect(container).toHaveClass('p-2');
          expect(icon).toHaveClass('h-8', 'w-8');
        }
        
        unmount();
      });
    });
  });

  it('should maintain proper aspect ratio for circular badge', () => {
    render(<IconBadge icon={Star} />);
    
    const container = screen.getByRole('generic');
    expect(container).toHaveClass('rounded-full');
  });

  it('should center the icon within the badge', () => {
    render(<IconBadge icon={CheckCircle2} />);
    
    const container = screen.getByRole('generic');
    expect(container).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('should handle icon prop as component', () => {
    const CustomIcon = () => (
      <svg data-testid="custom-icon" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
    
    render(<IconBadge icon={CustomIcon} />);
    
    const container = screen.getByRole('generic');
    const customIcon = screen.getByTestId('custom-icon');
    
    expect(container).toBeInTheDocument();
    expect(customIcon).toBeInTheDocument();
  });
});