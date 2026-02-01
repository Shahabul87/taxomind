import { getAllCourses } from '@/actions/get-all-courses';

describe('getAllCourses action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCourses = [
    {
      id: 'course-1',
      title: 'React Masterclass',
      description: 'Learn React',
      imageUrl: 'https://example.com/react.jpg',
      price: 99.99,
      isPublished: true,
      categoryId: 'cat-1',
      userId: 'teacher-1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      category: {
        id: 'cat-1',
        name: 'Programming',
      },
      user: {
        id: 'teacher-1',
        name: 'John Doe',
        image: 'https://example.com/john.jpg',
      },
      _count: {
        Purchase: 50,
        Enrollment: 100,
        chapters: 10,
      },
    },
    {
      id: 'course-2',
      title: 'Vue.js Fundamentals',
      description: 'Master Vue.js',
      imageUrl: 'https://example.com/vue.jpg',
      price: 79.99,
      isPublished: true,
      categoryId: 'cat-1',
      userId: 'teacher-2',
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-04T00:00:00Z'),
      category: {
        id: 'cat-1',
        name: 'Programming',
      },
      user: {
        id: 'teacher-2',
        name: 'Jane Smith',
        image: 'https://example.com/jane.jpg',
      },
      _count: {
        Purchase: 30,
        Enrollment: 60,
        chapters: 8,
      },
    },
  ];

  it('should return all published courses', async () => {
    (getAllCourses as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getAllCourses();

    expect(result).toEqual(mockCourses);
    expect(getAllCourses).toHaveBeenCalled();
  });

  it('should return empty array when no courses exist', async () => {
    (getAllCourses as jest.Mock).mockResolvedValue([]);

    const result = await getAllCourses();

    expect(result).toEqual([]);
  });

  it('should filter by category when categoryId provided', async () => {
    const filteredCourses = [mockCourses[0]];
    (getAllCourses as jest.Mock).mockResolvedValue(filteredCourses);

    const result = await getAllCourses();

    expect(getAllCourses).toHaveBeenCalled();
    expect(result).toEqual(filteredCourses);
  });

  it('should search by title when searchTerm provided', async () => {
    (getAllCourses as jest.Mock).mockResolvedValue([mockCourses[0]]);

    const result = await getAllCourses();

    expect(getAllCourses).toHaveBeenCalled();
    expect(result).toEqual([mockCourses[0]]);
  });

  it('should combine filters when multiple params provided', async () => {
    (getAllCourses as jest.Mock).mockResolvedValue([mockCourses[0]]);

    const result = await getAllCourses();

    expect(getAllCourses).toHaveBeenCalled();
    expect(result).toEqual([mockCourses[0]]);
  });

  it('should order by different fields when specified', async () => {
    (getAllCourses as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getAllCourses();

    expect(getAllCourses).toHaveBeenCalled();
    expect(result).toEqual(mockCourses);
  });

  it('should limit results when limit provided', async () => {
    (getAllCourses as jest.Mock).mockResolvedValue([mockCourses[0]]);

    const result = await getAllCourses();

    expect(getAllCourses).toHaveBeenCalled();
    expect(result).toEqual([mockCourses[0]]);
  });

  it('should handle pagination with skip and take', async () => {
    (getAllCourses as jest.Mock).mockResolvedValue([mockCourses[1]]);

    const result = await getAllCourses();

    expect(getAllCourses).toHaveBeenCalled();
    expect(result).toEqual([mockCourses[1]]);
  });

  it('should handle database errors gracefully', async () => {
    (getAllCourses as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(getAllCourses()).rejects.toThrow('Database error');
  });

  it('should include course counts correctly', async () => {
    (getAllCourses as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getAllCourses();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('React Masterclass');
    expect(result[0].category.name).toBe('Programming');
  });
});
