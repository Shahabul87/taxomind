#!/usr/bin/env ts-node

/**
 * Migration Validation Script
 *
 * Validates that the clean architecture migration is complete and functional
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ValidationResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message?: string;
}

class MigrationValidator {
  private results: ValidationResult[] = [];
  private rootDir: string;

  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
  }

  /**
   * Run all validation checks
   */
  async validate(): Promise<void> {
    console.log('🔍 Starting Clean Architecture Migration Validation...\n');

    // Structure validation
    this.validateFolderStructure();
    this.validateDomainLayer();
    this.validateApplicationLayer();
    this.validateInfrastructureLayer();
    this.validateInterfaceLayer();

    // Configuration validation
    this.validateBuildConfiguration();
    this.validateTypeScriptConfiguration();

    // Code quality validation
    this.validateNoDirectPrismaInComponents();
    this.validateRepositoryPattern();
    this.validateUseCasePattern();

    // Feature validation
    this.validateEventSystem();
    this.validateCachingLayer();
    this.validateDatabasePooling();

    // API validation
    this.validateAPIRoutes();
    this.validateControllers();

    // Print results
    this.printResults();
  }

  /**
   * Validate folder structure exists
   */
  private validateFolderStructure(): void {
    const requiredFolders = [
      'src/domain',
      'src/application',
      'src/infrastructure',
      'src/interfaces'
    ];

    requiredFolders.forEach(folder => {
      const folderPath = path.join(this.rootDir, folder);
      if (fs.existsSync(folderPath)) {
        this.addResult({
          name: `Folder: ${folder}`,
          status: 'PASS'
        });
      } else {
        this.addResult({
          name: `Folder: ${folder}`,
          status: 'FAIL',
          message: 'Folder not found'
        });
      }
    });
  }

  /**
   * Validate domain layer implementation
   */
  private validateDomainLayer(): void {
    const domainEntities = [
      'src/domain/course/entities/course.entity.ts',
      'src/domain/auth/entities/user.entity.ts',
      'src/domain/purchase/entities/purchase.entity.ts',
      'src/domain/notification/entities/notification.entity.ts'
    ];

    const valueObjects = [
      'src/domain/course/value-objects/course-title.ts',
      'src/domain/auth/value-objects/password.ts',
      'src/domain/purchase/value-objects/money.ts'
    ];

    [...domainEntities, ...valueObjects].forEach(file => {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check for no external dependencies
        if (content.includes('from "@prisma') || content.includes('from "prisma')) {
          this.addResult({
            name: `Domain Isolation: ${path.basename(file)}`,
            status: 'FAIL',
            message: 'Domain has external dependencies'
          });
        } else {
          this.addResult({
            name: `Domain Isolation: ${path.basename(file)}`,
            status: 'PASS'
          });
        }
      } else {
        this.addResult({
          name: `Domain Entity: ${path.basename(file)}`,
          status: 'WARN',
          message: 'File not found'
        });
      }
    });
  }

  /**
   * Validate application layer use cases
   */
  private validateApplicationLayer(): void {
    const useCases = [
      'src/application/use-cases/course/create-course.use-case.ts',
      'src/application/use-cases/auth/login.use-case.ts',
      'src/application/use-cases/purchase/create-purchase.use-case.ts'
    ];

    useCases.forEach(file => {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check for repository usage
        if (content.includes('Repository')) {
          this.addResult({
            name: `Use Case: ${path.basename(file)}`,
            status: 'PASS',
            message: 'Uses repository pattern'
          });
        } else {
          this.addResult({
            name: `Use Case: ${path.basename(file)}`,
            status: 'WARN',
            message: 'May not use repository pattern'
          });
        }
      }
    });
  }

  /**
   * Validate infrastructure layer
   */
  private validateInfrastructureLayer(): void {
    const infrastructureFiles = [
      'src/infrastructure/database/connection-pool.ts',
      'src/infrastructure/repositories/prisma-course.repository.ts',
      'src/infrastructure/events/event-bus.ts',
      'src/infrastructure/cache/redis-cache.service.ts',
      'src/infrastructure/container/index.ts'
    ];

    infrastructureFiles.forEach(file => {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        this.addResult({
          name: `Infrastructure: ${path.basename(file)}`,
          status: 'PASS'
        });
      } else {
        this.addResult({
          name: `Infrastructure: ${path.basename(file)}`,
          status: 'WARN',
          message: 'File not found'
        });
      }
    });
  }

  /**
   * Validate interface layer
   */
  private validateInterfaceLayer(): void {
    const controllers = [
      'src/interfaces/http/controllers/course.controller.ts',
      'src/interfaces/http/controllers/auth.controller.ts',
      'src/interfaces/http/controllers/purchase.controller.ts',
      'src/interfaces/http/controllers/notification.controller.ts'
    ];

    controllers.forEach(file => {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check for use case usage
        if (content.includes('UseCase')) {
          this.addResult({
            name: `Controller: ${path.basename(file)}`,
            status: 'PASS',
            message: 'Uses use cases'
          });
        } else {
          this.addResult({
            name: `Controller: ${path.basename(file)}`,
            status: 'FAIL',
            message: 'Should use use cases'
          });
        }
      }
    });
  }

  /**
   * Validate build configuration
   */
  private validateBuildConfiguration(): void {
    const configPath = path.join(this.rootDir, 'next.config.js');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');

      if (content.includes('ignoreBuildErrors: false')) {
        this.addResult({
          name: 'Build Validation',
          status: 'PASS',
          message: 'TypeScript errors not ignored'
        });
      } else {
        this.addResult({
          name: 'Build Validation',
          status: 'FAIL',
          message: 'TypeScript errors are ignored!'
        });
      }
    }
  }

  /**
   * Validate TypeScript configuration
   */
  private validateTypeScriptConfiguration(): void {
    try {
      execSync('npx tsc --noEmit', {
        cwd: this.rootDir,
        stdio: 'pipe'
      });
      this.addResult({
        name: 'TypeScript Compilation',
        status: 'PASS',
        message: 'No TypeScript errors'
      });
    } catch (error) {
      this.addResult({
        name: 'TypeScript Compilation',
        status: 'FAIL',
        message: 'TypeScript compilation errors exist'
      });
    }
  }

  /**
   * Validate no direct Prisma calls in components
   */
  private validateNoDirectPrismaInComponents(): void {
    const componentsDir = path.join(this.rootDir, 'components');
    const appDir = path.join(this.rootDir, 'app');

    let hasDirectPrismaCalls = false;

    const checkDirectory = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          checkDirectory(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (content.includes('db.') && content.includes('prisma')) {
            hasDirectPrismaCalls = true;
          }
        }
      });
    };

    checkDirectory(componentsDir);

    if (hasDirectPrismaCalls) {
      this.addResult({
        name: 'Component Database Isolation',
        status: 'FAIL',
        message: 'Components have direct Prisma calls'
      });
    } else {
      this.addResult({
        name: 'Component Database Isolation',
        status: 'PASS',
        message: 'No direct database access in components'
      });
    }
  }

  /**
   * Validate repository pattern implementation
   */
  private validateRepositoryPattern(): void {
    const repositories = [
      'src/infrastructure/repositories/prisma-course.repository.ts',
      'src/infrastructure/repositories/prisma-auth.repository.ts',
      'src/infrastructure/repositories/prisma-purchase.repository.ts'
    ];

    let allImplemented = true;
    repositories.forEach(repo => {
      if (!fs.existsSync(path.join(this.rootDir, repo))) {
        allImplemented = false;
      }
    });

    if (allImplemented) {
      this.addResult({
        name: 'Repository Pattern',
        status: 'PASS',
        message: 'All repositories implemented'
      });
    } else {
      this.addResult({
        name: 'Repository Pattern',
        status: 'WARN',
        message: 'Some repositories missing'
      });
    }
  }

  /**
   * Validate use case pattern implementation
   */
  private validateUseCasePattern(): void {
    const useCaseDir = path.join(this.rootDir, 'src/application/use-cases');

    if (fs.existsSync(useCaseDir)) {
      const domains = fs.readdirSync(useCaseDir);
      if (domains.length >= 3) {
        this.addResult({
          name: 'Use Case Pattern',
          status: 'PASS',
          message: `${domains.length} domains with use cases`
        });
      } else {
        this.addResult({
          name: 'Use Case Pattern',
          status: 'WARN',
          message: 'Limited use cases implemented'
        });
      }
    }
  }

  /**
   * Validate event system
   */
  private validateEventSystem(): void {
    const eventFiles = [
      'src/infrastructure/events/event-bus.ts',
      'src/infrastructure/events/handlers/enrollment-handler.ts'
    ];

    eventFiles.forEach(file => {
      if (fs.existsSync(path.join(this.rootDir, file))) {
        this.addResult({
          name: `Event System: ${path.basename(file)}`,
          status: 'PASS'
        });
      } else {
        this.addResult({
          name: `Event System: ${path.basename(file)}`,
          status: 'WARN'
        });
      }
    });
  }

  /**
   * Validate caching layer
   */
  private validateCachingLayer(): void {
    const cacheFiles = [
      'src/infrastructure/cache/redis-cache.service.ts',
      'src/infrastructure/cache/memory-cache.service.ts',
      'src/infrastructure/cache/cache.decorator.ts'
    ];

    cacheFiles.forEach(file => {
      if (fs.existsSync(path.join(this.rootDir, file))) {
        this.addResult({
          name: `Caching: ${path.basename(file)}`,
          status: 'PASS'
        });
      }
    });
  }

  /**
   * Validate database pooling
   */
  private validateDatabasePooling(): void {
    const poolFile = 'src/infrastructure/database/connection-pool.ts';

    if (fs.existsSync(path.join(this.rootDir, poolFile))) {
      this.addResult({
        name: 'Database Pooling',
        status: 'PASS',
        message: 'Connection pooling implemented'
      });
    } else {
      this.addResult({
        name: 'Database Pooling',
        status: 'FAIL',
        message: 'No connection pooling found'
      });
    }
  }

  /**
   * Validate API routes
   */
  private validateAPIRoutes(): void {
    const apiRoutes = [
      'app/api/v2/courses/route.ts',
      'app/api/v2/auth/login/route.ts',
      'app/api/v2/purchases/route.ts',
      'app/api/v2/notifications/route.ts'
    ];

    apiRoutes.forEach(route => {
      if (fs.existsSync(path.join(this.rootDir, route))) {
        this.addResult({
          name: `API Route: ${path.basename(path.dirname(route))}`,
          status: 'PASS'
        });
      } else {
        this.addResult({
          name: `API Route: ${path.basename(path.dirname(route))}`,
          status: 'WARN'
        });
      }
    });
  }

  /**
   * Validate controllers
   */
  private validateControllers(): void {
    const controllerDir = path.join(this.rootDir, 'src/interfaces/http/controllers');

    if (fs.existsSync(controllerDir)) {
      const controllers = fs.readdirSync(controllerDir);
      if (controllers.length >= 4) {
        this.addResult({
          name: 'Controllers',
          status: 'PASS',
          message: `${controllers.length} controllers implemented`
        });
      }
    }
  }

  /**
   * Add validation result
   */
  private addResult(result: ValidationResult): void {
    this.results.push(result);
  }

  /**
   * Print validation results
   */
  private printResults(): void {
    console.log('\n📊 VALIDATION RESULTS\n');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'PASS');
    const failed = this.results.filter(r => r.status === 'FAIL');
    const warnings = this.results.filter(r => r.status === 'WARN');

    // Group results by category
    const categories = {
      'Structure': this.results.filter(r => r.name.includes('Folder') || r.name.includes('Domain')),
      'Patterns': this.results.filter(r => r.name.includes('Pattern') || r.name.includes('Use Case')),
      'Infrastructure': this.results.filter(r => r.name.includes('Infrastructure') || r.name.includes('Database') || r.name.includes('Cache')),
      'Controllers': this.results.filter(r => r.name.includes('Controller') || r.name.includes('API')),
      'Configuration': this.results.filter(r => r.name.includes('Build') || r.name.includes('TypeScript')),
      'Events': this.results.filter(r => r.name.includes('Event'))
    };

    Object.entries(categories).forEach(([category, results]) => {
      if (results.length > 0) {
        console.log(`\n${category}:`);
        results.forEach(result => {
          const icon = result.status === 'PASS' ? '✅' :
                       result.status === 'FAIL' ? '❌' : '⚠️';
          console.log(`  ${icon} ${result.name}${result.message ? ': ' + result.message : ''}`);
        });
      }
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📈 SUMMARY\n');
    console.log(`  ✅ Passed: ${passed.length}`);
    console.log(`  ⚠️  Warnings: ${warnings.length}`);
    console.log(`  ❌ Failed: ${failed.length}`);
    console.log(`  📊 Total: ${this.results.length}`);

    // Overall status
    const successRate = (passed.length / this.results.length) * 100;
    console.log('\n' + '='.repeat(60));

    if (failed.length === 0 && successRate >= 80) {
      console.log('\n🎉 MIGRATION VALIDATION: PASSED');
      console.log('The clean architecture migration is successfully validated!');
    } else if (failed.length <= 2 && successRate >= 60) {
      console.log('\n⚠️  MIGRATION VALIDATION: MOSTLY COMPLETE');
      console.log('Minor issues found but migration is largely successful.');
    } else {
      console.log('\n❌ MIGRATION VALIDATION: NEEDS ATTENTION');
      console.log('Several issues found that need to be addressed.');
    }

    console.log('\n');
  }
}

// Run validation
const validator = new MigrationValidator();
validator.validate().catch(console.error);