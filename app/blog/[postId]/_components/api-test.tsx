"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export default function ApiTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{[key: string]: boolean}>({});
  const [testPostResult, setTestPostResult] = useState<any>(null);
  const [reactionTestResult, setReactionTestResult] = useState<any>(null);

  const testApiEndpoints = async () => {
    setTesting(true);
    const endpoints = [
      '/api/test', // Simple test endpoint that should always work
      '/api/create-nested-reply',
      '/api/nested-replies',
      '/api/comment-reaction' // New universal reaction endpoint
    ];
    
    const newResults: {[key: string]: boolean} = {};
    
    for (const endpoint of endpoints) {
      try {
        // Just do a simple OPTIONS request to check if the endpoint exists
        await axios.options(endpoint);
        newResults[endpoint] = true;

      } catch (error: any) {
        logger.error(`Error testing ${endpoint}:`, error);
        const statusCode = error.response?.status;
        // If we get a 405 Method Not Allowed, the endpoint exists but doesn't support OPTIONS
        // 401/403 means it exists but we're not authenticated
        if (statusCode === 405 || statusCode === 401 || statusCode === 403) {
          newResults[endpoint] = true;
          console.log(`API endpoint ${endpoint} exists (status: ${statusCode})`);
        } else {
          newResults[endpoint] = false;
          console.log(`API endpoint ${endpoint} does not exist (status: ${statusCode || 'unknown'})`);
        }
      }
    }
    
    setResults(newResults);
    setTesting(false);
    
    const allEndpointsExist = Object.values(newResults).every(result => result);
    if (allEndpointsExist) {
      toast.success('All API endpoints are configured');
    } else {
      toast.error('Some API endpoints are missing or misconfigured');
    }
  };

  const testDirectPost = async () => {
    setTesting(true);
    try {
      // Try a direct POST to our test endpoint
      const response = await axios.post('/api/test', {
        testData: 'This is a test POST request',
        timestamp: new Date().toISOString()
      });
      
      setTestPostResult({
        success: true,
        data: response.data
      });
      
      toast.success('Test POST successful');
    } catch (error: any) {
      logger.error('Test POST failed:', error);
      
      setTestPostResult({
        success: false,
        error: error.response?.data || error.message || 'Unknown error',
        status: error.response?.status
      });
      
      toast.error(`Test POST failed: ${error.response?.status || 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const testReactionApi = async () => {
    setTesting(true);
    try {
      // Create a test payload for the reaction API
      const payload = {
        type: 'like',
        postId: 'test-post-id',
        commentId: 'test-comment-id',
        // Include both comment and reply for testing
      };

      // Make the API request
      const response = await axios.post('/api/comment-reaction', payload);
      
      setReactionTestResult({
        success: true,
        data: response.data,
        endpoint: '/api/comment-reaction'
      });
      
      toast.success('Reaction API test successful');
      
      // Also test the nested reply reaction API
      try {
        const nestedPayload = {
          type: 'like',
          postId: 'test-post-id',
          replyId: 'test-reply-id',
        };

        const nestedResponse = await axios.post('/api/comment-reaction', nestedPayload);

        toast.success('Nested reply reaction API test successful');
      } catch (nestedError) {
        logger.error('Nested reply reaction API test failed:', nestedError);
        toast.error(`Nested reply test failed: ${nestedError.response?.status || 'Unknown error'}`);
      }
    } catch (error: any) {
      logger.error('Reaction API test failed:', error);
      
      setReactionTestResult({
        success: false,
        error: error.response?.data || error.message || 'Unknown error',
        status: error.response?.status,
        endpoint: '/api/comment-reaction'
      });
      
      // Even a 404 (not found) is useful info for debugging
      const message = error.response?.status === 404 
        ? 'Reaction API endpoint not found (404)' 
        : `Reaction API test failed: ${error.response?.status || 'Unknown error'}`;
      
      toast.error(message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={testApiEndpoints}
          disabled={testing}
          className="text-xs"
        >
          {testing ? 'Testing APIs...' : 'Test API Endpoints'}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={testDirectPost}
          disabled={testing}
          className="text-xs"
        >
          Test POST
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={testReactionApi}
          disabled={testing}
          className="text-xs"
        >
          Test Reaction
        </Button>
      </div>
      
      {Object.keys(results).length > 0 && (
        <div className="bg-white dark:bg-gray-800 mt-2 p-2 rounded border text-xs">
          {Object.entries(results).map(([endpoint, exists]) => (
            <div key={endpoint} className="flex items-center gap-2 mb-1">
              <span className={`w-3 h-3 rounded-full ${exists ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>{endpoint}: {exists ? 'Available' : 'Missing'}</span>
            </div>
          ))}
        </div>
      )}
      
      {testPostResult && (
        <div className="bg-white dark:bg-gray-800 mt-2 p-2 rounded border text-xs max-w-md overflow-auto">
          <h4 className={`font-medium ${testPostResult.success ? 'text-green-500' : 'text-red-500'}`}>
            POST Test: {testPostResult.success ? 'Success' : 'Failed'}
          </h4>
          <pre className="mt-1 text-xs overflow-auto max-h-32">
            {JSON.stringify(testPostResult.success ? testPostResult.data : testPostResult.error, null, 2)}
          </pre>
        </div>
      )}
      
      {reactionTestResult && (
        <div className="bg-white dark:bg-gray-800 mt-2 p-2 rounded border text-xs max-w-md overflow-auto">
          <h4 className={`font-medium ${reactionTestResult.success ? 'text-green-500' : 'text-red-500'}`}>
            Reaction API Test: {reactionTestResult.success ? 'Success' : 'Failed'}
          </h4>
          <pre className="mt-1 text-xs overflow-auto max-h-32">
            {JSON.stringify(reactionTestResult.success ? reactionTestResult.data : reactionTestResult.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 