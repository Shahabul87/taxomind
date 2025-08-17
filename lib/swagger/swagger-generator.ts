import fs from 'fs';
import path from 'path';

/**
 * Swagger documentation generator utility
 * Automatically generates API documentation from route files
 */

interface RouteMetadata {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: any[];
  requestBody?: any;
  responses?: any;
  security?: any[];
}

interface ExtractedRoute {
  filePath: string;
  routes: RouteMetadata[];
}

/**
 * Extract route metadata from a route file
 */
function extractRouteMetadata(filePath: string): RouteMetadata[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const routes: RouteMetadata[] = [];

  // Extract HTTP method exports (GET, POST, PUT, PATCH, DELETE)
  const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/g;
  let match;

  while ((match = methodRegex.exec(content)) !== null) {
    const method = match[1].toLowerCase();
    
    // Extract JSDoc comments above the function
    const functionIndex = match.index;
    const beforeFunction = content.substring(0, functionIndex);
    const jsdocMatch = beforeFunction.match(/\/\*\*([\s\S]*?)\*\/\s*$/);
    
    let metadata: RouteMetadata = {
      path: getPathFromFilePath(filePath),
      method,
    };

    if (jsdocMatch) {
      const jsdoc = jsdocMatch[1];
      metadata = { ...metadata, ...parseJSDoc(jsdoc) };
    }

    // Extract request/response types from TypeScript
    metadata = { ...metadata, ...extractTypesFromFunction(content, functionIndex) };

    routes.push(metadata);
  }

  return routes;
}

/**
 * Convert file path to API route path
 */
function getPathFromFilePath(filePath: string): string {
  // Convert app/api/users/[userId]/route.ts to /users/{userId}
  const relativePath = filePath
    .replace(/.*\/app\/api\//, '/')
    .replace(/\/route\.(ts|js)$/, '')
    .replace(/\[([^\]]+)\]/g, '{$1}');

  return relativePath || '/';
}

/**
 * Parse JSDoc comments for metadata
 */
function parseJSDoc(jsdoc: string): Partial<RouteMetadata> {
  const metadata: Partial<RouteMetadata> = {};

  // Extract @summary
  const summaryMatch = jsdoc.match(/@summary\s+(.+)/);
  if (summaryMatch) metadata.summary = summaryMatch[1].trim();

  // Extract @description
  const descMatch = jsdoc.match(/@description\s+([\s\S]+?)(?=@|$)/);
  if (descMatch) metadata.description = descMatch[1].trim();

  // Extract @tags
  const tagsMatch = jsdoc.match(/@tags?\s+(.+)/);
  if (tagsMatch) {
    metadata.tags = tagsMatch[1].split(',').map(tag => tag.trim());
  }

  return metadata;
}

/**
 * Extract TypeScript types from function
 */
function extractTypesFromFunction(content: string, functionIndex: number): Partial<RouteMetadata> {
  const metadata: Partial<RouteMetadata> = {};

  // Look for NextRequest parameter type
  const functionDef = content.substring(functionIndex, functionIndex + 500);
  const hasRequestParam = /\(.*request:\s*(?:NextRequest|Request)/.test(functionDef);

  if (hasRequestParam) {
    // Function accepts request body
    metadata.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: { type: 'object' },
        },
      },
    };
  }

  // Default responses
  metadata.responses = {
    '200': {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: { type: 'object' },
        },
      },
    },
    '400': {
      description: 'Bad request',
    },
    '401': {
      description: 'Unauthorized',
    },
    '500': {
      description: 'Internal server error',
    },
  };

  return metadata;
}

/**
 * Scan directory for route files
 */
function scanForRoutes(dir: string): ExtractedRoute[] {
  const routes: ExtractedRoute[] = [];

  function scan(currentDir: string) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (file === 'route.ts' || file === 'route.js') {
        const routeMetadata = extractRouteMetadata(fullPath);
        if (routeMetadata.length > 0) {
          routes.push({
            filePath: fullPath,
            routes: routeMetadata,
          });
        }
      }
    }
  }

  scan(dir);
  return routes;
}

/**
 * Generate OpenAPI paths from extracted routes
 */
function generateOpenAPIPaths(extractedRoutes: ExtractedRoute[]): any {
  const paths: any = {};

  for (const { routes } of extractedRoutes) {
    for (const route of routes) {
      if (!paths[route.path]) {
        paths[route.path] = {};
      }

      const operation: any = {
        summary: route.summary || `${route.method.toUpperCase()} ${route.path}`,
        description: route.description,
        tags: route.tags,
        parameters: route.parameters,
        requestBody: route.requestBody,
        responses: route.responses || {
          '200': { description: 'Successful response' },
        },
      };

      if (route.security) {
        operation.security = route.security;
      }

      paths[route.path][route.method] = operation;
    }
  }

  return paths;
}

/**
 * Generate complete OpenAPI specification
 */
export function generateOpenAPISpec(apiDir: string): any {
  const extractedRoutes = scanForRoutes(apiDir);
  const paths = generateOpenAPIPaths(extractedRoutes);

  // Count statistics
  const totalEndpoints = extractedRoutes.reduce(
    (sum, r) => sum + r.routes.length,
    0
  );

  console.log(`📚 API Documentation Generated:`);
  console.log(`   - Total endpoints: ${totalEndpoints}`);
  console.log(`   - Total route files: ${extractedRoutes.length}`);
  console.log(`   - Unique paths: ${Object.keys(paths).length}`);

  return {
    openapi: '3.0.3',
    info: {
      title: 'Taxomind API (Auto-generated)',
      version: '1.0.0',
      description: `Automatically generated API documentation. Found ${totalEndpoints} endpoints.`,
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.taxomind.com',
        description: 'Production server',
      },
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };
}

/**
 * CLI tool to generate OpenAPI spec
 */
if (require.main === module) {
  const apiDir = path.join(process.cwd(), 'app', 'api');
  const outputPath = path.join(process.cwd(), 'docs', 'api', 'openapi-generated.json');

  console.log('🔍 Scanning API routes...');
  const spec = generateOpenAPISpec(apiDir);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the specification
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log(`✅ OpenAPI specification written to: ${outputPath}`);

  // Also generate a markdown summary
  const summaryPath = path.join(outputDir, 'endpoints-summary.md');
  const summary = generateMarkdownSummary(spec);
  fs.writeFileSync(summaryPath, summary);
  console.log(`📝 Endpoints summary written to: ${summaryPath}`);
}

/**
 * Generate markdown summary of endpoints
 */
function generateMarkdownSummary(spec: any): string {
  let markdown = '# API Endpoints Summary\n\n';
  markdown += `Generated from ${Object.keys(spec.paths || {}).length} paths\n\n`;

  const pathsByTag: Record<string, Array<{ path: string; method: string; summary?: string }>> = {};

  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(pathItem as Record<string, unknown>)) {
      if (typeof operation === 'object' && operation !== null && 'summary' in operation) {
        const tags = (operation as any).tags || ['Other'];
        const summary = (operation as any).summary;

        for (const tag of tags) {
          if (!pathsByTag[tag]) pathsByTag[tag] = [];
          pathsByTag[tag].push({
            path,
            method: method.toUpperCase(),
            summary,
          });
        }
      }
    }
  }

  // Group by tags
  for (const [tag, endpoints] of Object.entries(pathsByTag)) {
    markdown += `## ${tag}\n\n`;
    markdown += '| Method | Path | Description |\n';
    markdown += '|--------|------|-------------|\n';
    
    for (const endpoint of endpoints) {
      markdown += `| ${endpoint.method} | \`${endpoint.path}\` | ${endpoint.summary || '-'} |\n`;
    }
    markdown += '\n';
  }

  return markdown;
}

/**
 * Middleware to add OpenAPI annotations to routes
 */
export function withOpenAPI(metadata: Partial<RouteMetadata>) {
  return function decorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store metadata for later extraction
    if (!target._openapi) target._openapi = {};
    target._openapi[propertyKey] = metadata;
    return descriptor;
  };
}

/**
 * Example usage with decorator:
 * 
 * @withOpenAPI({
 *   summary: 'Get user profile',
 *   tags: ['Users'],
 *   description: 'Retrieves detailed user profile information'
 * })
 * export async function GET(request: Request) {
 *   // Implementation
 * }
 */

export default {
  generateOpenAPISpec,
  scanForRoutes,
  withOpenAPI,
};