import React from 'react';
import { render } from '@testing-library/react';
import { IconBadge } from '@/components/icon-badge';
import { CheckCircle2, AlertCircle, Star } from 'lucide-react';

describe('IconBadge Component - Simplified', () => {
  it('should render with default props', () => {
    const { container } = render(<IconBadge icon={CheckCircle2} />);
    
    const badge = container.firstChild as HTMLElement;
    const icon = badge.querySelector('svg');
    
    expect(badge).toHaveClass('bg-sky-100', 'rounded-full', 'p-2');
    expect(icon).toHaveClass('text-sky-700', 'h-8', 'w-8');
  });

  it('should render with success variant', () => {
    const { container } = render(<IconBadge icon={CheckCircle2} variant="success" />);
    
    const badge = container.firstChild as HTMLElement;
    const icon = badge.querySelector('svg');
    
    expect(badge).toHaveClass('bg-emerald-100');
    expect(icon).toHaveClass('text-emerald-700');
  });

  it('should render with small size', () => {
    const { container } = render(<IconBadge icon={Star} size="sm" />);
    
    const badge = container.firstChild as HTMLElement;
    const icon = badge.querySelector('svg');
    
    expect(badge).toHaveClass('p-1');
    expect(icon).toHaveClass('h-4', 'w-4');
  });

  it('should render with success variant and small size', () => {
    const { container } = render(<IconBadge icon={AlertCircle} variant="success" size="sm" />);
    
    const badge = container.firstChild as HTMLElement;
    const icon = badge.querySelector('svg');
    
    expect(badge).toHaveClass('bg-emerald-100', 'p-1');
    expect(icon).toHaveClass('text-emerald-700', 'h-4', 'w-4');
  });

  it('should have proper structure', () => {
    const { container } = render(<IconBadge icon={CheckCircle2} />);
    
    const badge = container.firstChild as HTMLElement;
    const icon = badge.querySelector('svg');
    
    expect(badge).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
    expect(badge).toHaveClass('rounded-full', 'flex', 'items-center', 'justify-center');
  });

  it('should render different variants correctly', () => {
    // Default variant
    const { container: defaultContainer } = render(<IconBadge icon={CheckCircle2} />);
    const defaultBadge = defaultContainer.firstChild as HTMLElement;
    const defaultIcon = defaultBadge.querySelector('svg');
    
    expect(defaultBadge).toHaveClass('bg-sky-100');
    expect(defaultIcon).toHaveClass('text-sky-700');

    // Success variant
    const { container: successContainer } = render(<IconBadge icon={CheckCircle2} variant="success" />);
    const successBadge = successContainer.firstChild as HTMLElement;
    const successIcon = successBadge.querySelector('svg');
    
    expect(successBadge).toHaveClass('bg-emerald-100');
    expect(successIcon).toHaveClass('text-emerald-700');
  });

  it('should render different sizes correctly', () => {
    // Default size
    const { container: defaultContainer } = render(<IconBadge icon={Star} />);
    const defaultBadge = defaultContainer.firstChild as HTMLElement;
    const defaultIcon = defaultBadge.querySelector('svg');
    
    expect(defaultBadge).toHaveClass('p-2');
    expect(defaultIcon).toHaveClass('h-8', 'w-8');

    // Small size
    const { container: smallContainer } = render(<IconBadge icon={Star} size="sm" />);
    const smallBadge = smallContainer.firstChild as HTMLElement;
    const smallIcon = smallBadge.querySelector('svg');
    
    expect(smallBadge).toHaveClass('p-1');
    expect(smallIcon).toHaveClass('h-4', 'w-4');
  });
});