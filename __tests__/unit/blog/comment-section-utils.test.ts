/**
 * Unit tests for CommentSection tree utility logic
 * Tests the core data handling that was fixed:
 * - API response unwrapping (extractApiData)
 * - Tree traversal (findItemInTree, findInReplies)
 * - Tree mutations (updateItemInTree, removeItemFromTree, addReplyToTree)
 * - Comment building from API response (buildCommentFromResponse)
 *
 * These are pure function tests extracted from the component logic.
 */

interface Comment {
  id: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  postId: string;
  parentId: string | null;
  depth: number;
  User?: { id: string; name: string | null; image: string | null };
  user?: { id: string; name: string | null; image: string | null };
  _count?: { replies: number; reactions: number };
  replies?: Comment[];
  isLiked?: boolean;
  likeCount?: number;
}

// ---------- Pure utility functions extracted from the component ----------

function extractApiData(response: { data: Record<string, unknown> }): Record<string, unknown> {
  const body = response.data;
  if ('success' in body && 'data' in body && typeof body.data === 'object' && body.data !== null) {
    return body.data as Record<string, unknown>;
  }
  return body;
}

function findInReplies(
  replies: Comment[],
  targetId: string
): { depth: number } | null {
  for (const reply of replies) {
    if (reply.id === targetId) return { depth: reply.depth || 0 };
    if (reply.replies) {
      const found = findInReplies(reply.replies, targetId);
      if (found) return found;
    }
  }
  return null;
}

function findItemInTree(
  comments: Comment[],
  itemId: string
): { type: 'comment' | 'reply'; rootCommentId: string; depth: number } | null {
  for (const comment of comments) {
    if (comment.id === itemId) {
      return { type: 'comment', rootCommentId: comment.id, depth: 0 };
    }
    if (comment.replies) {
      const found = findInReplies(comment.replies, itemId);
      if (found) {
        return { type: 'reply', rootCommentId: comment.id, depth: found.depth };
      }
    }
  }
  return null;
}

function updateItemInTree(
  items: Comment[],
  targetId: string,
  updater: (item: Comment) => Comment
): Comment[] {
  return items.map((item) => {
    if (item.id === targetId) return updater(item);
    if (item.replies) {
      return { ...item, replies: updateItemInTree(item.replies, targetId, updater) };
    }
    return item;
  });
}

function removeItemFromTree(items: Comment[], targetId: string): Comment[] {
  return items
    .filter((item) => item.id !== targetId)
    .map((item) => {
      if (item.replies) {
        return { ...item, replies: removeItemFromTree(item.replies, targetId) };
      }
      return item;
    });
}

function addReplyToTree(
  items: Comment[],
  parentId: string,
  newReply: Comment
): Comment[] {
  return items.map((item) => {
    if (item.id === parentId) {
      return { ...item, replies: [...(item.replies || []), newReply] };
    }
    if (item.replies) {
      return { ...item, replies: addReplyToTree(item.replies, parentId, newReply) };
    }
    return item;
  });
}

// ---------- Test Data ----------

function createComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-1',
    content: 'Test comment',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    userId: 'user-1',
    postId: 'post-1',
    parentId: null,
    depth: 0,
    User: { id: 'user-1', name: 'Test User', image: null },
    replies: [],
    isLiked: false,
    likeCount: 0,
    ...overrides,
  };
}

function createNestedComments(): Comment[] {
  return [
    createComment({
      id: 'c1',
      content: 'Top-level 1',
      replies: [
        createComment({
          id: 'r1',
          content: 'Reply 1',
          parentId: 'c1',
          depth: 1,
          replies: [
            createComment({
              id: 'r1-1',
              content: 'Nested reply 1-1',
              parentId: 'r1',
              depth: 2,
              replies: [],
            }),
          ],
        }),
        createComment({
          id: 'r2',
          content: 'Reply 2',
          parentId: 'c1',
          depth: 1,
          replies: [],
        }),
      ],
    }),
    createComment({
      id: 'c2',
      content: 'Top-level 2',
      replies: [],
    }),
  ];
}

// ============================================================================
// extractApiData
// ============================================================================

describe('extractApiData', () => {
  it('unwraps data from { success, data } response wrapper', () => {
    const response = {
      data: {
        success: true,
        data: { id: 'comment-1', content: 'Hello', userId: 'user-1' },
        meta: { timestamp: '2026-01-01T00:00:00Z' },
      },
    };

    const result = extractApiData(response);

    expect(result).toEqual({ id: 'comment-1', content: 'Hello', userId: 'user-1' });
  });

  it('returns body as-is when not wrapped', () => {
    const response = {
      data: { id: 'comment-1', content: 'Hello', userId: 'user-1' },
    };

    const result = extractApiData(response);

    expect(result).toEqual({ id: 'comment-1', content: 'Hello', userId: 'user-1' });
  });

  it('handles wrapped response with null data gracefully', () => {
    const response = {
      data: { success: true, data: null },
    };

    const result = extractApiData(response as { data: Record<string, unknown> });

    // When data is null, falls back to returning the full body
    expect(result).toEqual({ success: true, data: null });
  });

  it('extracts User and relations from wrapped response', () => {
    const response = {
      data: {
        success: true,
        data: {
          id: 'comment-1',
          content: 'Test',
          User: { id: 'user-1', name: 'Alice', image: '/avatar.jpg' },
          reactions: [],
          replies: [],
        },
        meta: { timestamp: '2026-01-01' },
      },
    };

    const result = extractApiData(response);

    expect(result).toHaveProperty('User');
    expect((result as { User: { name: string } }).User.name).toBe('Alice');
    expect(result).not.toHaveProperty('success');
    expect(result).not.toHaveProperty('meta');
  });
});

// ============================================================================
// findItemInTree
// ============================================================================

describe('findItemInTree', () => {
  it('finds a top-level comment', () => {
    const comments = createNestedComments();
    const result = findItemInTree(comments, 'c1');

    expect(result).toEqual({
      type: 'comment',
      rootCommentId: 'c1',
      depth: 0,
    });
  });

  it('finds a second top-level comment', () => {
    const comments = createNestedComments();
    const result = findItemInTree(comments, 'c2');

    expect(result).toEqual({
      type: 'comment',
      rootCommentId: 'c2',
      depth: 0,
    });
  });

  it('finds a direct reply', () => {
    const comments = createNestedComments();
    const result = findItemInTree(comments, 'r1');

    expect(result).toEqual({
      type: 'reply',
      rootCommentId: 'c1',
      depth: 1,
    });
  });

  it('finds a deeply nested reply', () => {
    const comments = createNestedComments();
    const result = findItemInTree(comments, 'r1-1');

    expect(result).toEqual({
      type: 'reply',
      rootCommentId: 'c1',
      depth: 2,
    });
  });

  it('returns null for non-existent item', () => {
    const comments = createNestedComments();
    const result = findItemInTree(comments, 'non-existent');

    expect(result).toBeNull();
  });

  it('returns null for empty comments array', () => {
    const result = findItemInTree([], 'some-id');

    expect(result).toBeNull();
  });
});

// ============================================================================
// updateItemInTree
// ============================================================================

describe('updateItemInTree', () => {
  it('updates a top-level comment', () => {
    const comments = createNestedComments();
    const result = updateItemInTree(comments, 'c1', (item) => ({
      ...item,
      content: 'Updated content',
    }));

    expect(result[0].content).toBe('Updated content');
    expect(result[1].content).toBe('Top-level 2'); // unchanged
  });

  it('updates a nested reply', () => {
    const comments = createNestedComments();
    const result = updateItemInTree(comments, 'r1-1', (item) => ({
      ...item,
      content: 'Updated nested reply',
    }));

    expect(result[0].replies![0].replies![0].content).toBe('Updated nested reply');
  });

  it('toggles like state on a reply', () => {
    const comments = createNestedComments();
    const result = updateItemInTree(comments, 'r2', (item) => ({
      ...item,
      isLiked: !item.isLiked,
      likeCount: (item.likeCount || 0) + 1,
    }));

    expect(result[0].replies![1].isLiked).toBe(true);
    expect(result[0].replies![1].likeCount).toBe(1);
  });

  it('does not mutate the original array', () => {
    const comments = createNestedComments();
    const originalContent = comments[0].content;
    updateItemInTree(comments, 'c1', (item) => ({
      ...item,
      content: 'Changed',
    }));

    expect(comments[0].content).toBe(originalContent);
  });

  it('returns unchanged array when target not found', () => {
    const comments = createNestedComments();
    const result = updateItemInTree(comments, 'non-existent', (item) => ({
      ...item,
      content: 'Changed',
    }));

    expect(result[0].content).toBe('Top-level 1');
    expect(result[1].content).toBe('Top-level 2');
  });
});

// ============================================================================
// removeItemFromTree
// ============================================================================

describe('removeItemFromTree', () => {
  it('removes a top-level comment', () => {
    const comments = createNestedComments();
    const result = removeItemFromTree(comments, 'c1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c2');
  });

  it('removes a direct reply', () => {
    const comments = createNestedComments();
    const result = removeItemFromTree(comments, 'r2');

    expect(result[0].replies).toHaveLength(1);
    expect(result[0].replies![0].id).toBe('r1');
  });

  it('removes a deeply nested reply', () => {
    const comments = createNestedComments();
    const result = removeItemFromTree(comments, 'r1-1');

    expect(result[0].replies![0].replies).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const comments = createNestedComments();
    removeItemFromTree(comments, 'c1');

    expect(comments).toHaveLength(2);
  });

  it('returns same structure when target not found', () => {
    const comments = createNestedComments();
    const result = removeItemFromTree(comments, 'non-existent');

    expect(result).toHaveLength(2);
    expect(result[0].replies).toHaveLength(2);
  });
});

// ============================================================================
// addReplyToTree
// ============================================================================

describe('addReplyToTree', () => {
  const newReply = createComment({
    id: 'new-reply',
    content: 'New reply!',
    parentId: 'c1',
    depth: 1,
  });

  it('adds a reply to a top-level comment', () => {
    const comments = createNestedComments();
    const result = addReplyToTree(comments, 'c1', newReply);

    expect(result[0].replies).toHaveLength(3); // was 2, now 3
    expect(result[0].replies![2].id).toBe('new-reply');
  });

  it('adds a nested reply to an existing reply', () => {
    const comments = createNestedComments();
    const nestedReply = createComment({
      id: 'nested-new',
      content: 'Nested new!',
      parentId: 'r1',
      depth: 2,
    });
    const result = addReplyToTree(comments, 'r1', nestedReply);

    expect(result[0].replies![0].replies).toHaveLength(2); // was 1, now 2
    expect(result[0].replies![0].replies![1].id).toBe('nested-new');
  });

  it('adds a reply to a deeply nested parent', () => {
    const comments = createNestedComments();
    const deepReply = createComment({
      id: 'deep-new',
      content: 'Deep new!',
      parentId: 'r1-1',
      depth: 3,
    });
    const result = addReplyToTree(comments, 'r1-1', deepReply);

    expect(result[0].replies![0].replies![0].replies).toHaveLength(1);
    expect(result[0].replies![0].replies![0].replies![0].id).toBe('deep-new');
  });

  it('does not mutate the original array', () => {
    const comments = createNestedComments();
    addReplyToTree(comments, 'c1', newReply);

    expect(comments[0].replies).toHaveLength(2);
  });

  it('does nothing when parent not found', () => {
    const comments = createNestedComments();
    const result = addReplyToTree(comments, 'non-existent', newReply);

    expect(result[0].replies).toHaveLength(2);
    expect(result[1].replies).toHaveLength(0);
  });

  it('initializes replies array when parent has undefined replies', () => {
    const comment = createComment({ id: 'c3', replies: undefined });
    const comments = [comment];
    // addReplyToTree checks `item.replies` which is undefined, so it won't recurse
    // The parent won't be found in recursion, but direct match works
    const result = addReplyToTree(comments, 'c3', newReply);

    expect(result[0].replies).toHaveLength(1);
    expect(result[0].replies![0].id).toBe('new-reply');
  });
});
