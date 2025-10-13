import { getAnalytics } from '@/actions/get-analytics';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

describe('getAnalytics action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return analytics data for a user', async () => {
    const userId = 'user-1';
    
    // Mock data
    (getAnalytics as jest.Mock).mockResolvedValue([
      { courseId: 'course-1', _sum: { amount: 99.99 } },
      { courseId: 'course-2', _sum: { amount: 149.99 } },
    ]);
    
    (getAnalytics as jest.Mock).mockResolvedValue(5);

    const result = await getAnalytics(userId);

    expect(result).toEqual({
      data: [
        { name: 'Total Revenue', value: 249.98 },
        { name: 'Total Sales', value: 5 },
      ],
      totalRevenue: 249.98,
      totalSales: 5,
    });

    expect(getAnalytics).toHaveBeenCalledWith({
      by: ['courseId'],
      where: {
        course: {
          userId,
        },
      },
      _sum: {
        amount: true,
      },
    });

    expect(getAnalytics).toHaveBeenCalledWith({
      where: {
        course: {
          userId,
        },
      },
    });
  });

  it('should return zero values when user has no sales', async () => {
    (getAnalytics as jest.Mock).mockResolvedValue([]);
    (getAnalytics as jest.Mock).mockResolvedValue(0);

    const result = await getAnalytics('user-2');

    expect(result).toEqual({
      data: [
        { name: 'Total Revenue', value: 0 },
        { name: 'Total Sales', value: 0 },
      ],
      totalRevenue: 0,
      totalSales: 0,
    });
  });

  it('should handle null amounts correctly', async () => {
    (getAnalytics as jest.Mock).mockResolvedValue([
      { courseId: 'course-1', _sum: { amount: null } },
      { courseId: 'course-2', _sum: { amount: 50 } },
    ]);
    
    (getAnalytics as jest.Mock).mockResolvedValue(2);

    const result = await getAnalytics('user-1');

    expect(result.totalRevenue).toBe(50);
    expect(result.totalSales).toBe(2);
  });

  it('should handle database errors', async () => {
    (getAnalytics as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(getAnalytics('user-1')).rejects.toThrow('Database error');
  });
});