"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface DebugNestedRepliesProps {
  postId: string;
}

export default function DebugNestedReplies({ postId }: DebugNestedRepliesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commentId, setCommentId] = useState('');
  const [replyId, setReplyId] = useState('');
  const [content, setContent] = useState('Testing nested reply');
  const [depth, setDepth] = useState(3);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!commentId) {
      toast.error('Please enter a comment ID');
      return;
    }

    setLoading(true);
    try {
      // Use the simpler universal endpoint
      const response = await axios.post('/api/create-nested-reply', {
        postId,
        commentId,
        parentReplyId: replyId || null,
        content: `${content} (depth: ${depth})`
      });

      setResult({
        success: true,
        data: response.data
      });
      
      toast.success('Nested reply created successfully');
      
      // If this was successful and we have a replyId, 
      // update the replyId to the new one for next test
      if (response.data?.id) {
        setReplyId(response.data.id);
        setDepth(prevDepth => prevDepth + 1);
      }
    } catch (error: any) {
      logger.error('Error testing nested reply:', error);
      
      setResult({
        success: false,
        error: error.response?.data || error.message || 'Unknown error'
      });
      
      toast.error(error.response?.data?.error || 'Failed to create nested reply');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded fixed bottom-4 right-4 z-50 opacity-70 hover:opacity-100"
      >
        Debug Nested Replies
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80 max-h-[500px] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold">Debug Nested Replies</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-xs mb-1">Comment ID:</label>
          <input
            value={commentId}
            onChange={(e) => setCommentId(e.target.value)}
            className="w-full p-1 text-xs border rounded"
            placeholder="Enter comment ID"
          />
        </div>
        
        <div>
          <label className="block text-xs mb-1">
            Parent Reply ID: {depth > 0 && <span className="text-blue-500">(Depth: {depth})</span>}
          </label>
          <input
            value={replyId}
            onChange={(e) => setReplyId(e.target.value)}
            className="w-full p-1 text-xs border rounded"
            placeholder="Enter parent reply ID (optional)"
          />
        </div>
        
        <div>
          <label className="block text-xs mb-1">Content:</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-1 text-xs border rounded"
            placeholder="Enter reply content"
            rows={2}
          />
        </div>
        
        <Button
          onClick={handleTest}
          disabled={loading}
          className="w-full text-xs py-1"
          size="sm"
        >
          {loading ? 'Testing...' : 'Test Nested Reply'}
        </Button>
        
        {result && (
          <div className="mt-2">
            <p className={`text-xs font-medium ${result.success ? 'text-green-500' : 'text-red-500'}`}>
              {result.success ? 'Success:' : 'Error:'}
            </p>
            <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto max-h-32">
              {JSON.stringify(result.success ? result.data : result.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 