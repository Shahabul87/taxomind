/**
 * Blog Performance Benchmark Script
 * Measures performance of blog page components and API endpoints
 */

import { performance } from 'perf_hooks';

interface BenchmarkResult {
  name: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  iterations: number;
  timestamp: string;
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  /**
   * Run a benchmark test
   */
  async run(
    name: string,
    fn: () => Promise<void> | void,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    const times: number[] = [];

    console.log(`\n🏃 Running benchmark: ${name}`);
    console.log(`   Iterations: ${iterations}`);

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`   Progress: ${i + 1}/${iterations}\r`);
      }
    }

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const result: BenchmarkResult = {
      name,
      averageTime: parseFloat(averageTime.toFixed(2)),
      minTime: parseFloat(minTime.toFixed(2)),
      maxTime: parseFloat(maxTime.toFixed(2)),
      iterations,
      timestamp: new Date().toISOString(),
    };

    this.results.push(result);

    console.log(`\n   ✅ Average: ${result.averageTime}ms`);
    console.log(`   📊 Min: ${result.minTime}ms | Max: ${result.maxTime}ms`);

    return result;
  }

  /**
   * Print summary of all benchmarks
   */
  printSummary(): void {
    console.log('\n' + '='.repeat(70));
    console.log('📊 BENCHMARK SUMMARY');
    console.log('='.repeat(70));

    this.results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}`);
      console.log(`   Average: ${result.averageTime}ms`);
      console.log(`   Range: ${result.minTime}ms - ${result.maxTime}ms`);
      console.log(`   Iterations: ${result.iterations}`);
    });

    console.log('\n' + '='.repeat(70));
  }

  /**
   * Export results to JSON
   */
  exportResults(filename: string = 'benchmark-results.json'): void {
    const fs = require('fs');
    const path = require('path');

    const filepath = path.join(process.cwd(), filename);
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));

    console.log(`\n💾 Results saved to: ${filepath}`);
  }
}

/**
 * Simulate filtering operation
 */
function simulateFilter(posts: any[], category: string): any[] {
  return posts.filter(post =>
    category === 'all' || post.category === category
  );
}

/**
 * Simulate search operation
 */
function simulateSearch(posts: any[], query: string): any[] {
  const lowerQuery = query.toLowerCase();
  return posts.filter(post =>
    post.title.toLowerCase().includes(lowerQuery) ||
    post.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Simulate sorting operation
 */
function simulateSort(posts: any[], sortBy: 'latest' | 'popular'): any[] {
  if (sortBy === 'popular') {
    return [...posts].sort((a, b) => b.views - a.views);
  }
  return [...posts].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Generate mock posts
 */
function generateMockPosts(count: number): any[] {
  const categories = ['Programming', 'Design', 'AI/ML', 'DevOps'];
  const posts = [];

  for (let i = 0; i < count; i++) {
    posts.push({
      id: `post-${i}`,
      title: `Test Post ${i}`,
      description: `This is a test post description ${i}`.repeat(10),
      category: categories[i % categories.length],
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      views: Math.floor(Math.random() * 10000),
      comments: { length: Math.floor(Math.random() * 50) },
    });
  }

  return posts;
}

/**
 * Main benchmark execution
 */
async function main() {
  const benchmark = new PerformanceBenchmark();

  console.log('🚀 Blog Performance Benchmark');
  console.log('Starting benchmarks...\n');

  // Generate test data
  const posts10 = generateMockPosts(10);
  const posts100 = generateMockPosts(100);
  const posts1000 = generateMockPosts(1000);

  // Benchmark 1: Filter with 100 posts
  await benchmark.run(
    'Filter 100 posts by category',
    () => simulateFilter(posts100, 'Programming'),
    1000
  );

  // Benchmark 2: Search with 100 posts
  await benchmark.run(
    'Search 100 posts',
    () => simulateSearch(posts100, 'test'),
    1000
  );

  // Benchmark 3: Sort with 100 posts
  await benchmark.run(
    'Sort 100 posts by popularity',
    () => simulateSort(posts100, 'popular'),
    1000
  );

  // Benchmark 4: Filter with 1000 posts
  await benchmark.run(
    'Filter 1000 posts by category',
    () => simulateFilter(posts1000, 'Programming'),
    500
  );

  // Benchmark 5: Search with 1000 posts
  await benchmark.run(
    'Search 1000 posts',
    () => simulateSearch(posts1000, 'test'),
    500
  );

  // Benchmark 6: Sort with 1000 posts
  await benchmark.run(
    'Sort 1000 posts by popularity',
    () => simulateSort(posts1000, 'popular'),
    500
  );

  // Benchmark 7: Combined operations (realistic scenario)
  await benchmark.run(
    'Filter + Search + Sort (100 posts)',
    () => {
      let result = simulateFilter(posts100, 'Programming');
      result = simulateSearch(result, 'test');
      result = simulateSort(result, 'popular');
      return result;
    },
    500
  );

  // Benchmark 8: Combined operations with large dataset
  await benchmark.run(
    'Filter + Search + Sort (1000 posts)',
    () => {
      let result = simulateFilter(posts1000, 'Programming');
      result = simulateSearch(result, 'test');
      result = simulateSort(result, 'popular');
      return result;
    },
    200
  );

  // Print summary
  benchmark.printSummary();

  // Export results
  benchmark.exportResults('benchmarks/blog-performance.json');

  console.log('\n✅ Benchmarks completed!\n');
}

// Run benchmarks
if (require.main === module) {
  main().catch(console.error);
}

export { PerformanceBenchmark, generateMockPosts };
