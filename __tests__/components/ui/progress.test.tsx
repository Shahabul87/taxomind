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