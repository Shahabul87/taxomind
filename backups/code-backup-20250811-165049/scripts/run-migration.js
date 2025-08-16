const { execSync } = require('child_process');
const path = require('path');

// Run the migration
console.log('Running migration to add views field to Post model...');

try {
  // Generate migration
  execSync('npx prisma migrate dev --name add_views_to_posts', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} 