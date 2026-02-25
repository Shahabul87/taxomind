import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

// Mock fetch
global.fetch = jest.fn();

import { FeedbackButtons } from '@/components/sam/FeedbackButtons';
import { toast } from 'sonner';

describe('FeedbackButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders helpful and not helpful buttons', () => {
    render(<FeedbackButtons messageId="msg-1" sessionId="sess-1" />);

    expect(screen.getByTitle('This was helpful')).toBeInTheDocument();
    expect(screen.getByTitle('This was not helpful')).toBeInTheDocument();
  });

  it('submits helpful feedback successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<FeedbackButtons messageId="msg-1" sessionId="sess-1" />);

    await act(async () => {
      fireEvent.click(screen.getByTitle('This was helpful'));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/sam/feedback', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"rating":"helpful"'),
      }));
    });

    expect(screen.getByText('Feedback recorded')).toBeInTheDocument();
  });

  it('submits not helpful feedback', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<FeedbackButtons messageId="msg-1" sessionId="sess-1" />);

    await act(async () => {
      fireEvent.click(screen.getByTitle('This was not helpful'));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/sam/feedback', expect.objectContaining({
        body: expect.stringContaining('"rating":"not_helpful"'),
      }));
    });
  });

  it('shows confirmation after feedback is submitted', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<FeedbackButtons messageId="msg-1" sessionId="sess-1" />);

    await act(async () => {
      fireEvent.click(screen.getByTitle('This was helpful'));
    });

    await waitFor(() => {
      expect(screen.getByText('Feedback recorded')).toBeInTheDocument();
    });
  });

  it('calls onFeedbackSubmitted callback', async () => {
    const mockCallback = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(
      <FeedbackButtons
        messageId="msg-1"
        sessionId="sess-1"
        onFeedbackSubmitted={mockCallback}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByTitle('This was helpful'));
    });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith('helpful');
    });
  });

  it('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Server error' } }),
    });

    render(<FeedbackButtons messageId="msg-1" sessionId="sess-1" />);

    await act(async () => {
      fireEvent.click(screen.getByTitle('This was helpful'));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    // Buttons should still be visible (not in submitted state)
    expect(screen.getByTitle('This was helpful')).toBeInTheDocument();
  });

  it('prevents duplicate submissions', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<FeedbackButtons messageId="msg-1" sessionId="sess-1" />);

    await act(async () => {
      fireEvent.click(screen.getByTitle('This was helpful'));
    });

    await waitFor(() => {
      expect(screen.getByText('Feedback recorded')).toBeInTheDocument();
    });

    // Buttons should be gone, replaced by confirmation
    expect(screen.queryByTitle('This was helpful')).not.toBeInTheDocument();
  });
});
