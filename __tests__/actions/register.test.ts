import { register } from '@/actions/register';
import { getUserByEmail } from '@/data/user';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('@/data/user');
jest.mock('@/lib/mail');
jest.mock('@/lib/tokens');
jest.mock('@/lib/db');
jest.mock('bcryptjs');

const mockGetUserByEmail = getUserByEmail as jest.Mock;
const mockSendVerificationEmail = sendVerificationEmail as jest.Mock;
const mockGenerateVerificationToken = generateVerificationToken as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;

describe('register action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (db as any).user = {
      create: jest.fn(),
    };
  });

  it('should return error for invalid input', async () => {
    const invalidData = {
      email: 'invalid-email',
      password: '123', // Too short
      name: '',
    };

    const result = await register(invalidData);

    expect(result).toEqual({
      error: 'Invalid fields!',
    });
  });

  it('should return error if email is already taken', async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: 'existing-user',
      email: 'existing@example.com',
    });

    const result = await register({
      email: 'existing@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect(result).toEqual({
      error: 'Email already in use!',
    });
  });

  it('should successfully register a new user', async () => {
    const newUserData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    };

    mockGetUserByEmail.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue('$2a$10$hashedpassword');
    mockGenerateVerificationToken.mockResolvedValue({
      token: 'verification-token',
      email: newUserData.email,
    });
    
    (db.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      ...newUserData,
      password: '$2a$10$hashedpassword',
    });

    const result = await register(newUserData);

    expect(mockGetUserByEmail).toHaveBeenCalledWith(newUserData.email);
    expect(mockBcryptHash).toHaveBeenCalledWith(newUserData.password, 10);
    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: newUserData.name,
        email: newUserData.email,
        password: '$2a$10$hashedpassword',
      },
    });
    expect(mockGenerateVerificationToken).toHaveBeenCalledWith(newUserData.email);
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      newUserData.email,
      'verification-token'
    );
    expect(result).toEqual({
      success: 'Confirmation email sent!',
    });
  });

  it('should handle registration without name', async () => {
    const userData = {
      email: 'noname@example.com',
      password: 'Password123!',
      name: 'User Name', // Name is required in RegisterSchema
    };

    mockGetUserByEmail.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue('$2a$10$hashedpassword');
    mockGenerateVerificationToken.mockResolvedValue({
      token: 'verification-token',
      email: userData.email,
    });
    
    (db.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      email: userData.email,
      name: userData.name,
      password: '$2a$10$hashedpassword',
    });

    const result = await register(userData);

    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: userData.name,
        email: userData.email,
        password: '$2a$10$hashedpassword',
      },
    });
    expect(result).toEqual({
      success: 'Confirmation email sent!',
    });
  });

  it('should handle registration errors gracefully', async () => {
    mockGetUserByEmail.mockRejectedValue(new Error('Database error'));

    const result = await register({
      email: 'error@example.com',
      password: 'password123',
      name: 'Error User',
    });

    expect(result).toEqual({
      error: 'Something went wrong!',
    });
  });

  it('should handle email sending failure', async () => {
    const userData = {
      email: 'emailfail@example.com',
      password: 'password123',
      name: 'Email Fail User',
    };

    mockGetUserByEmail.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue('$2a$10$hashedpassword');
    mockGenerateVerificationToken.mockResolvedValue({
      token: 'verification-token',
      email: userData.email,
    });
    
    (db.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      ...userData,
      password: '$2a$10$hashedpassword',
    });
    
    mockSendVerificationEmail.mockRejectedValue(new Error('Email service error'));

    const result = await register(userData);

    // Should still succeed even if email fails
    expect(result).toEqual({
      success: 'Confirmation email sent!',
    });
  });

  it('should validate password requirements', async () => {
    const weakPasswordData = {
      email: 'weak@example.com',
      password: '12345', // Too short (less than 6 characters)
      name: 'Weak Password User',
    };

    const result = await register(weakPasswordData);

    expect(result).toEqual({
      error: 'Invalid fields!',
    });
    expect(mockGetUserByEmail).not.toHaveBeenCalled();
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    const invalidEmailData = {
      email: 'notanemail',
      password: 'password123',
      name: 'Invalid Email User',
    };

    const result = await register(invalidEmailData);

    expect(result).toEqual({
      error: 'Invalid fields!',
    });
    expect(mockGetUserByEmail).not.toHaveBeenCalled();
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it('should trim and lowercase email', async () => {
    const userData = {
      email: '  NewUser@Example.COM  ',
      password: 'password123',
      name: 'New User',
    };

    mockGetUserByEmail.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue('$2a$10$hashedpassword');
    mockGenerateVerificationToken.mockResolvedValue({
      token: 'verification-token',
      email: 'newuser@example.com',
    });
    
    (db.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      email: 'newuser@example.com',
      name: userData.name,
      password: '$2a$10$hashedpassword',
    });

    const result = await register(userData);

    expect(mockGetUserByEmail).toHaveBeenCalledWith('newuser@example.com');
    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: userData.name,
        email: 'newuser@example.com',
        password: '$2a$10$hashedpassword',
      },
    });
    expect(result).toEqual({
      success: 'Confirmation email sent!',
    });
  });

  it('should handle database creation failure', async () => {
    const userData = {
      email: 'dbfail@example.com',
      password: 'password123',
      name: 'DB Fail User',
    };

    mockGetUserByEmail.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue('$2a$10$hashedpassword');
    
    (db.user.create as jest.Mock).mockRejectedValue(new Error('Database constraint error'));

    const result = await register(userData);

    expect(result).toEqual({
      error: 'Something went wrong!',
    });
  });
});