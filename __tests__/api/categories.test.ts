/**
 * Tests for Categories API Route - app/api/categories/route.ts
 *
 * Covers: POST (create category), GET (list all categories)
 *
 * POST behavior:
 *   1. Require authentication (401 if not logged in)
 *   2. Validate request body - name is required and must be a string (400)
 *   3. Check for existing category (case-insensitive) - return existing if found
 *   4. Create new category if not found
 *   5. Handle database errors (500)
 *   6. Handle malformed JSON (400)
 *
 * GET behavior:
 *   1. Return all categories ordered by name ascending (take 500)
 *   2. Handle database errors (500)
 */

// @/lib/db, @/lib/auth, @/lib/logger, next/server are globally mocked in jest.setup.js

import { POST, GET } from '@/app/api/categories/route';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPostRequest(body?: Record<string, unknown> | string) {
  if (typeof body === 'string') {
    // raw body string (for malformed JSON tests)
    return new Request('http://localhost:3000/api/categories', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Request('http://localhost:3000/api/categories', {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
  });
}

function createGetRequest() {
  return new Request('http://localhost:3000/api/categories', {
    method: 'GET',
  });
}

// ---------------------------------------------------------------------------
// POST /api/categories
// ---------------------------------------------------------------------------

describe('POST /api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test User' });
    (db.category.findFirst as jest.Mock).mockResolvedValue(null);
    (db.category.create as jest.Mock).mockResolvedValue({
      id: 'cat-1',
      name: 'Programming',
    });
  });

  // ---- Authentication ----

  it('returns 401 when user is not authenticated (null user)', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createPostRequest({ name: 'Programming' }));

    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID User' });

    const res = await POST(createPostRequest({ name: 'Programming' }));

    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toBe('Unauthorized');
  });

  // ---- Validation ----

  it('returns 400 when name is missing from body', async () => {
    const res = await POST(createPostRequest({}));

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Name is required');
  });

  it('returns 400 when name is an empty string', async () => {
    const res = await POST(createPostRequest({ name: '' }));

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Name is required');
  });

  it('returns 400 when name is not a string (number)', async () => {
    const res = await POST(createPostRequest({ name: 123 }));

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Name is required');
  });

  it('returns 400 when name is null', async () => {
    const res = await POST(createPostRequest({ name: null }));

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Name is required');
  });

  it('returns 400 when body is invalid JSON', async () => {
    const res = await POST(createPostRequest('not-valid-json{'));

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid JSON in request body');
  });

  // ---- Existing category (case-insensitive) ----

  it('returns existing category when name already exists (case-insensitive)', async () => {
    const existingCategory = { id: 'cat-existing', name: 'Programming' };
    (db.category.findFirst as jest.Mock).mockResolvedValue(existingCategory);

    const res = await POST(createPostRequest({ name: 'programming' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('cat-existing');
    expect(body.name).toBe('Programming');
    expect(db.category.create).not.toHaveBeenCalled();
  });

  it('performs case-insensitive search using findFirst with mode insensitive', async () => {
    (db.category.findFirst as jest.Mock).mockResolvedValue(null);

    await POST(createPostRequest({ name: 'Web Development' }));

    expect(db.category.findFirst).toHaveBeenCalledWith({
      where: {
        name: {
          equals: 'Web Development',
          mode: 'insensitive',
        },
      },
    });
  });

  // ---- Successful creation ----

  it('creates a new category when it does not exist', async () => {
    const newCategory = { id: 'cat-new', name: 'Data Science' };
    (db.category.findFirst as jest.Mock).mockResolvedValue(null);
    (db.category.create as jest.Mock).mockResolvedValue(newCategory);

    const res = await POST(createPostRequest({ name: 'Data Science' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('cat-new');
    expect(body.name).toBe('Data Science');
    expect(db.category.create).toHaveBeenCalledWith({
      data: { name: 'Data Science' },
    });
  });

  it('passes exact name to create (preserves casing)', async () => {
    (db.category.findFirst as jest.Mock).mockResolvedValue(null);
    (db.category.create as jest.Mock).mockResolvedValue({
      id: 'cat-2',
      name: 'Machine Learning',
    });

    await POST(createPostRequest({ name: 'Machine Learning' }));

    expect(db.category.create).toHaveBeenCalledWith({
      data: { name: 'Machine Learning' },
    });
  });

  // ---- Error handling ----

  it('returns 500 when database findFirst throws', async () => {
    (db.category.findFirst as jest.Mock).mockRejectedValue(
      new Error('DB connection lost')
    );

    const res = await POST(createPostRequest({ name: 'Test' }));

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('Internal Error');
  });

  it('returns 500 when database create throws', async () => {
    (db.category.findFirst as jest.Mock).mockResolvedValue(null);
    (db.category.create as jest.Mock).mockRejectedValue(
      new Error('Unique constraint violation')
    );

    const res = await POST(createPostRequest({ name: 'Test' }));

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('Internal Error');
  });

  it('returns 500 when currentUser throws an unexpected error', async () => {
    mockCurrentUser.mockRejectedValue(new Error('Auth service down'));

    const res = await POST(createPostRequest({ name: 'Test' }));

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('Internal Error');
  });
});

// ---------------------------------------------------------------------------
// GET /api/categories
// ---------------------------------------------------------------------------

describe('GET /api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all categories ordered by name ascending', async () => {
    const categories = [
      { id: 'cat-1', name: 'Art' },
      { id: 'cat-2', name: 'Business' },
      { id: 'cat-3', name: 'Computer Science' },
    ];
    (db.category.findMany as jest.Mock).mockResolvedValue(categories);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(categories);
    expect(body).toHaveLength(3);
  });

  it('calls findMany with correct orderBy and take parameters', async () => {
    (db.category.findMany as jest.Mock).mockResolvedValue([]);

    await GET();

    expect(db.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      take: 500,
    });
  });

  it('returns empty array when no categories exist', async () => {
    (db.category.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it('returns 500 when database findMany throws', async () => {
    (db.category.findMany as jest.Mock).mockRejectedValue(
      new Error('DB timeout')
    );

    const res = await GET();

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('Internal Error');
  });

  it('does not require authentication', async () => {
    // GET does not call currentUser at all
    (db.category.findMany as jest.Mock).mockResolvedValue([
      { id: 'cat-1', name: 'Test' },
    ]);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(mockCurrentUser).not.toHaveBeenCalled();
  });
});
