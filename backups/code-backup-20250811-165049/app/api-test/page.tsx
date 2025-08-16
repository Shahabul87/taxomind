"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';

export default function ApiTestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState('0de92129-c605-4d0e-80c3-2d44790a501b');

  const addResult = (test: string, result: any) => {
    setResults(prev => [...prev, {
      test,
      result,
      timestamp: new Date().toISOString()
    }]);
  };

  const testCourseCreation = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/courses', {
        title: `Test Course ${new Date().toISOString()}`
      });
      addResult('Course Creation', { success: true, data: response.data });
    } catch (error: any) {
      addResult('Course Creation', { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status 
      });
    } finally {
      setLoading(false);
    }
  };

  const testCourseUpdate = async () => {
    setLoading(true);
    try {
      const response = await axios.patch(`/api/courses/${courseId}`, {
        description: `Test update ${new Date().toISOString()}`
      });
      addResult('Course Update', { success: true, data: response.data });
    } catch (error: any) {
      addResult('Course Update', { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status 
      });
    } finally {
      setLoading(false);
    }
  };

  const testPriceUpdate = async () => {
    setLoading(true);
    try {
      const response = await axios.patch(`/api/courses/${courseId}`, {
        price: Math.floor(Math.random() * 100) + 10
      });
      addResult('Price Update', { success: true, data: response.data });
    } catch (error: any) {
      addResult('Price Update', { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status 
      });
    } finally {
      setLoading(false);
    }
  };

  const testProductionEndpoint = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/production-test');
      addResult('Production Test', { success: true, data: response.data });
    } catch (error: any) {
      addResult('Production Test', { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status 
      });
    } finally {
      setLoading(false);
    }
  };

  const testDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/debug-course-update');
      addResult('System Diagnostics', { success: true, data: response.data });
    } catch (error: any) {
      addResult('System Diagnostics', { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status 
      });
    } finally {
      setLoading(false);
    }
  };

  const testCourseCheck = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/debug-course-update', {
        courseId: courseId
      });
      addResult('Course Check', { success: true, data: response.data });
    } catch (error: any) {
      addResult('Course Check', { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status 
      });
    } finally {
      setLoading(false);
    }
  };

  const testSimpleEndpoint = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/simple-test');
      addResult('Simple Test', { success: true, data: response.data });
    } catch (error: any) {
      addResult('Simple Test', { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status 
      });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🧪 Production API Testing</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Course ID for Testing:</label>
              <Input
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder="Enter course ID"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button 
              onClick={testSimpleEndpoint}
              disabled={loading}
              variant="outline"
            >
              ✅ Simple Test
            </Button>
            <Button 
              onClick={testDiagnostics}
              disabled={loading}
              variant="outline"
            >
              🔍 Diagnostics
            </Button>
            <Button 
              onClick={testCourseCheck}
              disabled={loading}
              variant="outline"
            >
              📋 Course Check
            </Button>
            <Button 
              onClick={testProductionEndpoint}
              disabled={loading}
              variant="outline"
            >
              Test Production
            </Button>
            <Button 
              onClick={testCourseCreation}
              disabled={loading}
              variant="outline"
            >
              Create Course
            </Button>
            <Button 
              onClick={testCourseUpdate}
              disabled={loading}
              variant="outline"
            >
              Update Course
            </Button>
            <Button 
              onClick={testPriceUpdate}
              disabled={loading}
              variant="outline"
            >
              Update Price
            </Button>
          </div>
          <div className="mt-4">
            <Button 
              onClick={clearResults}
              variant="destructive"
              size="sm"
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click a test button above.</p>
            ) : (
              results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{result.test}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 