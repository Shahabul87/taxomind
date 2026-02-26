import {
  ApiError,
  ApiResponses,
  createErrorResponse,
  createMethodNotAllowedResponse,
  createNoContentResponse,
  createPaginatedResponse,
  createSuccessResponse,
  handleDatabaseError,
  parseQueryParams,
  parseRequestBody,
  validateRequiredFields,
  withErrorHandling,
} from '@/lib/api/api-responses';

describe('lib/api/api-responses', () => {
  it('creates success response with data, status, and headers', async () => {
    const res = createSuccessResponse({ id: 1 }, 201, undefined, { 'x-test': 'ok' });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(res.headers.get('x-test')).toBe('ok');
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 1 });
    expect(body.meta.timestamp).toBeTruthy();
  });

  it('creates error response from ApiError and plain string', async () => {
    const apiErrRes = createErrorResponse(ApiError.badRequest('bad input', { field: 'email' }));
    const apiErrBody = await apiErrRes.json();
    expect(apiErrRes.status).toBe(400);
    expect(apiErrBody.error.code).toBe('BAD_REQUEST');
    expect(apiErrBody.error.details).toEqual({ field: 'email' });

    const strErrRes = createErrorResponse('boom');
    const strErrBody = await strErrRes.json();
    expect(strErrRes.status).toBe(500);
    expect(strErrBody.error.message).toBe('boom');
  });

  it('creates paginated and no-content responses', async () => {
    const paginated = createPaginatedResponse([{ id: 1 }], { page: 2, limit: 10, total: 45 });
    const pBody = await paginated.json();
    expect(pBody.meta.pagination).toEqual({ page: 2, limit: 10, total: 45, totalPages: 5 });

    const noContent = createNoContentResponse({ 'x-empty': '1' });
    expect(noContent.status).toBe(204);
    expect(noContent.headers.get('x-empty')).toBe('1');
  });

  it('creates method-not-allowed response with allow header', async () => {
    const res = createMethodNotAllowedResponse(['GET', 'POST']);
    const body = await res.json();

    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, POST');
    expect(body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('parses request body and handles invalid/empty body', async () => {
    const req = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify({ id: 1, active: true }),
    });
    const parsed = await parseRequestBody<{ id: number; active: boolean }>(req);
    expect(parsed).toEqual({ id: 1, active: true });

    const parsedWithSchema = await parseRequestBody<{ id: number }>(
      new Request('http://localhost/api', { method: 'POST', body: JSON.stringify({ id: 7 }) }),
      (data) => ({ id: Number(data.id) })
    );
    expect(parsedWithSchema.id).toBe(7);

    await expect(
      parseRequestBody(new Request('http://localhost/api', { method: 'POST', body: '   ' }))
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    await expect(
      parseRequestBody(new Request('http://localhost/api', { method: 'POST', body: '{not-json' }))
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('parses query params with type conversion', () => {
    const req = new Request('http://localhost/api?count=5&ratio=1.5&enabled=true&name=sam&disabled=false');
    const params = parseQueryParams(req);

    expect(params).toEqual({
      count: 5,
      ratio: 1.5,
      enabled: true,
      name: 'sam',
      disabled: false,
    });
  });

  it('validates required fields and throws when missing', () => {
    expect(() => validateRequiredFields({ a: 'x', b: 1 }, ['a', 'b'])).not.toThrow();

    expect(() => validateRequiredFields({ a: '', b: undefined }, ['a', 'b'])).toThrow('Missing required fields');
  });

  it('maps database errors consistently', () => {
    expect(handleDatabaseError({ code: 'P2002', meta: { target: ['email'] } })).toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(handleDatabaseError({ code: 'P2025' })).toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    expect(handleDatabaseError({ code: 'P2003', meta: { field_name: 'userId' } })).toMatchObject({
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
    expect(handleDatabaseError({ code: 'UNKNOWN' })).toMatchObject({
      statusCode: 500,
      code: 'DATABASE_ERROR',
    });
  });

  it('withErrorHandling wraps api, prisma, and unexpected errors', async () => {
    const wrappedOk = withErrorHandling(async () => createSuccessResponse({ ok: true }));
    const okRes = await wrappedOk();
    expect(okRes.status).toBe(200);

    const wrappedApiErr = withErrorHandling(async () => {
      throw ApiError.forbidden('no access');
    });
    const apiErrRes = await wrappedApiErr();
    expect(apiErrRes.status).toBe(403);

    const wrappedDbErr = withErrorHandling(async () => {
      throw { code: 'P2025' };
    });
    const dbErrRes = await wrappedDbErr();
    expect(dbErrRes.status).toBe(404);

    const wrappedUnexpected = withErrorHandling(async () => {
      throw new Error('boom');
    });
    const unexpectedRes = await wrappedUnexpected();
    expect(unexpectedRes.status).toBe(500);
  });

  it('ApiResponses helpers return expected statuses', () => {
    expect(ApiResponses.ok({}).status).toBe(200);
    expect(ApiResponses.created({}).status).toBe(201);
    expect(ApiResponses.accepted({}).status).toBe(202);
    expect(ApiResponses.noContent().status).toBe(204);
    expect(ApiResponses.badRequest('bad').status).toBe(400);
    expect(ApiResponses.unauthorized('no').status).toBe(401);
    expect(ApiResponses.forbidden('no').status).toBe(403);
    expect(ApiResponses.notFound('no').status).toBe(404);
    expect(ApiResponses.methodNotAllowed(['GET']).status).toBe(405);
    expect(ApiResponses.conflict('dup').status).toBe(409);
    expect(ApiResponses.tooManyRequests('slow').status).toBe(429);
    expect(ApiResponses.internal('oops').status).toBe(500);
    expect(ApiResponses.serviceUnavailable('down').status).toBe(503);
  });
});
