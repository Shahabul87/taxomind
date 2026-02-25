import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a card element', () => {
    render(<Card data-testid="card">Card Content</Card>);

    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent('Card Content');
  });

  it('renders with title and description', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
  });

  it('renders with content', () => {
    render(
      <Card>
        <CardContent>
          <p>Some content here</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Some content here')).toBeInTheDocument();
  });

  it('applies className to card', () => {
    render(
      <Card data-testid="card" className="my-custom-class">
        Content
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card.className).toContain('my-custom-class');
  });
});

describe('CardHeader', () => {
  it('renders children correctly', () => {
    render(
      <CardHeader data-testid="header">
        <span>Header Content</span>
      </CardHeader>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders as h3 element', () => {
    render(<CardTitle>Test Title</CardTitle>);

    const title = screen.getByText('Test Title');
    expect(title.tagName).toBe('H3');
  });
});

describe('CardFooter', () => {
  it('renders footer content', () => {
    render(
      <CardFooter data-testid="footer">
        <button>Action</button>
      </CardFooter>
    );

    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});
