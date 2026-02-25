import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

import { Input } from '@/components/ui/input';

describe('Input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders an input element', () => {
    render(<Input data-testid="test-input" />);

    const input = screen.getByTestId('test-input');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('handles change events', () => {
    const handleChange = jest.fn();
    render(<Input data-testid="test-input" onChange={handleChange} />);

    const input = screen.getByTestId('test-input');
    fireEvent.change(input, { target: { value: 'Hello' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('applies additional className', () => {
    render(<Input data-testid="test-input" className="custom-class" />);

    const input = screen.getByTestId('test-input');
    expect(input.className).toContain('custom-class');
  });

  it('forwards ref to the input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} data-testid="test-input" />);

    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('INPUT');
  });

  it('handles disabled state', () => {
    render(<Input data-testid="test-input" disabled />);

    const input = screen.getByTestId('test-input');
    expect(input).toBeDisabled();
  });
});
