jest.unmock('@/actions/register-teacher');

import { registerTeacher } from '@/actions/register-teacher';
import { getUserByEmail } from '@/data/user';
import { generateVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/mail';
import { hashPassword } from '@/lib/passwordUtils';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Mock @/lib/passwordUtils (not globally mocked in jest.setup.js)
jest.mock('@/lib/passwordUtils', () => ({
  hashPassword: jest.fn().mockResolvedValue('noble:hashed_salt:hashed_password'),
  verifyPassword: jest.fn(),
  needsRehashing: jest.fn(),
  migratePassword: jest.fn(),
}));

const mockGetUserByEmail = getUserByEmail as jest.Mock;
const mockGenerateVerificationToken = generateVerificationToken as jest.Mock;
const mockSendVerificationEmail = sendVerificationEmail as jest.Mock;
const mockHashPassword = hashPassword as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;
const mockLogger = logger as jest.Mocked<typeof logger>;

// Valid input that satisfies RegisterTeacherSchema
// Password requires: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const validInput = {
  email: 'teacher@example.com',
  password: 'StrongPass1!',
  name: 'Jane Teacher',
  qualifications: 'PhD in Computer Science, MSc in Education',
  experience: 'Over 10 years teaching at university level',
  subjects: 'Mathematics, Physics, Computer Science',
};

const mockCreatedUser = {
  id: 'user-123',
  name: validInput.name,
  email: validInput.email,
  password: 'noble:hashed_salt:hashed_password',
  isTeacher: false,
};

const mockVerificationToken = {
  email: validInput.email,
  token: 'verification-token-abc',
  expires: new Date(Date.now() + 3600000),
};

describe('registerTeacher action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // The instructorVerification model is not in the global mock client.
    // Add it so db.instructorVerification.create works.
    if (!(mockDb as Record<string, unknown>).instructorVerification) {
      (mockDb as Record<string, unknown>).instructorVerification = {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };
    } else {
      // Reset if it already exists from a previous test
      ((mockDb as Record<string, unknown>).instructorVerification as Record<string, jest.Mock>).create.mockReset();
    }

    // Default happy-path mocks
    mockGetUserByEmail.mockResolvedValue(null);
    mockHashPassword.mockResolvedValue('noble:hashed_salt:hashed_password');
    (mockDb.user as { create: jest.Mock }).create.mockResolvedValue(mockCreatedUser);
    ((mockDb as Record<string, unknown>).instructorVerification as { create: jest.Mock }).create.mockResolvedValue({
      id: 'iv-1',
      userId: mockCreatedUser.id,
      status: 'PENDING',
    });
    (mockDb.auditLog as { create: jest.Mock }).create.mockResolvedValue({ id: 'audit-1' });
    mockGenerateVerificationToken.mockResolvedValue(mockVerificationToken);
    mockSendVerificationEmail.mockResolvedValue(undefined);
  });

  // ----------------------------------------------------------------
  // 1. Invalid fields error
  // ----------------------------------------------------------------
  it('should return error for invalid fields', async () => {
    const invalidData = {
      email: 'not-an-email',
      password: '123', // Too short and missing required chars
      name: '',
      qualifications: 'short', // Less than 10 chars
      experience: 'x', // Less than 10 chars
      subjects: 'ab', // Less than 5 chars
    };

    const result = await registerTeacher(invalidData);

    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(mockGetUserByEmail).not.toHaveBeenCalled();
    expect(mockHashPassword).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // 2. Email already in use
  // ----------------------------------------------------------------
  it('should return error when email is already in use', async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: 'existing-user',
      email: validInput.email,
    });

    const result = await registerTeacher(validInput);

    expect(result).toEqual({ error: 'Email already in use!' });
    expect(mockGetUserByEmail).toHaveBeenCalledWith(validInput.email);
    expect(mockHashPassword).not.toHaveBeenCalled();
    expect((mockDb.user as { create: jest.Mock }).create).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // 3. Successful registration with all fields
  // ----------------------------------------------------------------
  it('should successfully register a teacher and return success message', async () => {
    const result = await registerTeacher(validInput);

    expect(result).toEqual({
      success:
        'Registration successful! Please check your email to verify your account. Your instructor application will be reviewed by our admin team.',
    });

    // Verify full workflow was executed
    expect(mockGetUserByEmail).toHaveBeenCalledWith(validInput.email);
    expect(mockHashPassword).toHaveBeenCalledWith(validInput.password);
    expect((mockDb.user as { create: jest.Mock }).create).toHaveBeenCalledTimes(1);
    expect(
      ((mockDb as Record<string, unknown>).instructorVerification as { create: jest.Mock }).create
    ).toHaveBeenCalledTimes(1);
    expect((mockDb.auditLog as { create: jest.Mock }).create).toHaveBeenCalledTimes(1);
    expect(mockGenerateVerificationToken).toHaveBeenCalledWith(validInput.email);
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      mockVerificationToken.email,
      mockVerificationToken.token
    );
  });

  // ----------------------------------------------------------------
  // 4. Subjects string parsing (comma-separated)
  // ----------------------------------------------------------------
  it('should parse comma-separated subjects string into a trimmed array', async () => {
    const inputWithSpacedSubjects = {
      ...validInput,
      subjects: '  Math , Physics ,  Chemistry  ,  Biology ',
    };

    await registerTeacher(inputWithSpacedSubjects);

    // Verify the parsed subjects appear in the instructorVerification notes
    const ivCreateCall = (
      (mockDb as Record<string, unknown>).instructorVerification as { create: jest.Mock }
    ).create.mock.calls[0][0];
    expect(ivCreateCall.data.verificationNotes).toContain('Subjects: Math, Physics, Chemistry, Biology');

    // Verify the parsed subjects appear in the auditLog context
    const auditCreateCall = (mockDb.auditLog as { create: jest.Mock }).create.mock.calls[0][0];
    expect(auditCreateCall.data.context.subjects).toEqual([
      'Math',
      'Physics',
      'Chemistry',
      'Biology',
    ]);
  });

  // ----------------------------------------------------------------
  // 5. User created with isTeacher: false
  // ----------------------------------------------------------------
  it('should create user with isTeacher set to false', async () => {
    await registerTeacher(validInput);

    const userCreateCall = (mockDb.user as { create: jest.Mock }).create.mock.calls[0][0];
    expect(userCreateCall.data).toMatchObject({
      name: validInput.name,
      email: validInput.email,
      password: 'noble:hashed_salt:hashed_password',
      isTeacher: false,
    });
  });

  // ----------------------------------------------------------------
  // 6. InstructorVerification created with PENDING status
  // ----------------------------------------------------------------
  it('should create instructorVerification record with PENDING status and correct data', async () => {
    await registerTeacher(validInput);

    const ivCreateCall = (
      (mockDb as Record<string, unknown>).instructorVerification as { create: jest.Mock }
    ).create.mock.calls[0][0];

    expect(ivCreateCall.data).toMatchObject({
      userId: mockCreatedUser.id,
      status: 'PENDING',
      documentType: 'QUALIFICATION',
      documentUrl: '',
    });
    expect(ivCreateCall.data.verificationNotes).toContain(`Qualifications: ${validInput.qualifications}`);
    expect(ivCreateCall.data.verificationNotes).toContain(`Experience: ${validInput.experience}`);
    expect(ivCreateCall.data.verificationNotes).toContain('Subjects: Mathematics, Physics, Computer Science');
  });

  // ----------------------------------------------------------------
  // 7. AuditLog created with correct context
  // ----------------------------------------------------------------
  it('should create auditLog entry with correct action, entityType, and context', async () => {
    await registerTeacher(validInput);

    const auditCreateCall = (mockDb.auditLog as { create: jest.Mock }).create.mock.calls[0][0];

    expect(auditCreateCall.data).toMatchObject({
      userId: mockCreatedUser.id,
      action: 'CREATE',
      entityType: 'USER',
      entityId: mockCreatedUser.id,
      context: {
        type: 'USER_REGISTRATION',
        email: validInput.email,
        name: validInput.name,
        qualifications: validInput.qualifications,
        experience: validInput.experience,
        subjects: ['Mathematics', 'Physics', 'Computer Science'],
      },
    });
  });

  // ----------------------------------------------------------------
  // 8. Verification email sent
  // ----------------------------------------------------------------
  it('should generate a verification token and send verification email', async () => {
    await registerTeacher(validInput);

    expect(mockGenerateVerificationToken).toHaveBeenCalledWith(validInput.email);
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      mockVerificationToken.email,
      mockVerificationToken.token
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      `User registration initiated for ${validInput.email}`
    );
  });

  // ----------------------------------------------------------------
  // 9. DB error handling
  // ----------------------------------------------------------------
  it('should return error message when database throws an error', async () => {
    (mockDb.user as { create: jest.Mock }).create.mockRejectedValue(
      new Error('Database connection lost')
    );

    const result = await registerTeacher(validInput);

    expect(result).toEqual({ error: 'Something went wrong during registration!' });
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error in teacher registration:',
      expect.any(Error)
    );
  });

  // ----------------------------------------------------------------
  // 10. Empty subjects string edge case
  // ----------------------------------------------------------------
  it('should handle subjects with only commas and spaces by filtering empty entries', async () => {
    // "  , ,  " after split/trim/filter results in an empty array.
    // However, RegisterTeacherSchema requires min 5 chars for subjects.
    // The string "  , ,  " has 7 chars so it passes the schema check.
    const inputWithEmptySubjects = {
      ...validInput,
      subjects: '  , ,  ',
    };

    await registerTeacher(inputWithEmptySubjects);

    const ivCreateCall = (
      (mockDb as Record<string, unknown>).instructorVerification as { create: jest.Mock }
    ).create.mock.calls[0][0];
    expect(ivCreateCall.data.verificationNotes).toContain('Subjects: ');

    const auditCreateCall = (mockDb.auditLog as { create: jest.Mock }).create.mock.calls[0][0];
    expect(auditCreateCall.data.context.subjects).toEqual([]);
  });

  // ----------------------------------------------------------------
  // 11. Password is hashed before storing
  // ----------------------------------------------------------------
  it('should hash the password before creating the user', async () => {
    await registerTeacher(validInput);

    // hashPassword is called with the plain password
    expect(mockHashPassword).toHaveBeenCalledWith(validInput.password);

    // The hashed value (not the plain password) is stored in db
    const userCreateCall = (mockDb.user as { create: jest.Mock }).create.mock.calls[0][0];
    expect(userCreateCall.data.password).toBe('noble:hashed_salt:hashed_password');
    expect(userCreateCall.data.password).not.toBe(validInput.password);
  });

  // ----------------------------------------------------------------
  // 12. Validation rejects missing required fields
  // ----------------------------------------------------------------
  it('should return error when required fields are missing', async () => {
    const incompleteData = {
      email: 'teacher@example.com',
      password: 'StrongPass1!',
      name: 'Jane Teacher',
      // Missing qualifications, experience, subjects
    } as Parameters<typeof registerTeacher>[0];

    const result = await registerTeacher(incompleteData);

    expect(result).toEqual({ error: 'Invalid fields!' });
  });

  // ----------------------------------------------------------------
  // 13. Password validation enforces complexity rules
  // ----------------------------------------------------------------
  it('should reject password without uppercase letter', async () => {
    const weakPasswordInput = {
      ...validInput,
      password: 'weakpass1!', // No uppercase letter
    };

    const result = await registerTeacher(weakPasswordInput);

    expect(result).toEqual({ error: 'Invalid fields!' });
  });

  // ----------------------------------------------------------------
  // 14. Token generation failure is caught by error handler
  // ----------------------------------------------------------------
  it('should return error when verification token generation fails', async () => {
    mockGenerateVerificationToken.mockRejectedValue(
      new Error('Token service unavailable')
    );

    const result = await registerTeacher(validInput);

    expect(result).toEqual({ error: 'Something went wrong during registration!' });
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error in teacher registration:',
      expect.any(Error)
    );
    // Email should NOT be sent since token generation failed
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // 15. Single subject (no commas) is handled correctly
  // ----------------------------------------------------------------
  it('should handle a single subject without commas', async () => {
    const singleSubjectInput = {
      ...validInput,
      subjects: 'Mathematics',
    };

    await registerTeacher(singleSubjectInput);

    const ivCreateCall = (
      (mockDb as Record<string, unknown>).instructorVerification as { create: jest.Mock }
    ).create.mock.calls[0][0];
    expect(ivCreateCall.data.verificationNotes).toContain('Subjects: Mathematics');

    const auditCreateCall = (mockDb.auditLog as { create: jest.Mock }).create.mock.calls[0][0];
    expect(auditCreateCall.data.context.subjects).toEqual(['Mathematics']);
  });

  // ----------------------------------------------------------------
  // 16. Email sending failure is caught by error handler
  // ----------------------------------------------------------------
  it('should return error when email sending fails', async () => {
    mockSendVerificationEmail.mockRejectedValue(
      new Error('SMTP server error')
    );

    const result = await registerTeacher(validInput);

    expect(result).toEqual({ error: 'Something went wrong during registration!' });
    expect(mockLogger.error).toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // 17. Operations execute in correct order
  // ----------------------------------------------------------------
  it('should execute operations in the correct sequence', async () => {
    const callOrder: string[] = [];

    mockGetUserByEmail.mockImplementation(async () => {
      callOrder.push('getUserByEmail');
      return null;
    });
    mockHashPassword.mockImplementation(async () => {
      callOrder.push('hashPassword');
      return 'noble:hashed_salt:hashed_password';
    });
    (mockDb.user as { create: jest.Mock }).create.mockImplementation(async () => {
      callOrder.push('user.create');
      return mockCreatedUser;
    });
    ((mockDb as Record<string, unknown>).instructorVerification as { create: jest.Mock }).create.mockImplementation(
      async () => {
        callOrder.push('instructorVerification.create');
        return { id: 'iv-1' };
      }
    );
    (mockDb.auditLog as { create: jest.Mock }).create.mockImplementation(async () => {
      callOrder.push('auditLog.create');
      return { id: 'audit-1' };
    });
    mockGenerateVerificationToken.mockImplementation(async () => {
      callOrder.push('generateVerificationToken');
      return mockVerificationToken;
    });
    mockSendVerificationEmail.mockImplementation(async () => {
      callOrder.push('sendVerificationEmail');
    });

    await registerTeacher(validInput);

    expect(callOrder).toEqual([
      'getUserByEmail',
      'hashPassword',
      'user.create',
      'instructorVerification.create',
      'auditLog.create',
      'generateVerificationToken',
      'sendVerificationEmail',
    ]);
  });
});
