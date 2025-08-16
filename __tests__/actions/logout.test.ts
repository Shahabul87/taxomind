import { logout } from '@/actions/logout';
import { signOut } from '@/auth';

jest.mock('@/auth', () => ({
  signOut: jest.fn(),
}));

const mockSignOut = signOut as jest.Mock;

describe('logout action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call signOut successfully', async () => {
    mockSignOut.mockResolvedValue(undefined);

    await logout();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledWith();
  });

  it('should handle signOut errors', async () => {
    mockSignOut.mockRejectedValue(new Error('Sign out failed'));

    await expect(logout()).rejects.toThrow('Sign out failed');
  });

  it('should not pass any parameters to signOut', async () => {
    mockSignOut.mockResolvedValue(undefined);

    await logout();

    expect(mockSignOut).toHaveBeenCalledWith();
    expect(mockSignOut.mock.calls[0]).toHaveLength(0);
  });
});