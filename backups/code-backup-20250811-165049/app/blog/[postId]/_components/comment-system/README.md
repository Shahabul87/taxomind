# Comment System

This is a robust comment system for blog posts that supports:

1. Nested comment replies (up to 5 levels deep)
2. Reactions (like, love, etc.)
3. Editing and deleting comments
4. Rate limiting to prevent spam
5. Caching for performance
6. Pagination for heavily commented posts

## Features

### User Commenting
- Users can make comments on posts
- Comment authors can edit and delete their own comments
- Anyone can react to comments with different reaction types

### Replies
- Anyone can reply to comments
- Reply authors can edit and delete their own replies
- Anyone can react to replies

### Nested Replies
- Multiple levels of nested replies are supported (up to 5 levels deep)
- Each level has proper indentation
- Users can edit, delete, and react to nested replies at any level

## Implementation

### Rate Limiting
The system implements rate limiting using Upstash Redis:
- 10 comments per 5 minutes
- 20 replies per 5 minutes
- 50 reactions per 5 minutes

Configuration is done via environment variables:
```
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### Caching Strategy
- Comment lists are cached for heavily commented posts (more than 10 comments)
- Cache invalidation occurs when new comments are added/edited/deleted
- Cached comments include their hierarchical reply structure

### Pagination
- Comments are paginated with 20 comments per page
- URL parameters preserve page and sort state
- Browser navigation (back/forward) is fully supported
- All comment functions work properly with pagination

## API Endpoints

- **GET /api/posts/[postId]/comments** - Get paginated comments for a post
- **POST /api/posts/[postId]/comments** - Create a new comment
- **PATCH /api/posts/[postId]/comments/[commentId]** - Update a comment
- **DELETE /api/posts/[postId]/comments/[commentId]** - Delete a comment
- **POST /api/posts/[postId]/comments/[commentId]/replies** - Create a reply
- **POST /api/create-nested-reply** - Create a nested reply
- **PATCH /api/update-nested-reply** - Update a nested reply
- **DELETE /api/delete-nested-reply** - Delete a nested reply and its children
- **POST /api/comment-reaction** - Add/remove a reaction

## Components

- `CommentSection.tsx` - Main container component
- `Comment.tsx` - Individual comment component (recursive for nested replies)
- `CommentBox.tsx` - Input component for adding comments/replies
- `ReactionButton.tsx` - Button for adding/removing reactions
- `CommentPagination.tsx` - Pagination component for comments 