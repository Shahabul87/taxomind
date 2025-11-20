import { render, screen, fireEvent } from '@testing-library/react';
import { ExamList } from '@/app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/exam-creator/ExamList';
import { Exam } from '@/app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/exam-creator/types';

const mockExam: Exam = {
  id: 'exam-1',
  title: 'Test Exam',
  description: 'A test exam description',
  timeLimit: 60,
  questions: [
    {
      id: 'q1',
      examId: 'exam-1',
      questionType: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      bloomsLevel: 'APPLY',
      question: 'What is React?',
      options: ['Library', 'Framework'],
      correctAnswer: 'Library',
      explanation: 'React is a library',
      points: 5,
      orderIndex: 0,
    },
  ],
  totalPoints: 5,
  isPublished: false,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  _count: {
    userAttempts: 3,
  },
};

const defaultProps = {
  exams: [mockExam],
  publishingExamId: null,
  onPreview: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onPublishToggle: jest.fn(),
};

describe('ExamList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render null when no exams are provided', () => {
    const { container } = render(<ExamList {...defaultProps} exams={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render exam list with correct information', () => {
    render(<ExamList {...defaultProps} />);
    
    expect(screen.getByText('Existing Exams (1)')).toBeInTheDocument();
    expect(screen.getByText('Test Exam')).toBeInTheDocument();
    expect(screen.getByText('A test exam description')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('1 questions')).toBeInTheDocument();
    expect(screen.getByText('5 pts')).toBeInTheDocument();
    expect(screen.getByText('Time: 60 minutes')).toBeInTheDocument();
    expect(screen.getByText('Attempts: 3')).toBeInTheDocument();
  });

  it('should call onPreview when preview button is clicked', () => {
    render(<ExamList {...defaultProps} />);
    
    const previewButton = screen.getByRole('button', { name: /preview/i });
    fireEvent.click(previewButton);
    
    expect(defaultProps.onPreview).toHaveBeenCalledWith(mockExam);
  });

  it('should call onEdit when edit button is clicked', () => {
    render(<ExamList {...defaultProps} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockExam);
  });

  it('should call onDelete when delete button is clicked', () => {
    render(<ExamList {...defaultProps} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockExam.id);
  });

  it('should call onPublishToggle when publish button is clicked', () => {
    render(<ExamList {...defaultProps} />);
    
    const publishButton = screen.getByRole('button', { name: /publish/i });
    fireEvent.click(publishButton);
    
    expect(defaultProps.onPublishToggle).toHaveBeenCalledWith(mockExam.id, false);
  });

  it('should show unpublish button for published exams', () => {
    const publishedExam = { ...mockExam, isPublished: true };
    render(<ExamList {...defaultProps} exams={[publishedExam]} />);
    
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unpublish/i })).toBeInTheDocument();
  });

  it('should disable publish button when exam has no questions', () => {
    const examWithoutQuestions = { ...mockExam, questions: [] };
    render(<ExamList {...defaultProps} exams={[examWithoutQuestions]} />);
    
    const publishButton = screen.getByRole('button', { name: /publish/i });
    expect(publishButton).toBeDisabled();
    expect(screen.getByText('Add questions to publish')).toBeInTheDocument();
  });

  it('should show loading state when publishing', () => {
    render(<ExamList {...defaultProps} publishingExamId={mockExam.id} />);
    
    const publishButton = screen.getByRole('button', { name: /publish/i });
    expect(publishButton).toBeDisabled();
  });
});