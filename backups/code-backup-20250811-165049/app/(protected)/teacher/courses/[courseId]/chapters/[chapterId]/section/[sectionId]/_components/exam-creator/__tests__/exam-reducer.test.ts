import { examReducer, initialExamState, ExamAction } from '../exam-reducer';
import { Question } from '../types';

describe('examReducer', () => {
  const mockQuestion: Question = {
    id: '1',
    type: 'multiple-choice',
    difficulty: 'medium',
    bloomsLevel: 'apply',
    question: 'What is React?',
    options: ['Library', 'Framework', 'Language', 'Database'],
    correctAnswer: 'Library',
    explanation: 'React is a JavaScript library for building user interfaces.',
    points: 5,
  };

  it('should return the initial state', () => {
    expect(examReducer(initialExamState, {} as ExamAction)).toBe(initialExamState);
  });

  it('should handle SET_CREATING', () => {
    const action: ExamAction = { type: 'SET_CREATING', payload: true };
    const newState = examReducer(initialExamState, action);
    expect(newState.isCreating).toBe(true);
  });

  it('should handle SET_QUESTIONS', () => {
    const questions = [mockQuestion];
    const action: ExamAction = { type: 'SET_QUESTIONS', payload: questions };
    const newState = examReducer(initialExamState, action);
    expect(newState.questions).toEqual(questions);
  });

  it('should handle ADD_QUESTIONS', () => {
    const existingQuestions = [mockQuestion];
    const newQuestions = [{ ...mockQuestion, id: '2', question: 'What is TypeScript?' }];
    const state = { ...initialExamState, questions: existingQuestions };
    
    const action: ExamAction = { type: 'ADD_QUESTIONS', payload: newQuestions };
    const newState = examReducer(state, action);
    expect(newState.questions).toHaveLength(2);
    expect(newState.questions).toEqual([...existingQuestions, ...newQuestions]);
  });

  it('should handle UPDATE_QUESTION', () => {
    const state = { ...initialExamState, questions: [mockQuestion] };
    const updates = { points: 10, difficulty: 'hard' as const };
    
    const action: ExamAction = {
      type: 'UPDATE_QUESTION',
      payload: { id: '1', updates },
    };
    const newState = examReducer(state, action);
    
    expect(newState.questions[0].points).toBe(10);
    expect(newState.questions[0].difficulty).toBe('hard');
  });

  it('should handle DELETE_QUESTION', () => {
    const state = { ...initialExamState, questions: [mockQuestion] };
    const action: ExamAction = { type: 'DELETE_QUESTION', payload: '1' };
    const newState = examReducer(state, action);
    
    expect(newState.questions).toHaveLength(0);
  });

  it('should handle MOVE_QUESTION', () => {
    const question2 = { ...mockQuestion, id: '2', question: 'Question 2' };
    const question3 = { ...mockQuestion, id: '3', question: 'Question 3' };
    const state = { ...initialExamState, questions: [mockQuestion, question2, question3] };
    
    const action: ExamAction = {
      type: 'MOVE_QUESTION',
      payload: { dragIndex: 0, hoverIndex: 2 },
    };
    const newState = examReducer(state, action);
    
    expect(newState.questions[0].id).toBe('2');
    expect(newState.questions[1].id).toBe('3');
    expect(newState.questions[2].id).toBe('1');
  });

  it('should handle SET_EDITING_QUESTION', () => {
    const action: ExamAction = { type: 'SET_EDITING_QUESTION', payload: 'question-1' };
    const newState = examReducer(initialExamState, action);
    expect(newState.editingQuestion).toBe('question-1');
  });

  it('should handle RESET_FORM', () => {
    const state = {
      ...initialExamState,
      isCreating: true,
      questions: [mockQuestion],
      editingQuestion: 'question-1',
      previewingExam: { id: 'exam-1' } as any,
    };
    
    const action: ExamAction = { type: 'RESET_FORM' };
    const newState = examReducer(state, action);
    
    expect(newState.isCreating).toBe(false);
    expect(newState.questions).toHaveLength(0);
    expect(newState.editingQuestion).toBe(null);
    expect(newState.previewingExam).toBe(null);
  });
});