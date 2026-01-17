/**
 * @sam-ai/memory - Memory Store Tests
 * Tests for InMemoryMemoryStore
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryMemoryStore, createInMemoryMemoryStore, getDefaultMemoryStore, resetDefaultMemoryStore, } from '../evaluation-memory-integration';
import { createSampleMemoryEntry, ALL_MEMORY_ENTRY_TYPES, ALL_IMPORTANCE_LEVELS } from './setup';
describe('InMemoryMemoryStore', () => {
    let store;
    beforeEach(() => {
        store = new InMemoryMemoryStore();
    });
    // ============================================================================
    // STORE TESTS
    // ============================================================================
    describe('store', () => {
        it('should create a new memory entry with generated id', async () => {
            const entry = createSampleMemoryEntry();
            const { id: _id, accessCount: _accessCount, ...entryWithoutId } = entry;
            const result = await store.store(entryWithoutId);
            expect(result.id).toBeDefined();
            expect(result.accessCount).toBe(0);
            expect(result.studentId).toBe(entry.studentId);
        });
        it('should store multiple entries', async () => {
            await store.store(createSampleMemoryEntry({ studentId: 'student-1' }));
            await store.store(createSampleMemoryEntry({ studentId: 'student-1' }));
            const all = store.getAll();
            expect(all).toHaveLength(2);
        });
        it('should preserve all entry properties', async () => {
            const entry = createSampleMemoryEntry({
                type: 'BREAKTHROUGH',
                importance: 'critical',
                relatedTopics: ['topic-1', 'topic-2'],
                tags: ['tag1', 'tag2', 'tag3'],
                ttlDays: 30,
            });
            const result = await store.store(entry);
            expect(result.type).toBe('BREAKTHROUGH');
            expect(result.importance).toBe('critical');
            expect(result.relatedTopics).toEqual(['topic-1', 'topic-2']);
            expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
            expect(result.ttlDays).toBe(30);
        });
    });
    // ============================================================================
    // GET TESTS
    // ============================================================================
    describe('get', () => {
        it('should return null for non-existent entry', async () => {
            const result = await store.get('non-existent');
            expect(result).toBeNull();
        });
        it('should return stored entry by id', async () => {
            const stored = await store.store(createSampleMemoryEntry());
            const result = await store.get(stored.id);
            expect(result).toBeDefined();
            expect(result?.id).toBe(stored.id);
        });
    });
    // ============================================================================
    // GET BY TYPE TESTS
    // ============================================================================
    describe('getByType', () => {
        it('should return empty array when no entries', async () => {
            const result = await store.getByType('student-1', 'EVALUATION_OUTCOME');
            expect(result).toEqual([]);
        });
        it('should return entries matching type for student', async () => {
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                type: 'EVALUATION_OUTCOME',
            }));
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                type: 'MASTERY_UPDATE',
            }));
            await store.store(createSampleMemoryEntry({
                studentId: 'student-2',
                type: 'EVALUATION_OUTCOME',
            }));
            const result = await store.getByType('student-1', 'EVALUATION_OUTCOME');
            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('EVALUATION_OUTCOME');
        });
        it('should sort by creation date descending', async () => {
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                type: 'EVALUATION_OUTCOME',
                createdAt: new Date('2024-01-01'),
            }));
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                type: 'EVALUATION_OUTCOME',
                createdAt: new Date('2024-01-20'),
            }));
            const result = await store.getByType('student-1', 'EVALUATION_OUTCOME');
            expect(result[0].createdAt.getTime()).toBeGreaterThan(result[1].createdAt.getTime());
        });
        it('should respect limit parameter', async () => {
            for (let i = 0; i < 10; i++) {
                await store.store(createSampleMemoryEntry({
                    studentId: 'student-1',
                    type: 'EVALUATION_OUTCOME',
                }));
            }
            const result = await store.getByType('student-1', 'EVALUATION_OUTCOME', 5);
            expect(result).toHaveLength(5);
        });
        it('should handle all memory entry types', async () => {
            for (const type of ALL_MEMORY_ENTRY_TYPES) {
                await store.store(createSampleMemoryEntry({
                    studentId: 'student-1',
                    type,
                }));
            }
            for (const type of ALL_MEMORY_ENTRY_TYPES) {
                const result = await store.getByType('student-1', type);
                expect(result).toHaveLength(1);
                expect(result[0].type).toBe(type);
            }
        });
    });
    // ============================================================================
    // GET BY TOPIC TESTS
    // ============================================================================
    describe('getByTopic', () => {
        it('should return empty array when no matching entries', async () => {
            const result = await store.getByTopic('student-1', 'topic-1');
            expect(result).toEqual([]);
        });
        it('should return entries with topic in relatedTopics', async () => {
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                relatedTopics: ['topic-1', 'topic-2'],
            }));
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                relatedTopics: ['topic-3'],
            }));
            const result = await store.getByTopic('student-1', 'topic-1');
            expect(result).toHaveLength(1);
            expect(result[0].relatedTopics).toContain('topic-1');
        });
        it('should only return entries for specified student', async () => {
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                relatedTopics: ['topic-1'],
            }));
            await store.store(createSampleMemoryEntry({
                studentId: 'student-2',
                relatedTopics: ['topic-1'],
            }));
            const result = await store.getByTopic('student-1', 'topic-1');
            expect(result).toHaveLength(1);
            expect(result[0].studentId).toBe('student-1');
        });
        it('should respect limit parameter', async () => {
            for (let i = 0; i < 10; i++) {
                await store.store(createSampleMemoryEntry({
                    studentId: 'student-1',
                    relatedTopics: ['topic-1'],
                }));
            }
            const result = await store.getByTopic('student-1', 'topic-1', 3);
            expect(result).toHaveLength(3);
        });
    });
    // ============================================================================
    // GET RECENT TESTS
    // ============================================================================
    describe('getRecent', () => {
        it('should return empty array for new student', async () => {
            const result = await store.getRecent('student-1');
            expect(result).toEqual([]);
        });
        it('should return all entries for student sorted by date', async () => {
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                type: 'EVALUATION_OUTCOME',
                createdAt: new Date('2024-01-01'),
            }));
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                type: 'MASTERY_UPDATE',
                createdAt: new Date('2024-01-15'),
            }));
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                type: 'BREAKTHROUGH',
                createdAt: new Date('2024-01-10'),
            }));
            const result = await store.getRecent('student-1');
            expect(result).toHaveLength(3);
            expect(result[0].type).toBe('MASTERY_UPDATE'); // Most recent
        });
        it('should respect limit parameter', async () => {
            for (let i = 0; i < 10; i++) {
                await store.store(createSampleMemoryEntry({ studentId: 'student-1' }));
            }
            const result = await store.getRecent('student-1', 5);
            expect(result).toHaveLength(5);
        });
    });
    // ============================================================================
    // GET IMPORTANT TESTS
    // ============================================================================
    describe('getImportant', () => {
        it('should return entries at or above minimum importance', async () => {
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                importance: 'low',
            }));
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                importance: 'medium',
            }));
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                importance: 'high',
            }));
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                importance: 'critical',
            }));
            const result = await store.getImportant('student-1', 'high');
            expect(result).toHaveLength(2);
            expect(result.every((e) => e.importance === 'high' || e.importance === 'critical')).toBe(true);
        });
        it('should return all entries when minimum is low', async () => {
            for (const importance of ALL_IMPORTANCE_LEVELS) {
                await store.store(createSampleMemoryEntry({
                    studentId: 'student-1',
                    importance,
                }));
            }
            const result = await store.getImportant('student-1', 'low');
            expect(result).toHaveLength(4);
        });
        it('should only return critical when minimum is critical', async () => {
            for (const importance of ALL_IMPORTANCE_LEVELS) {
                await store.store(createSampleMemoryEntry({
                    studentId: 'student-1',
                    importance,
                }));
            }
            const result = await store.getImportant('student-1', 'critical');
            expect(result).toHaveLength(1);
            expect(result[0].importance).toBe('critical');
        });
    });
    // ============================================================================
    // RECORD ACCESS TESTS
    // ============================================================================
    describe('recordAccess', () => {
        it('should update lastAccessedAt and increment accessCount', async () => {
            const entry = await store.store(createSampleMemoryEntry());
            expect(entry.accessCount).toBe(0);
            await store.recordAccess(entry.id);
            const updated1 = await store.get(entry.id);
            expect(updated1?.accessCount).toBe(1);
            expect(updated1?.lastAccessedAt).toBeDefined();
            await store.recordAccess(entry.id);
            const updated2 = await store.get(entry.id);
            expect(updated2?.accessCount).toBe(2);
        });
        it('should handle non-existent entry gracefully', async () => {
            await expect(store.recordAccess('non-existent')).resolves.not.toThrow();
        });
    });
    // ============================================================================
    // PRUNE EXPIRED TESTS
    // ============================================================================
    describe('pruneExpired', () => {
        it('should delete expired entries with ttlDays', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 100);
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                createdAt: oldDate,
                ttlDays: 30,
            }));
            const result = await store.pruneExpired();
            expect(result).toBe(1);
            expect(store.getAll()).toHaveLength(0);
        });
        it('should not delete entries without ttlDays', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 100);
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                createdAt: oldDate,
                ttlDays: undefined,
            }));
            const result = await store.pruneExpired();
            expect(result).toBe(0);
            expect(store.getAll()).toHaveLength(1);
        });
        it('should not delete non-expired entries', async () => {
            await store.store(createSampleMemoryEntry({
                studentId: 'student-1',
                createdAt: new Date(),
                ttlDays: 365,
            }));
            const result = await store.pruneExpired();
            expect(result).toBe(0);
            expect(store.getAll()).toHaveLength(1);
        });
    });
    // ============================================================================
    // DELETE FOR STUDENT TESTS
    // ============================================================================
    describe('deleteForStudent', () => {
        it('should delete all entries for student', async () => {
            await store.store(createSampleMemoryEntry({ studentId: 'student-1' }));
            await store.store(createSampleMemoryEntry({ studentId: 'student-1' }));
            await store.store(createSampleMemoryEntry({ studentId: 'student-2' }));
            const result = await store.deleteForStudent('student-1');
            expect(result).toBe(2);
            expect(store.getAll()).toHaveLength(1);
            expect(store.getAll()[0].studentId).toBe('student-2');
        });
        it('should return 0 when student has no entries', async () => {
            const result = await store.deleteForStudent('non-existent');
            expect(result).toBe(0);
        });
    });
    // ============================================================================
    // UTILITY METHODS TESTS
    // ============================================================================
    describe('utility methods', () => {
        it('should clear all entries', async () => {
            await store.store(createSampleMemoryEntry());
            await store.store(createSampleMemoryEntry());
            store.clear();
            expect(store.getAll()).toHaveLength(0);
        });
        it('should return all entries', async () => {
            await store.store(createSampleMemoryEntry({ studentId: 'student-1' }));
            await store.store(createSampleMemoryEntry({ studentId: 'student-2' }));
            expect(store.getAll()).toHaveLength(2);
        });
    });
});
// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================
describe('Factory Functions', () => {
    describe('createInMemoryMemoryStore', () => {
        it('should create InMemoryMemoryStore instance', () => {
            const store = createInMemoryMemoryStore();
            expect(store).toBeInstanceOf(InMemoryMemoryStore);
        });
    });
    describe('getDefaultMemoryStore', () => {
        beforeEach(() => {
            resetDefaultMemoryStore();
        });
        it('should return same instance on multiple calls', () => {
            const store1 = getDefaultMemoryStore();
            const store2 = getDefaultMemoryStore();
            expect(store1).toBe(store2);
        });
        it('should create new instance after reset', () => {
            const store1 = getDefaultMemoryStore();
            resetDefaultMemoryStore();
            const store2 = getDefaultMemoryStore();
            expect(store1).not.toBe(store2);
        });
    });
});
//# sourceMappingURL=memory-store.test.js.map