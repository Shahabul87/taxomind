import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

// Validation schemas for testing
const schemas = {
  user: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    age: z.number().min(0).max(150).optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
  }),
  
  course: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().min(0, 'Price cannot be negative').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    isPublished: z.boolean().optional(),
  }),
  
  payment: z.object({
    amount: z.number().positive('Amount must be positive'),
    currency: z.enum(['USD', 'EUR', 'GBP']),
    cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
    cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
    expiryMonth: z.number().min(1).max(12),
    expiryYear: z.number().min(new Date().getFullYear()),
  }),
  
  search: z.object({
    query: z.string().min(1, 'Query cannot be empty'),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    sortBy: z.enum(['relevance', 'date', 'popularity']).optional(),
    filters: z.record(z.string()).optional(),
  }),
};

// Data validation testing endpoint
export async function POST(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const { schema: schemaName = 'user', data, validate = true } = body;
    
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: 'No data provided for validation',
          usage: {
            example: {
              schema: 'user',
              data: {
                email: 'test@example.com',
                name: 'Test User',
              },
            },
            availableSchemas: Object.keys(schemas),
          },
        },
        { status: 400 }
      );
    }
    
    // Get the schema
    const schema = schemas[schemaName as keyof typeof schemas];
    
    if (!schema) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown schema: ${schemaName}`,
          availableSchemas: Object.keys(schemas),
        },
        { status: 400 }
      );
    }
    
    if (!validate) {
      // Just return schema info without validating
      return NextResponse.json({
        success: true,
        schema: schemaName,
        schemaDefinition: schema._def,
        providedData: data,
        message: 'Schema info returned without validation',
      });
    }
    
    // Perform validation
    const validationResult = schema.safeParse(data);
    
    if (validationResult.success) {
      return NextResponse.json({
        success: true,
        schema: schemaName,
        valid: true,
        data: validationResult.data,
        message: 'Data is valid',
      });
    } else {
      return NextResponse.json({
        success: false,
        schema: schemaName,
        valid: false,
        errors: validationResult.error.flatten(),
        issues: validationResult.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
        providedData: data,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing query parameter validation
export async function GET(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  const searchParams = req.nextUrl.searchParams;
  const test = searchParams.get('test') || 'info';
  
  try {
    switch (test) {
      case 'info':
        // Return available validation schemas
        return NextResponse.json({
          success: true,
          availableSchemas: Object.keys(schemas),
          schemaDetails: Object.entries(schemas).map(([name, schema]) => ({
            name,
            fields: Object.keys(schema.shape || {}),
          })),
          usage: {
            POST: 'Send data to validate against a schema',
            GET: 'Use ?test=params to validate query parameters',
            examples: [
              'GET /api/test/validation?test=info',
              'GET /api/test/validation?test=params&email=test@example.com&age=25',
              'GET /api/test/validation?test=types&string=hello&number=123&boolean=true',
            ],
          },
        });
        
      case 'params':
        // Validate query parameters
        const paramSchema = z.object({
          email: z.string().email().optional(),
          age: z.coerce.number().min(0).max(150).optional(),
          name: z.string().min(2).optional(),
          role: z.enum(['USER', 'ADMIN']).optional(),
        });
        
        const params = {
          email: searchParams.get('email') || undefined,
          age: searchParams.get('age') ? parseInt(searchParams.get('age')!) : undefined,
          name: searchParams.get('name') || undefined,
          role: searchParams.get('role') as 'USER' | 'ADMIN' | undefined,
        };
        
        const result = paramSchema.safeParse(params);
        
        return NextResponse.json({
          success: result.success,
          test: 'params',
          providedParams: params,
          validation: result.success ? {
            valid: true,
            data: result.data,
          } : {
            valid: false,
            errors: result.error.flatten(),
          },
        });
        
      case 'types':
        // Test type coercion and validation
        const typeTests = {
          string: searchParams.get('string'),
          number: searchParams.get('number'),
          boolean: searchParams.get('boolean'),
          array: searchParams.get('array'),
          json: searchParams.get('json'),
        };
        
        const typeValidations: any = {};
        
        // String validation
        if (typeTests.string !== null) {
          typeValidations.string = {
            original: typeTests.string,
            isString: typeof typeTests.string === 'string',
            length: typeTests.string.length,
            isEmpty: typeTests.string.length === 0,
          };
        }
        
        // Number validation
        if (typeTests.number !== null) {
          const num = Number(typeTests.number);
          typeValidations.number = {
            original: typeTests.number,
            parsed: num,
            isValid: !isNaN(num),
            isInteger: Number.isInteger(num),
            isPositive: num > 0,
          };
        }
        
        // Boolean validation
        if (typeTests.boolean !== null) {
          typeValidations.boolean = {
            original: typeTests.boolean,
            parsed: typeTests.boolean === 'true',
            isTrue: typeTests.boolean === 'true',
            isFalse: typeTests.boolean === 'false',
            isValid: ['true', 'false'].includes(typeTests.boolean),
          };
        }
        
        // Array validation
        if (typeTests.array !== null) {
          try {
            const arr = typeTests.array.split(',');
            typeValidations.array = {
              original: typeTests.array,
              parsed: arr,
              length: arr.length,
              isValid: true,
            };
          } catch {
            typeValidations.array = {
              original: typeTests.array,
              isValid: false,
              error: 'Could not parse as array',
            };
          }
        }
        
        // JSON validation
        if (typeTests.json !== null) {
          try {
            const json = JSON.parse(typeTests.json);
            typeValidations.json = {
              original: typeTests.json,
              parsed: json,
              isValid: true,
              type: typeof json,
            };
          } catch {
            typeValidations.json = {
              original: typeTests.json,
              isValid: false,
              error: 'Invalid JSON',
            };
          }
        }
        
        return NextResponse.json({
          success: true,
          test: 'types',
          validations: typeValidations,
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown test type',
          availableTests: ['info', 'params', 'types'],
        });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Validation test failed',
      },
      { status: 500 }
    );
  }
}