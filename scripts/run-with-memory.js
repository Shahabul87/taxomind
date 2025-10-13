#!/usr/bin/env node

/**
 * Memory-optimized command runner for Next.js and TypeScript projects
 * Automatically sets appropriate memory limits based on the command being run
 */

const { spawn } = require('child_process');
const os = require('os');

// Get system memory in GB
const totalMemory = Math.floor(os.totalmem() / (1024 * 1024 * 1024));

// Calculate optimal memory allocation (75% of total, max 8GB)
const optimalMemory = Math.min(Math.floor(totalMemory * 0.75 * 1024), 8192);

// Memory configurations for different command types
const memoryConfigs = {
  build: 8192,
  typecheck: optimalMemory,
  lint: optimalMemory,
  test: optimalMemory,
  prisma: 4096,
  default: 4096,
};

// Parse command from arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node run-with-memory.js <command> [args...]');
  process.exit(1);
}

const command = args[0];
const commandArgs = args.slice(1);

// Determine memory allocation based on command
let memorySize = memoryConfigs.default;
for (const [key, value] of Object.entries(memoryConfigs)) {
  if (command.includes(key) || commandArgs.join(' ').includes(key)) {
    memorySize = value;
    break;
  }
}

// Set environment variables
const env = {
  ...process.env,
  NODE_OPTIONS: `--max-old-space-size=${memorySize} ${process.env.NODE_OPTIONS || ''}`.trim(),
};

console.log(`🚀 Running command with ${memorySize}MB memory allocation`);
console.log(`📊 System memory: ${totalMemory}GB total`);
console.log(`⚡ Command: ${command} ${commandArgs.join(' ')}`);
console.log('');

// Execute command with memory settings
const child = spawn(command, commandArgs, {
  env,
  stdio: 'inherit',
  shell: true,
});

// Handle process exit
child.on('error', (error) => {
  console.error(`❌ Error executing command: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Command failed with exit code ${code}`);
    
    // Provide helpful suggestions for memory errors
    if (code === 134 || code === 137) {
      console.error('\n💡 Suggestions for memory issues:');
      console.error('1. Clear Node.js cache: rm -rf node_modules/.cache');
      console.error('2. Increase memory allocation in scripts/run-with-memory.js');
      console.error('3. Close other applications to free up system memory');
      console.error('4. Run the command with explicit memory: NODE_OPTIONS="--max-old-space-size=10240" npm run <command>');
    }
  }
  process.exit(code || 0);
});