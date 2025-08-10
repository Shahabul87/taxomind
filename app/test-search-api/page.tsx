"use client"

import { useState, useEffect } from 'react';
import { SearchService } from '../(homepage)/services/search-service';
import { logger } from '@/lib/logger';

export default function TestSearchAPI() {
  const [query, setQuery] = useState('react');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [requestUrl, setRequestUrl] = useState('/api/search/mock?q=react');
  const [responseDetails, setResponseDetails] = useState<string>('');
  
  // Function to directly test the API using fetch
  async function testDirectFetch() {
    setLoading(true);
    setError(null);
    setResults([]);
    setResponseDetails('');
    
    try {

      const fetchResponse = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });
      
      setDebugInfo({
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: Object.fromEntries(fetchResponse.headers.entries()),
        url: fetchResponse.url,
        redirected: fetchResponse.redirected,
        type: fetchResponse.type
      });
      
      // Get response as text first
      const responseText = await fetchResponse.text();
      setResponseDetails(responseText);
      
      // Try to parse JSON
      try {
        const data = JSON.parse(responseText);
        
        if (data.results && Array.isArray(data.results)) {
          setResults(data.results);
        } else if (Array.isArray(data)) {
          setResults(data);
        } else {
          setResults([]);
          setError('Response is valid JSON but does not contain expected results array');
        }
      } catch (jsonError) {
        const errorMessage = jsonError && typeof jsonError === 'object' && 'message' in jsonError 
          ? jsonError.message 
          : 'Unknown JSON parsing error';
        setError(`Failed to parse response as JSON: ${errorMessage}`);
      }
    } catch (fetchError) {
      const errorMessage = fetchError && typeof fetchError === 'object' && 'message' in fetchError 
        ? fetchError.message 
        : 'Unknown fetch error';
      setError(`Fetch error: ${errorMessage}`);
      logger.error('Fetch error:', fetchError);
    } finally {
      setLoading(false);
    }
  }
  
  // Function to test through our service
  async function testSearchService() {
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      // Use our service

      // Configure which API to use
      const useMockApi = false; // False to use real API, true to use mock
      SearchService.useMockApi = useMockApi;
      SearchService.useEmergencyFallback = false;
      
      const serviceResults = await SearchService.searchContent(query);

      setResults(serviceResults);
    } catch (serviceError) {
      const errorMessage = serviceError && typeof serviceError === 'object' && 'message' in serviceError 
        ? serviceError.message 
        : 'Unknown service error';
      setError(`Service error: ${errorMessage}`);
      logger.error('Service error:', serviceError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Search API Test Page</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Direct Fetch</h2>
        <div className="mb-4">
          <label className="block mb-2">API URL:</label>
          <input
            type="text"
            value={requestUrl}
            onChange={(e) => setRequestUrl(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <button
          onClick={testDirectFetch}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
        >
          {loading ? 'Testing...' : 'Test Direct Fetch'}
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Search Service</h2>
        <div className="mb-4">
          <label className="block mb-2">Search Query:</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <button
          onClick={testSearchService}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Testing...' : 'Test Search Service'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded mb-6">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {Object.keys(debugInfo).length > 0 && (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded mb-6">
          <h3 className="font-bold mb-2">Response Debug Info:</h3>
          <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
      
      {responseDetails && (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded mb-6 max-h-40 overflow-auto">
          <h3 className="font-bold mb-2">Raw Response:</h3>
          <pre className="whitespace-pre-wrap">{responseDetails}</pre>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h3 className="text-xl font-semibold mb-4">Results ({results.length}):</h3>
          <ul className="divide-y dark:divide-gray-700">
            {results.map((result, index) => (
              <li key={index} className="py-4">
                <div className="font-medium">{result.title || 'Untitled'}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {result.type || 'Unknown type'} - ID: {result.id || 'No ID'}
                </div>
                <div className="mt-1">{result.snippet || 'No description'}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 