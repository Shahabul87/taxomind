/**
 * @sam-ai/agentic - KnowledgeGraphManager Tests
 * Comprehensive tests for entity relationships and graph traversal
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  KnowledgeGraphManager,
  createKnowledgeGraphManager,
  InMemoryGraphStore,
  type KnowledgeGraphConfig,
} from '../src/memory/knowledge-graph';
import { EntityType, RelationshipType } from '../src/memory/types';

// ============================================================================
// TESTS
// ============================================================================

describe('KnowledgeGraphManager', () => {
  let graphManager: KnowledgeGraphManager;
  let config: KnowledgeGraphConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    config = {
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      maxTraversalDepth: 5,
      defaultRelationshipWeight: 1.0,
    };
    graphManager = new KnowledgeGraphManager(config);
  });

  describe('constructor', () => {
    it('should create a KnowledgeGraphManager instance', () => {
      expect(graphManager).toBeInstanceOf(KnowledgeGraphManager);
    });

    it('should use default values if not provided', () => {
      const manager = new KnowledgeGraphManager();
      expect(manager).toBeInstanceOf(KnowledgeGraphManager);
    });
  });

  describe('createKnowledgeGraphManager factory', () => {
    it('should create a KnowledgeGraphManager using factory function', () => {
      const instance = createKnowledgeGraphManager(config);
      expect(instance).toBeInstanceOf(KnowledgeGraphManager);
    });
  });

  describe('Entity Management', () => {
    describe('createEntity', () => {
      it('should create an entity', async () => {
        const entity = await graphManager.createEntity(
          EntityType.CONCEPT,
          'Machine Learning',
          { description: 'The study of algorithms that improve with experience' }
        );

        expect(entity).toBeDefined();
        expect(entity.id).toBeDefined();
        expect(entity.type).toBe(EntityType.CONCEPT);
        expect(entity.name).toBe('Machine Learning');
        expect(entity.description).toBe(
          'The study of algorithms that improve with experience'
        );
      });

      it('should create entity with properties', async () => {
        const entity = await graphManager.createEntity(
          EntityType.SKILL,
          'Python Programming',
          {
            properties: { difficulty: 'beginner', category: 'programming' },
          }
        );

        expect(entity.properties.difficulty).toBe('beginner');
        expect(entity.properties.category).toBe('programming');
      });

      it('should create entity with embeddings', async () => {
        const entity = await graphManager.createEntity(EntityType.TOPIC, 'NLP', {
          embeddings: ['embed-1', 'embed-2'],
        });

        expect(entity.embeddings).toContain('embed-1');
        expect(entity.embeddings).toContain('embed-2');
      });
    });

    describe('getEntity', () => {
      it('should get an entity by ID', async () => {
        const created = await graphManager.createEntity(
          EntityType.CONCEPT,
          'Test'
        );
        const retrieved = await graphManager.getEntity(created.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(created.id);
      });

      it('should return null for non-existent ID', async () => {
        const result = await graphManager.getEntity('non-existent');
        expect(result).toBeNull();
      });
    });

    describe('updateEntity', () => {
      it('should update an entity', async () => {
        const created = await graphManager.createEntity(
          EntityType.CONCEPT,
          'Original'
        );

        const updated = await graphManager.updateEntity(created.id, {
          name: 'Updated',
          description: 'New description',
        });

        expect(updated.name).toBe('Updated');
        expect(updated.description).toBe('New description');
      });
    });

    describe('deleteEntity', () => {
      it('should delete an entity', async () => {
        const created = await graphManager.createEntity(
          EntityType.CONCEPT,
          'ToDelete'
        );

        const deleted = await graphManager.deleteEntity(created.id);
        expect(deleted).toBe(true);

        const retrieved = await graphManager.getEntity(created.id);
        expect(retrieved).toBeNull();
      });

      it('should return false for non-existent entity', async () => {
        const result = await graphManager.deleteEntity('non-existent');
        expect(result).toBe(false);
      });
    });

    describe('findEntities', () => {
      beforeEach(async () => {
        await graphManager.createEntity(EntityType.CONCEPT, 'Machine Learning');
        await graphManager.createEntity(EntityType.CONCEPT, 'Deep Learning');
        await graphManager.createEntity(EntityType.TOPIC, 'NLP');
      });

      it('should find entities by type', async () => {
        const concepts = await graphManager.findEntities(EntityType.CONCEPT);

        expect(concepts).toHaveLength(2);
        concepts.forEach((c) => expect(c.type).toBe(EntityType.CONCEPT));
      });

      it('should filter by query', async () => {
        const results = await graphManager.findEntities(
          EntityType.CONCEPT,
          'Machine'
        );

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Machine Learning');
      });

      it('should limit results', async () => {
        const results = await graphManager.findEntities(
          EntityType.CONCEPT,
          undefined,
          1
        );

        expect(results).toHaveLength(1);
      });
    });
  });

  describe('Relationship Management', () => {
    let source: { id: string };
    let target: { id: string };

    beforeEach(async () => {
      source = await graphManager.createEntity(EntityType.CONCEPT, 'Algebra');
      target = await graphManager.createEntity(EntityType.CONCEPT, 'Calculus');
    });

    describe('createRelationship', () => {
      it('should create a relationship', async () => {
        const rel = await graphManager.createRelationship(
          source.id,
          target.id,
          RelationshipType.PREREQUISITE_OF
        );

        expect(rel).toBeDefined();
        expect(rel.id).toBeDefined();
        expect(rel.sourceId).toBe(source.id);
        expect(rel.targetId).toBe(target.id);
        expect(rel.type).toBe(RelationshipType.PREREQUISITE_OF);
      });

      it('should set custom weight', async () => {
        const rel = await graphManager.createRelationship(
          source.id,
          target.id,
          RelationshipType.RELATED_TO,
          { weight: 0.8 }
        );

        expect(rel.weight).toBe(0.8);
      });

      it('should set custom properties', async () => {
        const rel = await graphManager.createRelationship(
          source.id,
          target.id,
          RelationshipType.TEACHES,
          { properties: { duration: '2 weeks' } }
        );

        expect(rel.properties.duration).toBe('2 weeks');
      });

      it('should throw for non-existent source', async () => {
        await expect(
          graphManager.createRelationship(
            'non-existent',
            target.id,
            RelationshipType.RELATED_TO
          )
        ).rejects.toThrow('Source entity not found');
      });

      it('should throw for non-existent target', async () => {
        await expect(
          graphManager.createRelationship(
            source.id,
            'non-existent',
            RelationshipType.RELATED_TO
          )
        ).rejects.toThrow('Target entity not found');
      });
    });

    describe('getRelationship', () => {
      it('should get a relationship by ID', async () => {
        const created = await graphManager.createRelationship(
          source.id,
          target.id,
          RelationshipType.RELATED_TO
        );

        const retrieved = await graphManager.getRelationship(created.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(created.id);
      });

      it('should return null for non-existent ID', async () => {
        const result = await graphManager.getRelationship('non-existent');
        expect(result).toBeNull();
      });
    });

    describe('deleteRelationship', () => {
      it('should delete a relationship', async () => {
        const created = await graphManager.createRelationship(
          source.id,
          target.id,
          RelationshipType.RELATED_TO
        );

        const deleted = await graphManager.deleteRelationship(created.id);
        expect(deleted).toBe(true);

        const retrieved = await graphManager.getRelationship(created.id);
        expect(retrieved).toBeNull();
      });
    });

    describe('getRelationships', () => {
      it('should get relationships for an entity', async () => {
        await graphManager.createRelationship(
          source.id,
          target.id,
          RelationshipType.PREREQUISITE_OF
        );

        const rels = await graphManager.getRelationships(source.id);

        expect(rels.length).toBeGreaterThan(0);
      });

      it('should filter by direction', async () => {
        await graphManager.createRelationship(
          source.id,
          target.id,
          RelationshipType.PREREQUISITE_OF
        );

        const outgoing = await graphManager.getRelationships(source.id, {
          direction: 'outgoing',
        });
        const incoming = await graphManager.getRelationships(source.id, {
          direction: 'incoming',
        });

        expect(outgoing.length).toBe(1);
        expect(incoming.length).toBe(0);
      });
    });
  });

  describe('Graph Traversal', () => {
    beforeEach(async () => {
      // Create a small knowledge graph
      const math = await graphManager.createEntity(EntityType.CONCEPT, 'Math');
      const algebra = await graphManager.createEntity(
        EntityType.CONCEPT,
        'Algebra'
      );
      const calculus = await graphManager.createEntity(
        EntityType.CONCEPT,
        'Calculus'
      );
      const linearAlgebra = await graphManager.createEntity(
        EntityType.CONCEPT,
        'Linear Algebra'
      );

      await graphManager.createRelationship(
        math.id,
        algebra.id,
        RelationshipType.PART_OF
      );
      await graphManager.createRelationship(
        algebra.id,
        calculus.id,
        RelationshipType.PREREQUISITE_OF
      );
      await graphManager.createRelationship(
        algebra.id,
        linearAlgebra.id,
        RelationshipType.PREREQUISITE_OF
      );
    });

    describe('traverse', () => {
      it('should traverse the graph', async () => {
        const entities = await graphManager.findEntities(
          EntityType.CONCEPT,
          'Math'
        );
        const math = entities[0];

        const result = await graphManager.traverse(math.id, { maxDepth: 2 });

        expect(result.entities.length).toBeGreaterThan(0);
        expect(result.relationships.length).toBeGreaterThan(0);
      });

      it('should respect max depth', async () => {
        const entities = await graphManager.findEntities(
          EntityType.CONCEPT,
          'Math'
        );
        const math = entities[0];

        const shallow = await graphManager.traverse(math.id, { maxDepth: 1 });
        const deep = await graphManager.traverse(math.id, { maxDepth: 3 });

        expect(deep.entities.length).toBeGreaterThanOrEqual(
          shallow.entities.length
        );
      });
    });

    describe('findPath', () => {
      it('should find path between entities', async () => {
        const mathEntities = await graphManager.findEntities(
          EntityType.CONCEPT,
          'Math'
        );
        const calculusEntities = await graphManager.findEntities(
          EntityType.CONCEPT,
          'Calculus'
        );

        const path = await graphManager.findPath(
          mathEntities[0].id,
          calculusEntities[0].id
        );

        expect(path).toBeDefined();
        expect(path!.nodes.length).toBeGreaterThan(1);
      });

      it('should return null if no path exists', async () => {
        const isolated = await graphManager.createEntity(
          EntityType.CONCEPT,
          'Isolated'
        );
        const mathEntities = await graphManager.findEntities(
          EntityType.CONCEPT,
          'Math'
        );

        const path = await graphManager.findPath(mathEntities[0].id, isolated.id);

        expect(path).toBeNull();
      });
    });

    describe('getNeighbors', () => {
      it('should get neighboring entities', async () => {
        const algebraEntities = await graphManager.findEntities(
          EntityType.CONCEPT,
          'Algebra'
        );

        const neighbors = await graphManager.getNeighbors(algebraEntities[0].id);

        expect(neighbors.length).toBeGreaterThan(0);
      });

      it('should limit neighbors', async () => {
        const algebraEntities = await graphManager.findEntities(
          EntityType.CONCEPT,
          'Algebra'
        );

        const neighbors = await graphManager.getNeighbors(algebraEntities[0].id, {
          limit: 1,
        });

        expect(neighbors).toHaveLength(1);
      });
    });
  });

  describe('Higher-Level Operations', () => {
    let basicMath: { id: string };
    let algebra: { id: string };
    let calculus: { id: string };

    beforeEach(async () => {
      basicMath = await graphManager.createEntity(
        EntityType.CONCEPT,
        'Basic Math'
      );
      algebra = await graphManager.createEntity(EntityType.CONCEPT, 'Algebra');
      calculus = await graphManager.createEntity(EntityType.CONCEPT, 'Calculus');

      await graphManager.createRelationship(
        basicMath.id,
        algebra.id,
        RelationshipType.PREREQUISITE_OF
      );
      await graphManager.createRelationship(
        algebra.id,
        calculus.id,
        RelationshipType.PREREQUISITE_OF
      );
    });

    describe('getPrerequisites', () => {
      it('should get prerequisites for a concept', async () => {
        const prereqs = await graphManager.getPrerequisites(calculus.id);

        expect(prereqs.length).toBeGreaterThan(0);
      });
    });

    describe('getDependents', () => {
      it('should get concepts that depend on this one', async () => {
        const dependents = await graphManager.getDependents(basicMath.id);

        expect(dependents.length).toBeGreaterThan(0);
      });
    });

    describe('getRelatedConcepts', () => {
      it('should get related concepts', async () => {
        // Create a related concept
        const stats = await graphManager.createEntity(
          EntityType.CONCEPT,
          'Statistics'
        );
        await graphManager.createRelationship(
          algebra.id,
          stats.id,
          RelationshipType.RELATED_TO
        );

        const related = await graphManager.getRelatedConcepts(algebra.id);

        expect(related.length).toBeGreaterThan(0);
      });
    });

    describe('getLearningPath', () => {
      it('should get learning path between concepts', async () => {
        const path = await graphManager.getLearningPath(
          basicMath.id,
          calculus.id
        );

        expect(path).toBeDefined();
        expect(path!.steps.length).toBeGreaterThan(1);
        expect(path!.estimatedDuration).toBeGreaterThan(0);
      });

      it('should return null if no path exists', async () => {
        const isolated = await graphManager.createEntity(
          EntityType.CONCEPT,
          'Isolated'
        );

        const path = await graphManager.getLearningPath(
          basicMath.id,
          isolated.id
        );

        expect(path).toBeNull();
      });
    });

    describe('buildConceptMap', () => {
      it('should build a concept map', async () => {
        const map = await graphManager.buildConceptMap(algebra.id, 2);

        expect(map.center.id).toBe(algebra.id);
        expect(map.entities.length).toBeGreaterThan(0);
        expect(map.clusters).toBeDefined();
      });
    });
  });
});

describe('InMemoryGraphStore', () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
  });

  it('should track entity count', async () => {
    await store.createEntity({
      type: EntityType.CONCEPT,
      name: 'Test',
      properties: {},
    });

    expect(store.getEntityCount()).toBe(1);
  });

  it('should track relationship count', async () => {
    const e1 = await store.createEntity({
      type: EntityType.CONCEPT,
      name: 'E1',
      properties: {},
    });
    const e2 = await store.createEntity({
      type: EntityType.CONCEPT,
      name: 'E2',
      properties: {},
    });

    await store.createRelationship({
      type: RelationshipType.RELATED_TO,
      sourceId: e1.id,
      targetId: e2.id,
      weight: 1,
      properties: {},
    });

    expect(store.getRelationshipCount()).toBe(1);
  });

  it('should clear all data', async () => {
    await store.createEntity({
      type: EntityType.CONCEPT,
      name: 'Test',
      properties: {},
    });

    store.clear();

    expect(store.getEntityCount()).toBe(0);
    expect(store.getRelationshipCount()).toBe(0);
  });
});
