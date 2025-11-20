import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionItem } from '@/app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/exam-creator/QuestionItem';
import { Question } from '@/app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/exam-creator/types';

const mockQuestion: Question = {
  id: 'q1',
  type: 'multiple-choice',
  difficulty: 'medium',
  bloomsLevel: 'apply',
  question: 'What is React?',
  options: ['Library', 'Framework', 'Language', 'Database'],
  correctAnswer: 'Library',
  explanation: 'React is a JavaScript library for building user interfaces.',
  points: 5,
};

const defaultProps = {
  question: mockQuestion,
  index: 0,
  isEditing: false,
  onEdit: jest.fn(),
  onUpdate: jest.fn(),
  onDelete: jest.fn(),
  onCancelEdit: jest.fn(),
  onDragStart: jest.fn(),
  onDragEnd: jest.fn(),
  onDragOver: jest.fn(),
  onDrop: jest.fn(),
};

describe('QuestionItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render question in display mode', () => {
    render(<QuestionItem {...defaultProps} />);
    
    expect(screen.getByText('What is React?')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('multiple choice')).toBeInTheDocument();
    expect(screen.getByText('apply')).toBeInTheDocument();
    expect(screen.getByText('5 pts')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // question number
  });

  it('should render options for multiple choice questions', () => {
    render(<QuestionItem {...defaultProps} />);
    
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Framework')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
  });

  it('should highlight correct answer', () => {
    render(<QuestionItem {...defaultProps} />);
    
    const correctOption = screen.getByText('Library').closest('div');
    expect(correctOption).toHaveClass('bg-green-50');
  });

  it('should show explanation when provided', () => {
    render(<QuestionItem {...defaultProps} />);
    
    expect(screen.getByText('Explanation')).toBeInTheDocument();
    expect(screen.getByText('React is a JavaScript library for building user interfaces.')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(<QuestionItem {...defaultProps} />);
    
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => button.querySelector('svg'));
    fireEvent.click(editButton!);
    
    expect(defaultProps.onEdit).toHaveBeenCalled();
  });

  it('should render in editing mode when isEditing is true', () => {
    render(<QuestionItem {...defaultProps} isEditing={true} />);
    
    expect(screen.getByDisplayValue('What is React?')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Library')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should call onUpdate when question text is changed in edit mode', () => {
    render(<QuestionItem {...defaultProps} isEditing={true} />);
    
    const questionInput = screen.getByDisplayValue('What is React?');
    fireEvent.change(questionInput, { target: { value: 'What is Vue?' } });
    
    expect(defaultProps.onUpdate).toHaveBeenCalledWith({ question: 'What is Vue?' });
  });

  it('should call onUpdate when points are changed in edit mode', () => {
    render(<QuestionItem {...defaultProps} isEditing={true} />);
    
    const pointsInput = screen.getByDisplayValue('5');
    fireEvent.change(pointsInput, { target: { value: '10' } });
    
    expect(defaultProps.onUpdate).toHaveBeenCalledWith({ points: 10 });
  });

  it('should show correct answer for short answer questions', () => {
    const shortAnswerQuestion: Question = {
      ...mockQuestion,
      type: 'short-answer',
      options: undefined,
    };
    
    render(<QuestionItem {...defaultProps} question={shortAnswerQuestion} />);
    
    expect(screen.getByText('Correct Answer:')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('should handle drag and drop events', () => {
    render(<QuestionItem {...defaultProps} />);
    
    const dragHandle = screen.getByTestId('drag-handle') || document.querySelector('[draggable="true"]');
    
    if (dragHandle) {
      fireEvent.dragStart(dragHandle);
      expect(defaultProps.onDragStart).toHaveBeenCalled();
      
      fireEvent.dragEnd(dragHandle);
      expect(defaultProps.onDragEnd).toHaveBeenCalled();
    }
  });
});