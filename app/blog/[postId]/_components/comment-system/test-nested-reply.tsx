"use client";

import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export default function TestNestedReplies({ postId }: { postId: string }) {
  const [commentId, setCommentId] = useState('');
  const [replyId, setReplyId] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleTestNestedReply = async () => {
    if (!commentId || !replyId || !content) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Make the API call with the correct endpoint and payload
      const result = await axios.post(
        `/api/posts/${postId}/comments/${commentId}/replies`,
        {
          content,
          parentReplyId: replyId
        }
      );

      setResponse(result.data);
      toast.success('Nested reply created successfully');
    } catch (error) {
      logger.error('Error creating nested reply:', error);
      toast.error('Failed to create nested reply');
      setResponse(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-semibold mb-4">Test Nested Replies</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Comment ID:</label>
          <input
            value={commentId}
            onChange={(e) => setCommentId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter comment ID"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Parent Reply ID:</label>
          <input
            value={replyId}
            onChange={(e) => setReplyId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter parent reply ID"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Reply Content:</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter reply content"
          />
        </div>
        
        <Button
          onClick={handleTestNestedReply}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Creating Reply...' : 'Test Nested Reply'}
        </Button>
        
        {response && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Response:</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 