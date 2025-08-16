import { getUserByEmail, getUserById } from '@/data/user';
import { db } from '@/lib/db';

jest.mock('@/lib/db');

describe('User Data Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null for non-existent email', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      (db.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(getUserByEmail('test@example.com')).rejects.toThrow('DB Error');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserById('user-1');

      expect(result).toEqual(mockUser);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });
});