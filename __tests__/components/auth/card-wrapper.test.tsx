import React from 'react';
import { render, screen } from '@testing-library/react';
import { CardWrapper } from '@/components/auth/card-wrapper';

// ---------------------------------------------------------------------------
// Mocks -- lightweight stubs that expose testable data-testid attributes
// ---------------------------------------------------------------------------

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-footer">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
}));

jest.mock('@/components/auth/header-component', () => ({
  HeaderComponent: ({ label, className }: { label: string; className?: string }) => (
    <div data-testid="header-component" data-classname={className}>{label}</div>
  ),
}));

jest.mock('@/components/auth/social', () => ({
  Social: () => <div data-testid="social">Social Login</div>,
}));

jest.mock('@/components/auth/back-button', () => ({
  BackButton: ({ label, href, className }: { label: string; href: string; className?: string }) => (
    <a data-testid="back-button" href={href} data-classname={className}>{label}</a>
  ),
}));

// ---------------------------------------------------------------------------
// Test constants -- centralised to avoid magic strings
// ---------------------------------------------------------------------------

const DEFAULT_PROPS = {
  headerLabel: 'Welcome back',
  backButtonLabel: 'Already have an account?',
  backButtonHref: '/auth/login',
} as const;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('CardWrapper', () => {
  // 1. Renders children inside CardContent
  it('renders children inside CardContent', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS}>
        <p data-testid="child-content">Hello World</p>
      </CardWrapper>
    );

    const cardContent = screen.getByTestId('card-content');
    const childElement = screen.getByTestId('child-content');

    expect(cardContent).toBeInTheDocument();
    expect(childElement).toBeInTheDocument();
    expect(cardContent).toContainElement(childElement);
  });

  // 2. Renders HeaderComponent with the headerLabel prop
  it('renders HeaderComponent with the headerLabel prop', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS}>
        <span>content</span>
      </CardWrapper>
    );

    const header = screen.getByTestId('header-component');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent(DEFAULT_PROPS.headerLabel);
  });

  // 3. Renders BackButton with label and href props
  it('renders BackButton with label and href props', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS}>
        <span>content</span>
      </CardWrapper>
    );

    const backButton = screen.getByTestId('back-button');
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveTextContent(DEFAULT_PROPS.backButtonLabel);
    expect(backButton).toHaveAttribute('href', DEFAULT_PROPS.backButtonHref);
  });

  // 4. Shows Social component when showSocial is true
  it('shows Social component when showSocial is true', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS} showSocial>
        <span>content</span>
      </CardWrapper>
    );

    const social = screen.getByTestId('social');
    expect(social).toBeInTheDocument();
    expect(social).toHaveTextContent('Social Login');
  });

  // 5. Does not show Social component when showSocial is false
  it('does not show Social component when showSocial is false', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS} showSocial={false}>
        <span>content</span>
      </CardWrapper>
    );

    expect(screen.queryByTestId('social')).not.toBeInTheDocument();
  });

  // 6. Does not show Social component when showSocial is undefined (default)
  it('does not show Social component when showSocial is undefined (default)', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS}>
        <span>content</span>
      </CardWrapper>
    );

    expect(screen.queryByTestId('social')).not.toBeInTheDocument();
  });

  // 7. Card has correct default className "shadow-sm"
  it('applies the default "shadow-sm" class to the Card', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS}>
        <span>content</span>
      </CardWrapper>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('shadow-sm');
  });

  // 8. Renders all structural elements (card, header, content, footer)
  it('renders all structural elements (card, header, content, footer)', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS}>
        <span>content</span>
      </CardWrapper>
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();

    // At least one footer is always rendered (back-button footer)
    const footers = screen.getAllByTestId('card-footer');
    expect(footers.length).toBeGreaterThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // Additional coverage: className prop, multiple children, footer count
  // ---------------------------------------------------------------------------

  it('merges a custom className with the default "shadow-sm"', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS} className="w-[400px]">
        <span>content</span>
      </CardWrapper>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('shadow-sm');
    expect(card).toHaveClass('w-[400px]');
  });

  it('renders exactly one footer when showSocial is false', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS} showSocial={false}>
        <span>content</span>
      </CardWrapper>
    );

    const footers = screen.getAllByTestId('card-footer');
    expect(footers).toHaveLength(1);
  });

  it('renders two footers when showSocial is true (social + back-button)', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS} showSocial>
        <span>content</span>
      </CardWrapper>
    );

    const footers = screen.getAllByTestId('card-footer');
    expect(footers).toHaveLength(2);
  });

  it('passes the className prop to HeaderComponent', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS}>
        <span>content</span>
      </CardWrapper>
    );

    const header = screen.getByTestId('header-component');
    expect(header).toHaveAttribute('data-classname', 'text-gray-100');
  });

  it('passes the className prop to BackButton', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS}>
        <span>content</span>
      </CardWrapper>
    );

    const backButton = screen.getByTestId('back-button');
    expect(backButton).toHaveAttribute(
      'data-classname',
      'text-white/80 md:text-md hover:text-cyan-500 font-semibold tracking-wide'
    );
  });

  it('renders multiple children correctly', () => {
    render(
      <CardWrapper {...DEFAULT_PROPS}>
        <input data-testid="email-field" type="email" />
        <input data-testid="password-field" type="password" />
        <button data-testid="submit-btn" type="submit">Submit</button>
      </CardWrapper>
    );

    const content = screen.getByTestId('card-content');
    expect(content).toContainElement(screen.getByTestId('email-field'));
    expect(content).toContainElement(screen.getByTestId('password-field'));
    expect(content).toContainElement(screen.getByTestId('submit-btn'));
  });

  it('renders with different prop values (parameterised sanity check)', () => {
    render(
      <CardWrapper
        headerLabel="Create an account"
        backButtonLabel="Already have an account?"
        backButtonHref="/auth/login"
        showSocial
      >
        <span>Register form</span>
      </CardWrapper>
    );

    expect(screen.getByTestId('header-component')).toHaveTextContent('Create an account');
    expect(screen.getByTestId('back-button')).toHaveTextContent('Already have an account?');
    expect(screen.getByTestId('back-button')).toHaveAttribute('href', '/auth/login');
    expect(screen.getByTestId('social')).toBeInTheDocument();
  });
});
