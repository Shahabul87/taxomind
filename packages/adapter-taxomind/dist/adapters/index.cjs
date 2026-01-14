"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/adapters/index.ts
var adapters_exports = {};
__export(adapters_exports, {
  AnthropicAIAdapter: () => AnthropicAIAdapter,
  DeepSeekEmbeddingAdapter: () => DeepSeekEmbeddingAdapter,
  NextAuthAdapter: () => NextAuthAdapter,
  OpenAIEmbeddingAdapter: () => OpenAIEmbeddingAdapter,
  PgVectorAdapter: () => PgVectorAdapter,
  PrismaDatabaseAdapter: () => PrismaDatabaseAdapter,
  PrismaRepositoryFactory: () => PrismaRepositoryFactory,
  SAMVectorEmbeddingAdapter: () => SAMVectorEmbeddingAdapter,
  TaxomindAIService: () => TaxomindAIService,
  TaxomindVectorService: () => TaxomindVectorService,
  createAnthropicAIAdapter: () => createAnthropicAIAdapter,
  createEmbeddingAdapter: () => createEmbeddingAdapter,
  createNextAuthAdapter: () => createNextAuthAdapter,
  createOpenAIEmbeddingAdapter: () => createOpenAIEmbeddingAdapter,
  createPgVectorAdapter: () => createPgVectorAdapter,
  createPrismaDatabaseAdapter: () => createPrismaDatabaseAdapter,
  createPrismaRepositoryFactory: () => createPrismaRepositoryFactory,
  createSAMVectorEmbeddingAdapter: () => createSAMVectorEmbeddingAdapter,
  createTaxomindAIService: () => createTaxomindAIService,
  createTaxomindSAMVectorService: () => createTaxomindSAMVectorService,
  createTaxomindVectorService: () => createTaxomindVectorService
});
module.exports = __toCommonJS(adapters_exports);

// src/adapters/prisma-database-adapter.ts
var PrismaEntityRepository = class {
  constructor(prisma, modelName) {
    this.prisma = prisma;
    this.modelName = modelName;
  }
  get model() {
    return this.prisma[this.modelName.charAt(0).toLowerCase() + this.modelName.slice(1)];
  }
  filterConditionsToPrismaWhere(conditions) {
    if (!conditions || conditions.length === 0) {
      return {};
    }
    const where = {};
    for (const condition of conditions) {
      const { field, operator, value } = condition;
      switch (operator) {
        case "eq":
          where[field] = value;
          break;
        case "neq":
          where[field] = { not: value };
          break;
        case "gt":
          where[field] = { gt: value };
          break;
        case "gte":
          where[field] = { gte: value };
          break;
        case "lt":
          where[field] = { lt: value };
          break;
        case "lte":
          where[field] = { lte: value };
          break;
        case "contains":
          where[field] = { contains: value };
          break;
        case "startsWith":
          where[field] = { startsWith: value };
          break;
        case "endsWith":
          where[field] = { endsWith: value };
          break;
        case "in":
          where[field] = { in: value };
          break;
        case "notIn":
          where[field] = { notIn: value };
          break;
        default:
          where[field] = value;
      }
    }
    return where;
  }
  async findById(id) {
    const model = this.model;
    return model.findUnique({
      where: { id }
    });
  }
  async findOne(options) {
    const model = this.model;
    return model.findFirst({
      where: this.filterConditionsToPrismaWhere(options.where),
      orderBy: options.orderBy?.map((o) => ({ [o.field]: o.direction }))
    });
  }
  async findMany(options) {
    const model = this.model;
    return model.findMany({
      where: this.filterConditionsToPrismaWhere(options?.where),
      orderBy: options?.orderBy?.map((o) => ({ [o.field]: o.direction })),
      take: options?.limit,
      skip: options?.offset
    });
  }
  async findPaginated(page, pageSize, options) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.findMany({
        ...options,
        offset: skip,
        limit: pageSize
      }),
      this.count(options)
    ]);
    return {
      data,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total
    };
  }
  async count(options) {
    const model = this.model;
    return model.count({
      where: this.filterConditionsToPrismaWhere(options?.where)
    });
  }
  async exists(id) {
    const result = await this.findById(id);
    return result !== null;
  }
  async create(data) {
    const model = this.model;
    return model.create({
      data
    });
  }
  async createMany(data) {
    const results = [];
    for (const item of data) {
      const created = await this.create(item);
      results.push(created);
    }
    return results;
  }
  async update(id, data) {
    const model = this.model;
    return model.update({
      where: { id },
      data
    });
  }
  async updateMany(where, data) {
    const model = this.model;
    const result = await model.updateMany({
      where: this.filterConditionsToPrismaWhere(where),
      data
    });
    return result.count;
  }
  async upsert(where, create, update) {
    const model = this.model;
    return model.upsert({
      where: this.filterConditionsToPrismaWhere(where),
      create,
      update
    });
  }
  async delete(id) {
    const model = this.model;
    try {
      await model.delete({
        where: { id }
      });
      return true;
    } catch {
      return false;
    }
  }
  async deleteMany(where) {
    const model = this.model;
    const result = await model.deleteMany({
      where: this.filterConditionsToPrismaWhere(where)
    });
    return result.count;
  }
};
var PrismaDatabaseAdapter = class {
  constructor(prisma) {
    this.prisma = prisma;
  }
  _isConnected = false;
  repositories = /* @__PURE__ */ new Map();
  // ============================================================================
  // CLIENT ACCESS
  // ============================================================================
  getClient() {
    return this.prisma;
  }
  executeRaw(query, params) {
    return this.prisma.$queryRawUnsafe(query, ...params ?? []);
  }
  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================
  async connect() {
    await this.prisma.$connect();
    this._isConnected = true;
  }
  async disconnect() {
    await this.prisma.$disconnect();
    this._isConnected = false;
  }
  async isConnected() {
    return this._isConnected;
  }
  // ============================================================================
  // TRANSACTIONS
  // ============================================================================
  async transaction(fn, options) {
    const txId = crypto.randomUUID();
    const startedAt = /* @__PURE__ */ new Date();
    const timeout = options?.timeout ?? 5e3;
    return this.prisma.$transaction(
      async () => {
        const ctx = {
          id: txId,
          startedAt,
          timeout
        };
        return fn(ctx);
      },
      {
        timeout
      }
    );
  }
  // ============================================================================
  // ENTITY REPOSITORIES
  // ============================================================================
  getGoalRepository() {
    if (!this.repositories.has("SAMGoal")) {
      this.repositories.set(
        "SAMGoal",
        new PrismaEntityRepository(this.prisma, "SAMGoal")
      );
    }
    return this.repositories.get("SAMGoal");
  }
  getPlanRepository() {
    if (!this.repositories.has("SAMPlan")) {
      this.repositories.set(
        "SAMPlan",
        new PrismaEntityRepository(this.prisma, "SAMPlan")
      );
    }
    return this.repositories.get("SAMPlan");
  }
  getMemoryRepository() {
    if (!this.repositories.has("SAMMemory")) {
      this.repositories.set(
        "SAMMemory",
        new PrismaEntityRepository(this.prisma, "SAMMemory")
      );
    }
    return this.repositories.get("SAMMemory");
  }
  getSessionRepository() {
    if (!this.repositories.has("SAMSession")) {
      this.repositories.set(
        "SAMSession",
        new PrismaEntityRepository(this.prisma, "SAMSession")
      );
    }
    return this.repositories.get("SAMSession");
  }
  // ============================================================================
  // RAW QUERIES
  // ============================================================================
  async rawQuery(sql, params) {
    return this.prisma.$queryRawUnsafe(sql, ...params ?? []);
  }
  async rawExecute(sql, params) {
    const result = await this.prisma.$executeRawUnsafe(sql, ...params ?? []);
    return result;
  }
  // ============================================================================
  // HEALTH CHECK
  // ============================================================================
  async healthCheck() {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      return {
        healthy: true,
        latencyMs: latency
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
};
var PrismaRepositoryFactory = class {
  constructor(prisma) {
    this.prisma = prisma;
  }
  createGoalRepository() {
    return new PrismaEntityRepository(
      this.prisma,
      "SAMGoal"
    );
  }
  createPlanRepository() {
    return new PrismaEntityRepository(
      this.prisma,
      "SAMPlan"
    );
  }
  createMemoryRepository() {
    return new PrismaEntityRepository(
      this.prisma,
      "SAMMemory"
    );
  }
  createSessionRepository() {
    return new PrismaEntityRepository(
      this.prisma,
      "SAMSession"
    );
  }
  createRepository(entityName) {
    return new PrismaEntityRepository(
      this.prisma,
      entityName
    );
  }
};
function createPrismaDatabaseAdapter(prisma) {
  return new PrismaDatabaseAdapter(prisma);
}
function createPrismaRepositoryFactory(prisma) {
  return new PrismaRepositoryFactory(prisma);
}

// src/adapters/nextauth-adapter.ts
var import_integration = require("@sam-ai/integration");
var NextAuthAdapter = class {
  constructor(prisma, options) {
    this.prisma = prisma;
    this.options = options;
    this.prismaWithSession = prisma;
  }
  sessionCache = /* @__PURE__ */ new Map();
  prismaWithSession;
  hasSessionModel() {
    return typeof this.prismaWithSession.session !== "undefined";
  }
  // ============================================================================
  // SESSION STATE
  // ============================================================================
  currentSessionToken = null;
  async getCurrentSession() {
    if (!this.currentSessionToken) {
      return null;
    }
    return this.getSession(this.currentSessionToken);
  }
  async isAuthenticated() {
    const session = await this.getCurrentSession();
    return session !== null && new Date(session.expiresAt) > /* @__PURE__ */ new Date();
  }
  async hasAnyRole(userId, roles) {
    for (const role of roles) {
      const hasRole = await this.hasRole(userId, role);
      if (hasRole) return true;
    }
    return false;
  }
  async hasAllRoles(userId, roles) {
    for (const role of roles) {
      const hasRole = await this.hasRole(userId, role);
      if (!hasRole) return false;
    }
    return true;
  }
  async getUsersByRole(role) {
    const users = await this.prisma.user.findMany({
      where: { role }
    });
    return users.map((u) => this.mapPrismaUserToSAMUser(u));
  }
  async updateUserRole(userId, role) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role }
    });
    return this.mapPrismaUserToSAMUser(user);
  }
  async addUserPermission(userId, permission) {
    console.log(`addUserPermission called for user ${userId} with permission ${permission}`);
  }
  async removeUserPermission(userId, permission) {
    console.log(`removeUserPermission called for user ${userId} with permission ${permission}`);
  }
  async getUserRoles(userId) {
    const user = await this.getUserById(userId);
    if (!user) return [];
    return user.roles;
  }
  async getUserPermissions(userId) {
    const user = await this.getUserById(userId);
    if (!user) return [];
    return user.permissions;
  }
  async validateToken(token) {
    const isValid = await this.validateSession(token);
    if (!isValid) {
      return {
        success: false,
        error: { code: "INVALID_TOKEN", message: "Token is invalid or expired" }
      };
    }
    const user = await this.getCurrentUser(token);
    return {
      success: true,
      user: user ?? void 0
    };
  }
  // ============================================================================
  // USER OPERATIONS
  // ============================================================================
  async getCurrentUser(sessionToken) {
    if (sessionToken) {
      this.currentSessionToken = sessionToken;
    }
    if (!sessionToken) {
      return null;
    }
    const cachedSession = this.sessionCache.get(sessionToken);
    if (cachedSession && new Date(cachedSession.expiresAt) > /* @__PURE__ */ new Date()) {
      return this.getUserById(cachedSession.userId);
    }
    if (!this.hasSessionModel()) {
      return null;
    }
    const session = await this.prismaWithSession.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });
    if (!session || new Date(session.expires) < /* @__PURE__ */ new Date()) {
      return null;
    }
    const samUser = session.user ? this.mapPrismaUserToSAMUser(session.user) : null;
    if (!samUser) {
      return null;
    }
    const samSession = {
      id: session.id,
      userId: session.userId,
      user: samUser,
      expiresAt: session.expires,
      createdAt: session.expires,
      // Using expires as approximation
      isValid: new Date(session.expires) > /* @__PURE__ */ new Date(),
      accessToken: session.sessionToken
    };
    this.sessionCache.set(sessionToken, samSession);
    return samUser;
  }
  async getUserById(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return null;
    }
    return this.mapPrismaUserToSAMUser(user);
  }
  async getUserByEmail(email) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      return null;
    }
    return this.mapPrismaUserToSAMUser(user);
  }
  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================
  async getSession(sessionId) {
    for (const [, session2] of this.sessionCache) {
      if (session2.id === sessionId) {
        return session2;
      }
    }
    if (!this.hasSessionModel()) {
      return null;
    }
    const session = await this.prismaWithSession.session.findUnique({
      where: { id: sessionId }
    });
    if (!session || new Date(session.expires) < /* @__PURE__ */ new Date()) {
      return null;
    }
    const samUser = await this.getUserById(session.userId);
    if (!samUser) {
      return null;
    }
    return {
      id: session.id,
      userId: session.userId,
      user: samUser,
      expiresAt: session.expires,
      createdAt: session.expires,
      isValid: new Date(session.expires) > /* @__PURE__ */ new Date(),
      accessToken: session.sessionToken
    };
  }
  async validateSession(sessionToken) {
    if (!this.hasSessionModel()) {
      return false;
    }
    const session = await this.prismaWithSession.session.findUnique({
      where: { sessionToken }
    });
    if (!session) {
      return false;
    }
    return new Date(session.expires) > /* @__PURE__ */ new Date();
  }
  async refreshSession(sessionToken) {
    if (!this.hasSessionModel()) {
      return null;
    }
    const session = await this.prismaWithSession.session.findUnique({
      where: { sessionToken }
    });
    if (!session) {
      return null;
    }
    const newExpiry = /* @__PURE__ */ new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);
    const updated = await this.prismaWithSession.session.update({
      where: { id: session.id },
      data: { expires: newExpiry }
    });
    const samUser = await this.getUserById(updated.userId);
    if (!samUser) {
      return null;
    }
    const samSession = {
      id: updated.id,
      userId: updated.userId,
      user: samUser,
      expiresAt: updated.expires,
      createdAt: updated.expires,
      isValid: new Date(updated.expires) > /* @__PURE__ */ new Date(),
      accessToken: updated.sessionToken
    };
    this.sessionCache.set(sessionToken, samSession);
    return samSession;
  }
  async invalidateSession() {
    if (this.currentSessionToken) {
      this.sessionCache.delete(this.currentSessionToken);
      if (this.hasSessionModel()) {
        await this.prismaWithSession.session.delete({
          where: { sessionToken: this.currentSessionToken }
        }).catch(() => {
        });
      }
      this.currentSessionToken = null;
    }
  }
  async invalidateSessionByToken(sessionToken) {
    this.sessionCache.delete(sessionToken);
    if (this.hasSessionModel()) {
      await this.prismaWithSession.session.delete({
        where: { sessionToken }
      }).catch(() => {
      });
    }
  }
  // ============================================================================
  // PERMISSION CHECKING
  // ============================================================================
  async hasPermission(userId, permission) {
    const user = await this.getUserById(userId);
    if (!user) {
      return false;
    }
    const allPermissions = [];
    for (const userRole of user.roles) {
      const rolePerms = import_integration.DefaultRolePermissions[userRole] ?? [];
      allPermissions.push(...rolePerms);
    }
    return allPermissions.includes(permission) || allPermissions.includes("admin:all") || user.permissions.includes(permission);
  }
  async hasRole(userId, role) {
    const user = await this.getUserById(userId);
    if (!user) {
      return false;
    }
    if (user.roles.includes(role)) {
      return true;
    }
    const roleHierarchy = {
      [import_integration.SAMRoles.ADMIN]: 100,
      [import_integration.SAMRoles.TEACHER]: 50,
      [import_integration.SAMRoles.STUDENT]: 25,
      [import_integration.SAMRoles.GUEST]: 0
    };
    const userLevel = Math.max(...user.roles.map((r) => roleHierarchy[r] ?? 0));
    const requiredLevel = roleHierarchy[role] ?? 0;
    return userLevel >= requiredLevel;
  }
  getPermissionChecker() {
    return new TaxomindPermissionChecker(this);
  }
  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  async authenticate(credentials) {
    const user = await this.getUserByEmail(credentials.email);
    if (!user) {
      return {
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      };
    }
    return {
      success: true,
      user
    };
  }
  // ============================================================================
  // HELPERS
  // ============================================================================
  mapPrismaUserToSAMUser(user) {
    const userRole = user.role ?? import_integration.SAMRoles.STUDENT;
    return {
      id: user.id,
      email: user.email ?? void 0,
      name: user.name ?? void 0,
      roles: [userRole],
      permissions: import_integration.DefaultRolePermissions[userRole] ?? [],
      metadata: {
        avatar: user.image ?? void 0
      }
    };
  }
};
var TaxomindPermissionChecker = class {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
  }
  async can(userId, permission) {
    const permissionString = `${permission.action}:${permission.resource}`;
    return this.authAdapter.hasPermission(userId, permissionString);
  }
  async canAll(userId, permissions) {
    const results = await Promise.all(
      permissions.map((perm) => this.can(userId, perm))
    );
    return results.every((result) => result);
  }
  async canAny(userId, permissions) {
    const results = await Promise.all(
      permissions.map((perm) => this.can(userId, perm))
    );
    return results.some((result) => result);
  }
  async getResourcePermissions(userId, resource) {
    const user = await this.authAdapter.getUserById(userId);
    if (!user) return [];
    const actions = [
      "create",
      "read",
      "update",
      "delete",
      "execute",
      "admin"
    ];
    const permissions = [];
    for (const action of actions) {
      const permString = `${action}:${resource}`;
      if (user.permissions.includes(permString)) {
        permissions.push({ resource, action });
      }
    }
    return permissions;
  }
  async check(userId, resource, action) {
    const permission = `${action}:${resource}`;
    const allowed = await this.authAdapter.hasPermission(userId, permission);
    return {
      allowed,
      reason: allowed ? `User has permission: ${permission}` : `User lacks permission: ${permission}`
    };
  }
  async checkMany(userId, checks) {
    const results = /* @__PURE__ */ new Map();
    await Promise.all(
      checks.map(async ({ resource, action }) => {
        const key = `${action}:${resource}`;
        const result = await this.check(userId, resource, action);
        results.set(key, result);
      })
    );
    return results;
  }
};
function createNextAuthAdapter(prisma, options) {
  return new NextAuthAdapter(prisma, options);
}

// src/adapters/anthropic-ai-adapter.ts
var import_sdk = __toESM(require("@anthropic-ai/sdk"), 1);
var AnthropicAIAdapter = class {
  client;
  defaultModel;
  name = "anthropic";
  constructor(options) {
    this.client = new import_sdk.default({
      apiKey: options?.apiKey ?? process.env.ANTHROPIC_API_KEY
    });
    this.defaultModel = options?.defaultModel ?? "claude-sonnet-4-20250514";
  }
  // ============================================================================
  // ADAPTER INFO
  // ============================================================================
  getName() {
    return this.name;
  }
  getDefaultModel() {
    return this.defaultModel;
  }
  async listModels() {
    return [
      "claude-opus-4-20250514",
      "claude-sonnet-4-20250514",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-haiku-20240307"
    ];
  }
  async isAvailable() {
    try {
      const health = await this.healthCheck();
      return health.healthy;
    } catch {
      return false;
    }
  }
  supportsStreaming() {
    return true;
  }
  supportsFunctionCalling() {
    return true;
  }
  supportsVision() {
    return true;
  }
  getMaxTokens() {
    return 8192;
  }
  getRateLimits() {
    return {
      requestsPerMinute: 60,
      tokensPerMinute: 1e5
    };
  }
  async countTokens(text) {
    return Math.ceil(text.length / 4);
  }
  async validateApiKey() {
    try {
      await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 1,
        messages: [{ role: "user", content: "test" }]
      });
      return true;
    } catch {
      return false;
    }
  }
  // ============================================================================
  // CHAT CONVENIENCE METHODS
  // ============================================================================
  async chatWithSystem(systemPrompt, messages, options) {
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];
    return this.chat(allMessages, options);
  }
  async *chatStream(messages, options) {
    yield* this.stream(messages, options);
  }
  async *chatStreamWithSystem(systemPrompt, messages, options) {
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];
    yield* this.stream(allMessages, options);
  }
  async complete(prompt, options) {
    return this.chat([{ role: "user", content: prompt }], options);
  }
  async *completeStream(prompt, options) {
    yield* this.stream([{ role: "user", content: prompt }], options);
  }
  async embed(text) {
    throw new Error("Anthropic does not support embeddings. Use OpenAI embeddings.");
  }
  async embedBatch(texts) {
    throw new Error("Anthropic does not support embeddings. Use OpenAI embeddings.");
  }
  async chatWithTools(messages, tools, options) {
    return this.chat(messages, { ...options, tools });
  }
  async continueWithToolResults(messages, toolResults, tools, options) {
    const toolMessages = toolResults.map((r) => ({
      role: "tool",
      content: r.result,
      toolCallId: r.toolCallId
    }));
    return this.chat([...messages, ...toolMessages], { ...options, tools });
  }
  getContextWindowSize() {
    return 2e5;
  }
  // ============================================================================
  // CHAT COMPLETION
  // ============================================================================
  async chat(messages, options) {
    const anthropicMessages = this.mapToAnthropicMessages(messages);
    const systemMessage = this.extractSystemMessage(messages);
    const startTime = Date.now();
    const tools = options?.tools ? this.mapToAnthropicTools(options.tools) : void 0;
    const response = await this.client.messages.create({
      model: options?.model ?? this.defaultModel,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      system: systemMessage,
      messages: anthropicMessages,
      tools
    });
    const latencyMs = Date.now() - startTime;
    const textContent = response.content.filter((block) => block.type === "text").map((block) => block.text).join("");
    const toolCalls = response.content.filter(
      (block) => block.type === "tool_use"
    ).map((block) => ({
      id: block.id,
      type: "function",
      function: {
        name: block.name,
        arguments: JSON.stringify(block.input)
      }
    }));
    return {
      id: response.id,
      content: textContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : void 0,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      finishReason: this.mapStopReason(response.stop_reason),
      model: response.model,
      latencyMs
    };
  }
  // ============================================================================
  // STREAMING
  // ============================================================================
  async *stream(messages, options) {
    const anthropicMessages = this.mapToAnthropicMessages(messages);
    const systemMessage = this.extractSystemMessage(messages);
    const model = options?.model ?? this.defaultModel;
    const tools = options?.tools ? this.mapToAnthropicTools(options.tools) : void 0;
    const stream = await this.client.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      system: systemMessage,
      messages: anthropicMessages,
      tools,
      stream: true
    });
    let messageId = "";
    let toolCallBuilder = null;
    for await (const event of stream) {
      if (event.type === "message_start") {
        messageId = event.message.id;
      }
      if (event.type === "content_block_start") {
        if (event.content_block.type === "tool_use") {
          toolCallBuilder = {
            id: event.content_block.id,
            name: event.content_block.name,
            inputJson: ""
          };
        }
      }
      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          yield {
            id: messageId,
            model,
            delta: {
              content: event.delta.text
            }
          };
        } else if (event.delta.type === "input_json_delta" && toolCallBuilder) {
          toolCallBuilder.inputJson += event.delta.partial_json;
        }
      }
      if (event.type === "content_block_stop" && toolCallBuilder) {
        yield {
          id: messageId,
          model,
          delta: {
            toolCalls: [
              {
                id: toolCallBuilder.id,
                type: "function",
                function: {
                  name: toolCallBuilder.name,
                  arguments: toolCallBuilder.inputJson || "{}"
                }
              }
            ]
          }
        };
        toolCallBuilder = null;
      }
      if (event.type === "message_stop") {
        yield {
          id: messageId,
          model,
          delta: {},
          finishReason: "stop"
        };
      }
    }
  }
  // ============================================================================
  // TOOL CALLING
  // ============================================================================
  async callWithTools(messages, tools, options) {
    const response = await this.chat(messages, {
      ...options,
      tools
    });
    return {
      response,
      toolCalls: response.toolCalls ?? []
    };
  }
  // ============================================================================
  // HEALTH CHECK
  // ============================================================================
  async healthCheck() {
    const startTime = Date.now();
    try {
      await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }]
      });
      return {
        healthy: true,
        latencyMs: Date.now() - startTime,
        message: "Anthropic API is healthy"
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        message: `Anthropic API error: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  // ============================================================================
  // HELPERS
  // ============================================================================
  mapToAnthropicMessages(messages) {
    return messages.filter((msg) => msg.role !== "system").map((msg) => {
      if (msg.role === "assistant" && msg.toolCalls) {
        return {
          role: "assistant",
          content: [
            ...msg.content ? [{ type: "text", text: msg.content }] : [],
            ...msg.toolCalls.map((tc) => ({
              type: "tool_use",
              id: tc.id,
              name: tc.function.name,
              input: JSON.parse(tc.function.arguments)
            }))
          ]
        };
      }
      if (msg.role === "tool") {
        return {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: msg.toolCallId ?? "",
              content: msg.content
            }
          ]
        };
      }
      return {
        role: msg.role,
        content: msg.content
      };
    });
  }
  extractSystemMessage(messages) {
    const systemMessages = messages.filter((msg) => msg.role === "system");
    return systemMessages.map((msg) => msg.content).join("\n\n");
  }
  mapToAnthropicTools(tools) {
    return tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters
    }));
  }
  mapStopReason(reason) {
    switch (reason) {
      case "end_turn":
        return "stop";
      case "max_tokens":
        return "length";
      case "tool_use":
        return "tool_calls";
      case "content_filter":
        return "content_filter";
      default:
        return "stop";
    }
  }
};
var TaxomindAIService = class {
  providers = /* @__PURE__ */ new Map();
  defaultProvider;
  constructor(options) {
    if (options?.anthropicApiKey || process.env.ANTHROPIC_API_KEY) {
      this.providers.set(
        "anthropic",
        new AnthropicAIAdapter({
          apiKey: options?.anthropicApiKey
        })
      );
    }
    this.defaultProvider = options?.defaultProvider ?? "anthropic";
  }
  getProvider(name) {
    return this.providers.get(name ?? this.defaultProvider);
  }
  getAdapter(provider) {
    const adapter = this.providers.get(provider ?? this.defaultProvider);
    if (!adapter) {
      throw new Error(`AI provider not available: ${provider ?? this.defaultProvider}`);
    }
    return adapter;
  }
  getDefaultAdapter() {
    return this.getAdapter(this.defaultProvider);
  }
  setDefaultProvider(provider) {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider not registered: ${provider}`);
    }
    this.defaultProvider = provider;
  }
  registerAdapter(name, adapter) {
    this.providers.set(name, adapter);
  }
  listProviders() {
    return Array.from(this.providers.keys());
  }
  async chat(messages, options) {
    const provider = this.getProvider(options?.provider);
    if (!provider) {
      throw new Error(`AI provider not available: ${options?.provider ?? this.defaultProvider}`);
    }
    return provider.chat(messages, options);
  }
  async *chatStream(messages, options) {
    const provider = this.getProvider(options?.provider);
    if (!provider) {
      throw new Error(`AI provider not available: ${options?.provider ?? this.defaultProvider}`);
    }
    yield* provider.chatStream(messages, options);
  }
  async healthCheck() {
    const results = /* @__PURE__ */ new Map();
    await Promise.all(
      Array.from(this.providers.entries()).map(async ([name, provider]) => {
        const status = await provider.healthCheck();
        results.set(name, status);
      })
    );
    return results;
  }
};
function createAnthropicAIAdapter(options) {
  return new AnthropicAIAdapter(options);
}
function createTaxomindAIService(options) {
  return new TaxomindAIService(options);
}

// src/adapters/pgvector-adapter.ts
var import_openai = __toESM(require("openai"), 1);
var OpenAIEmbeddingAdapter = class {
  client = null;
  model;
  _dimensions;
  apiKey;
  constructor(options) {
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
    if (this.apiKey) {
      this.client = new import_openai.default({
        apiKey: this.apiKey
      });
    }
    this.model = options?.model ?? "text-embedding-3-small";
    this._dimensions = options?.dimensions ?? 1536;
  }
  getClient() {
    if (!this.client) {
      throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.");
    }
    return this.client;
  }
  isConfigured() {
    return !!this.apiKey;
  }
  getName() {
    return "openai";
  }
  getModelName() {
    return this.model;
  }
  getDimensions() {
    return this._dimensions;
  }
  async embed(text) {
    const client = this.getClient();
    const response = await client.embeddings.create({
      model: this.model,
      input: text
    });
    return response.data[0].embedding;
  }
  async embedBatch(texts) {
    if (texts.length === 0) {
      return [];
    }
    const client = this.getClient();
    const batchSize = 100;
    const results = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await client.embeddings.create({
        model: this.model,
        input: batch
      });
      results.push(...response.data.map((d) => d.embedding));
    }
    return results;
  }
  async healthCheck() {
    const startTime = Date.now();
    if (!this.isConfigured()) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        message: "OpenAI Embeddings API not configured (no API key)"
      };
    }
    try {
      await this.embed("health check");
      return {
        healthy: true,
        latencyMs: Date.now() - startTime,
        message: "OpenAI Embeddings API is healthy"
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        message: `OpenAI Embeddings API error: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
};
var DeepSeekEmbeddingAdapter = class {
  model;
  _dimensions;
  constructor(options) {
    this.model = options?.model ?? "hash-based-fallback";
    this._dimensions = options?.dimensions ?? 1536;
  }
  getName() {
    return "deepseek";
  }
  getModelName() {
    return this.model;
  }
  getDimensions() {
    return this._dimensions;
  }
  async embed(text) {
    return this.generateHashEmbedding(text);
  }
  async embedBatch(texts) {
    return texts.map((text) => this.generateHashEmbedding(text));
  }
  /**
   * Generate a deterministic embedding from text using hash
   * This is a fallback when no embedding API is available
   */
  generateHashEmbedding(text) {
    const embedding = new Array(this._dimensions).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = charCode * (i + 1) % this._dimensions;
      embedding[index] += Math.sin(charCode * 0.01) * 0.1;
    }
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    return embedding;
  }
  async healthCheck() {
    const startTime = Date.now();
    try {
      await this.embed("health check");
      return {
        healthy: true,
        latencyMs: Date.now() - startTime,
        message: "DeepSeek Embeddings adapter is healthy (using hash-based fallback)"
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        message: `DeepSeek Embeddings error: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
};
function createEmbeddingAdapter(options) {
  const preferredProvider = options?.preferredProvider;
  const dimensions = options?.dimensions ?? 1536;
  if (preferredProvider === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAIEmbeddingAdapter({ dimensions });
  }
  if (preferredProvider === "deepseek" && process.env.DEEPSEEK_API_KEY) {
    return new DeepSeekEmbeddingAdapter({ dimensions });
  }
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIEmbeddingAdapter({ dimensions });
  }
  if (process.env.DEEPSEEK_API_KEY) {
    return new DeepSeekEmbeddingAdapter({ dimensions });
  }
  console.warn("[EmbeddingAdapter] No embedding API configured, using hash-based fallback");
  return new DeepSeekEmbeddingAdapter({ dimensions });
}
var PgVectorAdapter = class {
  constructor(prisma, tableName = "SAMMemory", embeddingColumn = "embedding", contentColumn = "content", options) {
    this.prisma = prisma;
    this.tableName = tableName;
    this.embeddingColumn = embeddingColumn;
    this.contentColumn = contentColumn;
    this.dimensions = options?.dimensions ?? 1536;
    this.embeddingProvider = options?.embeddingProvider;
  }
  connected = true;
  // Prisma handles connections
  dimensions;
  embeddingProvider;
  // -------------------------------------------------------------------------
  // Adapter Info
  // -------------------------------------------------------------------------
  getName() {
    return "pgvector";
  }
  getDimensions() {
    return this.dimensions;
  }
  async isConnected() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
  async connect() {
    this.connected = true;
  }
  async disconnect() {
    this.connected = false;
  }
  async healthCheck() {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1 FROM pg_extension WHERE extname = 'vector'`;
      return {
        healthy: true,
        latencyMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  // -------------------------------------------------------------------------
  // CRUD Operations
  // -------------------------------------------------------------------------
  async getOrCreateVector(content, existingVector) {
    if (existingVector) {
      return existingVector;
    }
    if (this.embeddingProvider) {
      return this.embeddingProvider.embed(content);
    }
    throw new Error("No vector provided and no embedding provider configured");
  }
  createVectorDocument(id, content, vector, metadata) {
    const now = /* @__PURE__ */ new Date();
    return {
      id,
      content,
      vector,
      metadata,
      createdAt: now,
      updatedAt: now
    };
  }
  async insert(input) {
    const id = input.id ?? crypto.randomUUID();
    const vector = await this.getOrCreateVector(input.content, input.vector);
    const vectorString = `[${vector.join(",")}]`;
    const metadata = {
      ...input.metadata,
      contentHash: this.hashContent(input.content)
    };
    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "${this.tableName}" (id, "${this.contentColumn}", "${this.embeddingColumn}", metadata, "createdAt", "updatedAt")
      VALUES ($1, $2, $3::vector, $4, NOW(), NOW())
      `,
      id,
      input.content,
      vectorString,
      JSON.stringify(metadata)
    );
    return this.createVectorDocument(id, input.content, vector, metadata);
  }
  async insertBatch(inputs) {
    const successful = [];
    const failed = [];
    for (const input of inputs) {
      try {
        const doc = await this.insert(input);
        successful.push(doc.id);
      } catch (error) {
        failed.push({
          id: input.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    return {
      successful,
      failed,
      totalProcessed: inputs.length
    };
  }
  async upsert(input) {
    const vector = await this.getOrCreateVector(input.content, input.vector);
    const vectorString = `[${vector.join(",")}]`;
    const metadata = {
      ...input.metadata,
      contentHash: this.hashContent(input.content)
    };
    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "${this.tableName}" (id, "${this.contentColumn}", "${this.embeddingColumn}", metadata, "createdAt", "updatedAt")
      VALUES ($1, $2, $3::vector, $4, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        "${this.contentColumn}" = $2,
        "${this.embeddingColumn}" = $3::vector,
        metadata = $4,
        "updatedAt" = NOW()
      `,
      input.id,
      input.content,
      vectorString,
      JSON.stringify(metadata)
    );
    return this.createVectorDocument(input.id, input.content, vector, metadata);
  }
  async upsertBatch(inputs) {
    const successful = [];
    const failed = [];
    for (const input of inputs) {
      try {
        await this.upsert(input);
        successful.push(input.id);
      } catch (error) {
        failed.push({
          id: input.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    return {
      successful,
      failed,
      totalProcessed: inputs.length
    };
  }
  async get(id) {
    const results = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        id,
        "${this.contentColumn}" as content,
        "${this.embeddingColumn}"::float[] as embedding,
        metadata::text,
        "createdAt",
        "updatedAt"
      FROM "${this.tableName}"
      WHERE id = $1
      `,
      id
    );
    if (results.length === 0) {
      return null;
    }
    const r = results[0];
    return {
      id: r.id,
      content: r.content,
      vector: r.embedding,
      metadata: typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    };
  }
  async getMany(ids) {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const results = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        id,
        "${this.contentColumn}" as content,
        "${this.embeddingColumn}"::float[] as embedding,
        metadata::text,
        "createdAt",
        "updatedAt"
      FROM "${this.tableName}"
      WHERE id IN (${placeholders})
      `,
      ...ids
    );
    return results.map((r) => ({
      id: r.id,
      content: r.content,
      vector: r.embedding,
      metadata: typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }
  async updateMetadata(id, metadata) {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Document not found: ${id}`);
    }
    const updatedMetadata = { ...existing.metadata, ...metadata };
    await this.prisma.$executeRawUnsafe(
      `
      UPDATE "${this.tableName}"
      SET metadata = $2, "updatedAt" = NOW()
      WHERE id = $1
      `,
      id,
      JSON.stringify(updatedMetadata)
    );
    return {
      ...existing,
      metadata: updatedMetadata,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  async delete(id) {
    const result = await this.prisma.$executeRawUnsafe(
      `DELETE FROM "${this.tableName}" WHERE id = $1`,
      id
    );
    return result > 0;
  }
  async deleteBatch(ids) {
    if (ids.length === 0) return 0;
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const result = await this.prisma.$executeRawUnsafe(
      `DELETE FROM "${this.tableName}" WHERE id IN (${placeholders})`,
      ...ids
    );
    return result;
  }
  async deleteByFilter(filter) {
    const { whereClause, params } = this.buildFilterClause(filter);
    if (!whereClause) {
      return 0;
    }
    const result = await this.prisma.$executeRawUnsafe(
      `DELETE FROM "${this.tableName}" ${whereClause}`,
      ...params
    );
    return result;
  }
  // -------------------------------------------------------------------------
  // Search Operations
  // -------------------------------------------------------------------------
  async search(query, options) {
    if (!this.embeddingProvider) {
      throw new Error("No embedding provider configured for text search");
    }
    const vector = await this.embeddingProvider.embed(query);
    return this.searchByVector(vector, options);
  }
  async searchByVector(vector, options) {
    const topK = options.topK;
    const vectorString = `[${vector.join(",")}]`;
    const { whereClause, params } = this.buildFilterClause(options.filter);
    const paramOffset = params.length + 2;
    const results = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        id,
        "${this.contentColumn}" as content,
        ${options.includeVectors ? `"${this.embeddingColumn}"::float[] as embedding,` : ""}
        metadata::text,
        "createdAt",
        "updatedAt",
        "${this.embeddingColumn}" <=> $1::vector as distance
      FROM "${this.tableName}"
      ${whereClause}
      ORDER BY "${this.embeddingColumn}" <=> $1::vector
      LIMIT $2
      `,
      vectorString,
      topK,
      ...params
    );
    return results.filter((r) => {
      const score = 1 - r.distance;
      if (options.minScore && score < options.minScore) return false;
      if (options.maxDistance && r.distance > options.maxDistance) return false;
      return true;
    }).map((r) => ({
      document: {
        id: r.id,
        content: r.content,
        vector: r.embedding ?? [],
        metadata: typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      },
      score: 1 - r.distance,
      distance: r.distance
    }));
  }
  // -------------------------------------------------------------------------
  // Utility Operations
  // -------------------------------------------------------------------------
  async count(filter) {
    const { whereClause, params } = this.buildFilterClause(filter);
    const result = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "${this.tableName}" ${whereClause}`,
      ...params
    );
    return Number(result[0].count);
  }
  async listIds(options) {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;
    const { whereClause, params } = this.buildFilterClause(options?.filter);
    const results = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM "${this.tableName}" ${whereClause} ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      ...params,
      limit,
      offset
    );
    return results.map((r) => r.id);
  }
  async getStats() {
    const countResult = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "${this.tableName}"`
    );
    return {
      totalDocuments: Number(countResult[0].count),
      dimensions: this.dimensions,
      isReady: this.connected
    };
  }
  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  buildFilterClause(filter) {
    if (!filter) {
      return { whereClause: "", params: [] };
    }
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    if (filter.sourceTypes?.length) {
      conditions.push(`metadata->>'sourceType' = ANY($${paramIndex})`);
      params.push(filter.sourceTypes);
      paramIndex++;
    }
    if (filter.userIds?.length) {
      conditions.push(`metadata->>'userId' = ANY($${paramIndex})`);
      params.push(filter.userIds);
      paramIndex++;
    }
    if (filter.courseIds?.length) {
      conditions.push(`metadata->>'courseId' = ANY($${paramIndex})`);
      params.push(filter.courseIds);
      paramIndex++;
    }
    if (filter.tags?.length) {
      conditions.push(`metadata->'tags' ?| $${paramIndex}`);
      params.push(filter.tags);
      paramIndex++;
    }
    if (filter.dateRange?.start) {
      conditions.push(`"createdAt" >= $${paramIndex}`);
      params.push(filter.dateRange.start);
      paramIndex++;
    }
    if (filter.dateRange?.end) {
      conditions.push(`"createdAt" <= $${paramIndex}`);
      params.push(filter.dateRange.end);
      paramIndex++;
    }
    if (conditions.length === 0) {
      return { whereClause: "", params: [] };
    }
    return {
      whereClause: `WHERE ${conditions.join(" AND ")}`,
      params
    };
  }
  hashContent(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
};
var TaxomindVectorService = class {
  constructor(embeddingAdapter, vectorAdapter) {
    this.embeddingAdapter = embeddingAdapter;
    this.vectorAdapter = vectorAdapter;
  }
  getAdapter() {
    return this.vectorAdapter;
  }
  getEmbeddingProvider() {
    return this.embeddingAdapter;
  }
  async insertWithEmbedding(content, metadata) {
    const vector = await this.embeddingAdapter.embed(content);
    return this.vectorAdapter.insert({
      content,
      vector,
      metadata
    });
  }
  async insertBatchWithEmbedding(items) {
    const texts = items.map((item) => item.content);
    const embeddings = await this.embeddingAdapter.embedBatch(texts);
    const inputs = items.map((item, i) => ({
      content: item.content,
      vector: embeddings[i],
      metadata: item.metadata
    }));
    return this.vectorAdapter.insertBatch(inputs);
  }
  async semanticSearch(query, options) {
    const queryVector = await this.embeddingAdapter.embed(query);
    return this.vectorAdapter.searchByVector(queryVector, options);
  }
};
function createOpenAIEmbeddingAdapter(options) {
  return new OpenAIEmbeddingAdapter(options);
}
function createPgVectorAdapter(prisma, options) {
  return new PgVectorAdapter(
    prisma,
    options?.tableName,
    options?.embeddingColumn,
    options?.contentColumn
  );
}
function createTaxomindVectorService(prisma, options) {
  const embeddingAdapter = options?.openaiApiKey ? new OpenAIEmbeddingAdapter({
    apiKey: options.openaiApiKey,
    model: options?.embeddingModel
  }) : createEmbeddingAdapter({
    preferredProvider: options?.preferredProvider
  });
  const vectorAdapter = new PgVectorAdapter(prisma, options?.tableName);
  return new TaxomindVectorService(embeddingAdapter, vectorAdapter);
}

// src/adapters/sam-vector-embedding-adapter.ts
var import_crypto = require("crypto");
var DEFAULT_DIMENSIONS = 1536;
function hashContent(content) {
  return (0, import_crypto.createHash)("sha256").update(content).digest("hex");
}
function cosineSimilarity(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}
function euclideanDistance(a, b) {
  if (a.length !== b.length || a.length === 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
function mapRecordToDocument(record, includeVector) {
  const vector = Array.isArray(record.embedding) ? record.embedding : [];
  return {
    id: record.id,
    content: record.contentText ?? "",
    vector: includeVector ? vector : [],
    metadata: {
      sourceId: record.sourceId,
      sourceType: record.sourceType,
      userId: record.userId ?? void 0,
      courseId: record.courseId ?? void 0,
      chapterId: record.chapterId ?? void 0,
      sectionId: record.sectionId ?? void 0,
      tags: record.tags ?? [],
      language: record.language ?? void 0,
      contentHash: record.contentHash,
      custom: record.customMetadata ?? void 0
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}
function splitCustomFilter(filter) {
  const custom = filter?.custom ?? {};
  const entityId = typeof custom.entityId === "string" ? custom.entityId : void 0;
  const entityType = typeof custom.entityType === "string" ? custom.entityType : void 0;
  const stripped = {};
  for (const [key, value] of Object.entries(custom)) {
    if (key === "entityId" || key === "entityType") continue;
    stripped[key] = value;
  }
  return { entityId, entityType, custom: stripped };
}
function matchesCustomMetadata(recordCustom, customFilter) {
  if (!customFilter || Object.keys(customFilter).length === 0) return true;
  const record = recordCustom ?? {};
  return Object.entries(customFilter).every(([key, value]) => record[key] === value);
}
var SAMVectorEmbeddingAdapter = class {
  constructor(prisma, options) {
    this.prisma = prisma;
    this.embeddingProvider = options?.embeddingProvider;
    this.dimensions = options?.dimensions ?? this.embeddingProvider?.getDimensions() ?? DEFAULT_DIMENSIONS;
  }
  connected = true;
  dimensions;
  embeddingProvider;
  getName() {
    return "sam_vector_embedding";
  }
  getDimensions() {
    return this.dimensions;
  }
  async isConnected() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
  async connect() {
    this.connected = true;
  }
  async disconnect() {
    this.connected = false;
  }
  async healthCheck() {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  // -------------------------------------------------------------------------
  // CRUD Operations
  // -------------------------------------------------------------------------
  async getOrCreateVector(content, existingVector) {
    if (existingVector) {
      return existingVector;
    }
    if (this.embeddingProvider) {
      return this.embeddingProvider.embed(content);
    }
    throw new Error("No vector provided and no embedding provider configured");
  }
  buildWhere(filter) {
    if (!filter) return {};
    const { entityId, entityType } = splitCustomFilter(filter);
    const where = {};
    if (filter.sourceTypes?.length) {
      where.sourceType = { in: filter.sourceTypes };
    }
    if (entityType) {
      where.sourceType = entityType;
    }
    if (entityId) {
      where.sourceId = entityId;
    }
    if (filter.userIds?.length) {
      where.userId = { in: filter.userIds };
    }
    if (filter.courseIds?.length) {
      where.courseId = { in: filter.courseIds };
    }
    if (filter.chapterIds?.length) {
      where.chapterId = { in: filter.chapterIds };
    }
    if (filter.sectionIds?.length) {
      where.sectionId = { in: filter.sectionIds };
    }
    if (filter.tags?.length) {
      where.tags = { hasSome: filter.tags };
    }
    if (filter.dateRange?.start || filter.dateRange?.end) {
      where.createdAt = {};
      if (filter.dateRange.start) {
        where.createdAt.gte = filter.dateRange.start;
      }
      if (filter.dateRange.end) {
        where.createdAt.lte = filter.dateRange.end;
      }
    }
    return where;
  }
  buildMetadata(metadata, contentHash) {
    return {
      ...metadata,
      contentHash,
      tags: metadata.tags ?? []
    };
  }
  async insert(input) {
    const id = input.id ?? (0, import_crypto.randomUUID)();
    const vector = await this.getOrCreateVector(input.content, input.vector);
    const contentHash = hashContent(input.content);
    const metadata = this.buildMetadata(input.metadata, contentHash);
    const record = await this.prisma.sAMVectorEmbedding.create({
      data: {
        id,
        sourceId: metadata.sourceId,
        sourceType: metadata.sourceType,
        userId: metadata.userId,
        courseId: metadata.courseId,
        chapterId: metadata.chapterId,
        sectionId: metadata.sectionId,
        contentHash,
        contentText: input.content,
        tags: metadata.tags ?? [],
        language: metadata.language,
        customMetadata: metadata.custom,
        embedding: vector,
        dimensions: vector.length || this.dimensions
      }
    });
    return mapRecordToDocument(record, true);
  }
  async insertBatch(inputs) {
    const successful = [];
    const failed = [];
    for (const input of inputs) {
      try {
        const doc = await this.insert(input);
        successful.push(doc.id);
      } catch (error) {
        failed.push({
          id: input.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    return { successful, failed, totalProcessed: inputs.length };
  }
  async upsert(input) {
    const vector = await this.getOrCreateVector(input.content, input.vector);
    const contentHash = hashContent(input.content);
    const metadata = this.buildMetadata(input.metadata, contentHash);
    const record = await this.prisma.sAMVectorEmbedding.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        sourceId: metadata.sourceId,
        sourceType: metadata.sourceType,
        userId: metadata.userId,
        courseId: metadata.courseId,
        chapterId: metadata.chapterId,
        sectionId: metadata.sectionId,
        contentHash,
        contentText: input.content,
        tags: metadata.tags ?? [],
        language: metadata.language,
        customMetadata: metadata.custom,
        embedding: vector,
        dimensions: vector.length || this.dimensions
      },
      update: {
        sourceId: metadata.sourceId,
        sourceType: metadata.sourceType,
        userId: metadata.userId,
        courseId: metadata.courseId,
        chapterId: metadata.chapterId,
        sectionId: metadata.sectionId,
        contentHash,
        contentText: input.content,
        tags: metadata.tags ?? [],
        language: metadata.language,
        customMetadata: metadata.custom,
        embedding: vector,
        dimensions: vector.length || this.dimensions
      }
    });
    return mapRecordToDocument(record, true);
  }
  async upsertBatch(inputs) {
    const successful = [];
    const failed = [];
    for (const input of inputs) {
      try {
        await this.upsert(input);
        successful.push(input.id);
      } catch (error) {
        failed.push({
          id: input.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    return { successful, failed, totalProcessed: inputs.length };
  }
  async get(id) {
    const record = await this.prisma.sAMVectorEmbedding.findUnique({ where: { id } });
    if (!record) return null;
    return mapRecordToDocument(record, true);
  }
  async getMany(ids) {
    if (ids.length === 0) return [];
    const records = await this.prisma.sAMVectorEmbedding.findMany({
      where: { id: { in: ids } }
    });
    return records.map((record) => mapRecordToDocument(record, true));
  }
  async updateMetadata(id, metadata) {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Document not found: ${id}`);
    }
    const mergedMetadata = {
      ...existing.metadata,
      ...metadata,
      tags: metadata.tags ?? existing.metadata.tags,
      custom: metadata.custom ?? existing.metadata.custom,
      contentHash: metadata.contentHash ?? existing.metadata.contentHash
    };
    const record = await this.prisma.sAMVectorEmbedding.update({
      where: { id },
      data: {
        sourceId: mergedMetadata.sourceId,
        sourceType: mergedMetadata.sourceType,
        userId: mergedMetadata.userId,
        courseId: mergedMetadata.courseId,
        chapterId: mergedMetadata.chapterId,
        sectionId: mergedMetadata.sectionId,
        contentHash: mergedMetadata.contentHash,
        tags: mergedMetadata.tags ?? [],
        language: mergedMetadata.language,
        customMetadata: mergedMetadata.custom
      }
    });
    return mapRecordToDocument(record, true);
  }
  async delete(id) {
    try {
      await this.prisma.sAMVectorEmbedding.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
  async deleteBatch(ids) {
    if (ids.length === 0) return 0;
    const result = await this.prisma.sAMVectorEmbedding.deleteMany({
      where: { id: { in: ids } }
    });
    return result.count;
  }
  async deleteByFilter(filter) {
    const { custom } = splitCustomFilter(filter);
    const where = this.buildWhere(filter);
    if (!custom || Object.keys(custom).length === 0) {
      const result2 = await this.prisma.sAMVectorEmbedding.deleteMany({ where });
      return result2.count;
    }
    const candidates = await this.prisma.sAMVectorEmbedding.findMany({
      where,
      select: { id: true, customMetadata: true }
    });
    const ids = candidates.filter((record) => matchesCustomMetadata(record.customMetadata, custom)).map((record) => record.id);
    if (ids.length === 0) return 0;
    const result = await this.prisma.sAMVectorEmbedding.deleteMany({
      where: { id: { in: ids } }
    });
    return result.count;
  }
  // -------------------------------------------------------------------------
  // Search Operations
  // -------------------------------------------------------------------------
  async search(query, options) {
    if (!this.embeddingProvider) {
      throw new Error("No embedding provider configured for text search");
    }
    const vector = await this.embeddingProvider.embed(query);
    return this.searchByVector(vector, options);
  }
  async searchByVector(vector, options) {
    const where = this.buildWhere(options.filter);
    const { custom } = splitCustomFilter(options.filter);
    const records = await this.prisma.sAMVectorEmbedding.findMany({ where });
    const includeVectors = options.includeVectors ?? false;
    const results = records.filter((record) => matchesCustomMetadata(record.customMetadata, custom)).map((record) => {
      const embedding = Array.isArray(record.embedding) ? record.embedding : [];
      const score = cosineSimilarity(vector, embedding);
      const distance = euclideanDistance(vector, embedding);
      return {
        document: mapRecordToDocument(record, includeVectors),
        score,
        distance
      };
    }).filter((result) => {
      if (options.minScore !== void 0 && result.score < options.minScore) return false;
      if (options.maxDistance !== void 0 && result.distance > options.maxDistance) return false;
      return true;
    }).sort((a, b) => b.score - a.score).slice(0, options.topK);
    return results;
  }
  // -------------------------------------------------------------------------
  // Utility Operations
  // -------------------------------------------------------------------------
  async count(filter) {
    const { custom } = splitCustomFilter(filter);
    const where = this.buildWhere(filter);
    if (!custom || Object.keys(custom).length === 0) {
      return this.prisma.sAMVectorEmbedding.count({ where });
    }
    const candidates = await this.prisma.sAMVectorEmbedding.findMany({
      where,
      select: { id: true, customMetadata: true }
    });
    return candidates.filter((record) => matchesCustomMetadata(record.customMetadata, custom)).length;
  }
  async listIds(options) {
    const { custom } = splitCustomFilter(options?.filter);
    const where = this.buildWhere(options?.filter);
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;
    if (!custom || Object.keys(custom).length === 0) {
      const records = await this.prisma.sAMVectorEmbedding.findMany({
        where,
        select: { id: true },
        skip: offset,
        take: limit
      });
      return records.map((r) => r.id);
    }
    const candidates = await this.prisma.sAMVectorEmbedding.findMany({
      where,
      select: { id: true, customMetadata: true }
    });
    return candidates.filter((record) => matchesCustomMetadata(record.customMetadata, custom)).slice(offset, offset + limit).map((r) => r.id);
  }
  async getStats() {
    const totalDocuments = await this.prisma.sAMVectorEmbedding.count();
    const lastRecord = await this.prisma.sAMVectorEmbedding.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true }
    });
    return {
      totalDocuments,
      dimensions: this.dimensions,
      lastUpdated: lastRecord?.updatedAt ?? void 0,
      isReady: this.connected
    };
  }
};
function createSAMVectorEmbeddingAdapter(prisma, options) {
  return new SAMVectorEmbeddingAdapter(prisma, options);
}
function createTaxomindSAMVectorService(prisma, options) {
  const embeddingAdapter = options?.openaiApiKey ? new OpenAIEmbeddingAdapter({
    apiKey: options.openaiApiKey,
    model: options?.embeddingModel,
    dimensions: options?.dimensions
  }) : createEmbeddingAdapter({
    preferredProvider: options?.preferredProvider,
    dimensions: options?.dimensions
  });
  const vectorAdapter = new SAMVectorEmbeddingAdapter(prisma, {
    embeddingProvider: embeddingAdapter,
    dimensions: options?.dimensions ?? embeddingAdapter.getDimensions()
  });
  return new TaxomindVectorService(embeddingAdapter, vectorAdapter);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AnthropicAIAdapter,
  DeepSeekEmbeddingAdapter,
  NextAuthAdapter,
  OpenAIEmbeddingAdapter,
  PgVectorAdapter,
  PrismaDatabaseAdapter,
  PrismaRepositoryFactory,
  SAMVectorEmbeddingAdapter,
  TaxomindAIService,
  TaxomindVectorService,
  createAnthropicAIAdapter,
  createEmbeddingAdapter,
  createNextAuthAdapter,
  createOpenAIEmbeddingAdapter,
  createPgVectorAdapter,
  createPrismaDatabaseAdapter,
  createPrismaRepositoryFactory,
  createSAMVectorEmbeddingAdapter,
  createTaxomindAIService,
  createTaxomindSAMVectorService,
  createTaxomindVectorService
});
//# sourceMappingURL=index.cjs.map