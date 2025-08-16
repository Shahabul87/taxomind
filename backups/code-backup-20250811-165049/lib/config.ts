/**
 * Environment configuration helper
 * Centralizes all environment-specific settings
 */

export const config = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Base URLs
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://bdgenai.com' 
      : 'http://localhost:3000'),
  
  // API configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://bdgenai.com/api' 
        : 'http://localhost:3000/api'),
    timeout: 30000, // 30 seconds
  },
  
  // Allowed origins for CORS
  allowedOrigins: [
    // Development origins
    ...(process.env.NODE_ENV === 'development' ? [
      'http://localhost:3000',
      'https://localhost:3000'
    ] : []),
    // Production origins
    'https://bdgenai.com',
    'https://www.bdgenai.com',
    // Environment-specific origin
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : [])
  ],
  
  // Database
  database: {
    url: process.env.DATABASE_URL,
  },
  
  // Authentication
  auth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // External services
  cloudinary: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  // Feature flags
  features: {
    enableDebugLogs: process.env.NODE_ENV === 'development',
    enableErrorReporting: process.env.NODE_ENV === 'production',
  }
};

/**
 * Get the full URL for a given path
 */
export function getFullUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.baseUrl}${cleanPath}`;
}

/**
 * Get the API URL for a given endpoint
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${config.api.baseUrl}/${cleanEndpoint}`;
}

/**
 * Check if the current origin is allowed
 */
export function isOriginAllowed(origin: string): boolean {
  return config.allowedOrigins.includes(origin) || 
         origin.includes('bdgenai.com') ||
         (config.isDevelopment && origin.includes('localhost'));
} 