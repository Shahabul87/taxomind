#!/usr/bin/env node

/**
 * Script to generate API documentation
 * Run with: npm run generate:api-docs
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log();
  log(`${'='.repeat(60)}`, colors.cyan);
  log(title, colors.bright + colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
  console.log();
}

async function generateAPIDocs() {
  logSection('📚 Taxomind API Documentation Generator');

  try {
    // Check if required files exist
    const swaggerConfigPath = path.join(process.cwd(), 'swagger.config.ts');
    const openAPIPath = path.join(process.cwd(), 'docs', 'api', 'openapi.yaml');
    const readmePath = path.join(process.cwd(), 'docs', 'api', 'README.md');

    log('✅ Checking documentation files...', colors.blue);

    if (!fs.existsSync(swaggerConfigPath)) {
      log('❌ swagger.config.ts not found!', colors.yellow);
      return;
    }
    log('  ✓ swagger.config.ts', colors.green);

    if (!fs.existsSync(openAPIPath)) {
      log('  ⚠️  openapi.yaml not found (optional)', colors.yellow);
    } else {
      log('  ✓ openapi.yaml', colors.green);
    }

    if (!fs.existsSync(readmePath)) {
      log('  ⚠️  README.md not found (optional)', colors.yellow);
    } else {
      log('  ✓ README.md', colors.green);
    }

    // Generate endpoint statistics
    log('\n📊 Generating API statistics...', colors.blue);
    const apiDir = path.join(process.cwd(), 'app', 'api');
    const stats = await analyzeAPIRoutes(apiDir);

    log(`\n  Total route files: ${stats.totalFiles}`, colors.green);
    log(`  Total endpoints: ${stats.totalEndpoints}`, colors.green);
    log(`  GET endpoints: ${stats.methods.GET}`, colors.green);
    log(`  POST endpoints: ${stats.methods.POST}`, colors.green);
    log(`  PATCH endpoints: ${stats.methods.PATCH}`, colors.green);
    log(`  DELETE endpoints: ${stats.methods.DELETE}`, colors.green);
    log(`  PUT endpoints: ${stats.methods.PUT}`, colors.green);

    // Generate endpoints list
    log('\n📝 Generating endpoints list...', colors.blue);
    const endpointsList = generateEndpointsList(stats.endpoints);
    const endpointsPath = path.join(process.cwd(), 'docs', 'api', 'endpoints.md');
    fs.writeFileSync(endpointsPath, endpointsList);
    log(`  ✓ Endpoints list saved to: ${endpointsPath}`, colors.green);

    // Generate Postman collection
    log('\n🚀 Generating Postman collection...', colors.blue);
    const postmanCollection = generatePostmanCollection(stats.endpoints);
    const postmanPath = path.join(process.cwd(), 'docs', 'api', 'taxomind.postman_collection.json');
    fs.writeFileSync(postmanPath, JSON.stringify(postmanCollection, null, 2));
    log(`  ✓ Postman collection saved to: ${postmanPath}`, colors.green);

    logSection('✨ API Documentation Generated Successfully!');

    log('📖 Access your API documentation at:', colors.bright);
    log('  • Swagger UI: http://localhost:3000/api/docs', colors.cyan);
    log('  • OpenAPI JSON: http://localhost:3000/api/docs?format=json', colors.cyan);
    log('  • OpenAPI YAML: http://localhost:3000/api/docs?format=yaml', colors.cyan);
    log('  • Documentation: /docs/api/README.md', colors.cyan);
    log('  • Endpoints List: /docs/api/endpoints.md', colors.cyan);
    log('  • Postman Collection: /docs/api/taxomind.postman_collection.json', colors.cyan);

  } catch (error) {
    log(`\n❌ Error generating documentation: ${error.message}`, colors.yellow);
    console.error(error);
    process.exit(1);
  }
}

function analyzeAPIRoutes(apiDir) {
  const stats = {
    totalFiles: 0,
    totalEndpoints: 0,
    methods: { GET: 0, POST: 0, PATCH: 0, DELETE: 0, PUT: 0 },
    endpoints: [],
  };

  function scanDir(dir, basePath = '') {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const newBasePath = path.join(basePath, file);
        scanDir(fullPath, newBasePath);
      } else if (file === 'route.ts' || file === 'route.js') {
        stats.totalFiles++;
        
        const content = fs.readFileSync(fullPath, 'utf-8');
        const methods = ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'];
        
        for (const method of methods) {
          const regex = new RegExp(`export\\s+async\\s+function\\s+${method}`, 'g');
          const matches = content.match(regex);
          if (matches) {
            stats.methods[method] += matches.length;
            stats.totalEndpoints += matches.length;
            
            const apiPath = basePath
              .replace(/\\/g, '/')
              .replace(/\[([^\]]+)\]/g, ':$1');
            
            stats.endpoints.push({
              method,
              path: `/api${apiPath}`,
              file: fullPath,
            });
          }
        }
      }
    }
  }

  scanDir(apiDir);
  return stats;
}

function generateEndpointsList(endpoints) {
  let markdown = '# Taxomind API Endpoints\n\n';
  markdown += `Generated on: ${new Date().toISOString()}\n\n`;
  markdown += `Total endpoints: ${endpoints.length}\n\n`;

  // Group by category
  const grouped = {};
  for (const endpoint of endpoints) {
    const category = endpoint.path.split('/')[2] || 'root';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(endpoint);
  }

  // Generate markdown
  for (const [category, categoryEndpoints] of Object.entries(grouped)) {
    markdown += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    markdown += '| Method | Endpoint | File |\n';
    markdown += '|--------|----------|------|\n';
    
    for (const endpoint of categoryEndpoints) {
      const fileName = path.basename(path.dirname(endpoint.file));
      markdown += `| ${endpoint.method} | \`${endpoint.path}\` | ${fileName} |\n`;
    }
    markdown += '\n';
  }

  return markdown;
}

function generatePostmanCollection(endpoints) {
  const collection = {
    info: {
      name: 'Taxomind API',
      description: 'Taxomind Learning Management System API',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [],
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3000/api',
        type: 'string',
      },
      {
        key: 'token',
        value: '',
        type: 'string',
      },
    ],
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{token}}',
          type: 'string',
        },
      ],
    },
  };

  // Group by category
  const grouped = {};
  for (const endpoint of endpoints) {
    const category = endpoint.path.split('/')[2] || 'root';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(endpoint);
  }

  // Create folders and requests
  for (const [category, categoryEndpoints] of Object.entries(grouped)) {
    const folder = {
      name: category.charAt(0).toUpperCase() + category.slice(1),
      item: [],
    };

    for (const endpoint of categoryEndpoints) {
      const request = {
        name: `${endpoint.method} ${endpoint.path}`,
        request: {
          method: endpoint.method,
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          url: {
            raw: `{{baseUrl}}${endpoint.path}`,
            host: ['{{baseUrl}}'],
            path: endpoint.path.split('/').filter(p => p),
          },
        },
      };

      if (endpoint.method === 'POST' || endpoint.method === 'PATCH' || endpoint.method === 'PUT') {
        request.request.body = {
          mode: 'raw',
          raw: '{}',
        };
      }

      folder.item.push(request);
    }

    collection.item.push(folder);
  }

  return collection;
}

// Run the generator
generateAPIDocs().catch(console.error);