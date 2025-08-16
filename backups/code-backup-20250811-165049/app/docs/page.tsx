'use client'

import { useEffect, useState } from 'react'

interface ApiEndpoint {
  method: string
  path: string
  description: string
  tags: string[]
  parameters?: any[]
  requestBody?: any
  responses: any
}

export default function APIDocsPage() {
  const [apiSpec, setApiSpec] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string>('all')

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const response = await fetch('/api/docs')
        if (!response.ok) {
          throw new Error('Failed to fetch API specification')
        }
        const data = await response.json()
        setApiSpec(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSpec()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading API Documentation</h1>
          <p className="text-gray-600">{error}</p>
          <div className="mt-8 p-6 bg-gray-50 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Manual API Documentation</h2>
            <div className="text-left space-y-4">
              <div>
                <h3 className="font-medium text-gray-800">Core Endpoints:</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><code>GET /api/courses</code> - Get all courses</li>
                  <li><code>POST /api/courses</code> - Create new course</li>
                  <li><code>GET /api/courses/[id]</code> - Get course by ID</li>
                  <li><code>PATCH /api/courses/[id]</code> - Update course</li>
                  <li><code>DELETE /api/courses/[id]</code> - Delete course</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Analytics:</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><code>GET /api/analytics</code> - Platform analytics</li>
                  <li><code>GET /api/analytics/students</code> - Student analytics</li>
                  <li><code>POST /api/analytics/web-vitals</code> - Submit performance data</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Authentication:</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>All endpoints require session authentication</li>
                  <li>Role-based access control (ADMIN, TEACHER, STUDENT)</li>
                  <li>Rate limiting: 50 requests/hour</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const endpoints: ApiEndpoint[] = []
  
  // Extract endpoints from paths
  if (apiSpec?.paths) {
    Object.entries(apiSpec.paths).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, details]: [string, any]) => {
        endpoints.push({
          method: method.toUpperCase(),
          path,
          description: details.summary || details.description || '',
          tags: details.tags || [],
          parameters: details.parameters,
          requestBody: details.requestBody,
          responses: details.responses
        })
      })
    })
  }

  const tags = ['all', ...new Set(endpoints.flatMap(e => e.tags))]
  const filteredEndpoints = selectedTag === 'all' 
    ? endpoints 
    : endpoints.filter(e => e.tags.includes(selectedTag))

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200'
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PUT': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'PATCH': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Alam LMS API Documentation
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Comprehensive API documentation for the Learning Management System
          </p>
          
          {/* Quick Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Quick Start</h2>
            <ul className="text-blue-700 space-y-1">
              <li>• All API endpoints require authentication via session cookies</li>
              <li>• Base URL: <code className="bg-blue-100 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api</code></li>
              <li>• All requests and responses use JSON format</li>
              <li>• Rate limiting: 50 requests per hour per user</li>
            </ul>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Core Features</h3>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Course Management</li>
                <li>• User Authentication</li>
                <li>• Progress Tracking</li>
                <li>• Analytics & Reporting</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">Advanced Features</h3>
              <ul className="text-purple-700 text-sm space-y-1">
                <li>• AI Content Generation</li>
                <li>• Real-time Collaboration</li>
                <li>• Performance Monitoring</li>
                <li>• Content Versioning</li>
              </ul>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">Integrations</h3>
              <ul className="text-orange-700 text-sm space-y-1">
                <li>• Stripe Payments</li>
                <li>• Cloudinary Media</li>
                <li>• OpenTelemetry</li>
                <li>• Redis Caching</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tag Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-4">
          {filteredEndpoints.map((endpoint, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-gray-800">{endpoint.path}</code>
                  </div>
                  <div className="flex space-x-1">
                    {endpoint.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600">{endpoint.description}</p>
              </div>
              
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Parameters */}
                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Parameters</h4>
                      <div className="space-y-2">
                        {endpoint.parameters.map((param: any, i: number) => (
                          <div key={i} className="text-sm">
                            <code className="text-blue-600">{param.name}</code>
                            <span className="text-gray-500 ml-2">({param.in})</span>
                            {param.required && <span className="text-red-500 ml-1">*</span>}
                            <p className="text-gray-600 text-xs mt-1">{param.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Responses */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Responses</h4>
                    <div className="space-y-1">
                      {Object.entries(endpoint.responses || {}).map(([code, response]: [string, any]) => (
                        <div key={code} className="text-sm">
                          <span className={`font-mono ${
                            code.startsWith('2') ? 'text-green-600' : 
                            code.startsWith('4') ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {code}
                          </span>
                          <span className="text-gray-600 ml-2">{response.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEndpoints.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No endpoints found for the selected tag.</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-gray-500">
            <p>Built with ❤️ for Alam LMS Platform</p>
            <p className="text-sm mt-2">
              For support, contact: <a href="mailto:support@alamlms.com" className="text-blue-600 hover:underline">support@alamlms.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}