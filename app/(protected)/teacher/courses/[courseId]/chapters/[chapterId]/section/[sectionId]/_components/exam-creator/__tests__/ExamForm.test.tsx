import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ExamForm } from '../ExamForm';

// Mock the form schema
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  timeLimit: z.string().optional(),
});

type ExamFormData = z.infer<typeof formSchema>;

// Test wrapper component to provide form context
function TestWrapper({ children, onSubmit, onCancel }: any) {
  const form = useForm<ExamFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      timeLimit: '60',
    },
  });

  const { isSubmitting, isValid } = form.formState;

  return (
    <ExamForm
      form={form}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      isValid={isValid}
    />
  );
}

describe('ExamForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(<TestWrapper onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByLabelText(/exam title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/exam description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time limit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create exam/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should have correct placeholder texts', () => {
    render(<TestWrapper onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByPlaceholderText('e.g. \'Module 1 Assessment\'')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe what this exam will cover...')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<TestWrapper onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should disable submit button when form is invalid', () => {
    render(<TestWrapper onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const submitButton = screen.getByRole('button', { name: /create exam/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when form is valid', async () => {
    render(<TestWrapper onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const titleInput = screen.getByLabelText(/exam title/i);
    const descriptionInput = screen.getByLabelText(/exam description/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Exam' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /create exam/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should call onSubmit with form data when submitted', async () => {
    render(<TestWrapper onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const titleInput = screen.getByLabelText(/exam title/i);
    const descriptionInput = screen.getByLabelText(/exam description/i);
    const timeLimitInput = screen.getByLabelText(/time limit/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Exam' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    fireEvent.change(timeLimitInput, { target: { value: '90' } });
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /create exam/i });
      expect(submitButton).not.toBeDisabled();
    });
    
    const submitButton = screen.getByRole('button', { name: /create exam/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Exam',
        description: 'Test Description',
        timeLimit: '90',
      });
    });
  });

  it('should show validation errors for required fields', async () => {
    render(<TestWrapper onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const titleInput = screen.getByLabelText(/exam title/i);
    const descriptionInput = screen.getByLabelText(/exam description/i);
    
    // Fill and then clear to trigger validation
    fireEvent.change(titleInput, { target: { value: 'Test' } });
    fireEvent.change(titleInput, { target: { value: '' } });
    fireEvent.blur(titleInput);
    
    fireEvent.change(descriptionInput, { target: { value: 'Test' } });
    fireEvent.change(descriptionInput, { target: { value: '' } });
    fireEvent.blur(descriptionInput);
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
  });

  it('should accept numeric input for time limit', () => {
    render(<TestWrapper onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const timeLimitInput = screen.getByLabelText(/time limit/i);
    expect(timeLimitInput).toHaveAttribute('type', 'number');
    
    fireEvent.change(timeLimitInput, { target: { value: '120' } });
    expect(timeLimitInput).toHaveValue(120);
  });
});