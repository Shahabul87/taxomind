import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

import { DashboardShell } from '@/components/dashboard/shell';

describe('DashboardShell', () => {
  it('renders children content', () => {
    render(
      <DashboardShell>
        <p>Dashboard content</p>
      </DashboardShell>
    );

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('applies default layout classes', () => {
    const { container } = render(
      <DashboardShell>
        <span>Test</span>
      </DashboardShell>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex-1');
    expect(wrapper.className).toContain('p-4');
    expect(wrapper.className).toContain('md:p-8');
    expect(wrapper.className).toContain('pt-6');
    expect(wrapper.className).toContain('overflow-auto');
  });

  it('merges custom className with default classes', () => {
    const { container } = render(
      <DashboardShell className="bg-white mt-4">
        <span>Test</span>
      </DashboardShell>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex-1');
    expect(wrapper.className).toContain('bg-white');
    expect(wrapper.className).toContain('mt-4');
  });

  it('renders multiple children', () => {
    render(
      <DashboardShell>
        <h1>Title</h1>
        <p>Paragraph one</p>
        <p>Paragraph two</p>
      </DashboardShell>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Paragraph one')).toBeInTheDocument();
    expect(screen.getByText('Paragraph two')).toBeInTheDocument();
  });
});
