// jest.polyfills.js
import { TextEncoder, TextDecoder } from 'util'

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock URL constructor for Node.js environment
if (typeof globalThis.URL === 'undefined') {
  const { URL, URLSearchParams } = require('url')
  globalThis.URL = URL
  globalThis.URLSearchParams = URLSearchParams
}

// Polyfill for AbortSignal.timeout (not available in jsdom)
if (typeof AbortSignal.timeout !== 'function') {
  AbortSignal.timeout = function(ms) {
    const controller = new AbortController()
    setTimeout(() => controller.abort(new DOMException('The operation was aborted due to timeout', 'TimeoutError')), ms)
    return controller.signal
  }
}

// Polyfill for crypto
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto')
  globalThis.crypto = {
    getRandomValues: (array) => crypto.randomFillSync(array),
    randomUUID: () => crypto.randomUUID(),
  }
}

// Polyfill for Request and Response
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {
    constructor(url, options = {}) {
      this.url = url
      this.method = options.method || 'GET'
      this.headers = new Map(Object.entries(options.headers || {}))
      this.body = options.body
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'))
    }
    
    text() {
      return Promise.resolve(this.body || '')
    }
  }
}

if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    constructor(body, options = {}) {
      this.body = body
      this.status = options.status || 200
      this.statusText = options.statusText || 'OK'
      this.headers = new Map(Object.entries(options.headers || {}))
      this.ok = this.status >= 200 && this.status < 300
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'))
    }
    
    text() {
      return Promise.resolve(this.body || '')
    }
  }
}