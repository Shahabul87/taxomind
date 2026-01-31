import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

export async function GET() {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const versions: Record<string, string | null> = {};

    // Check package versions from node_modules
    const packages = [
      'next-auth',
      '@auth/core',
      '@auth/prisma-adapter',
    ];

    for (const pkg of packages) {
      try {
        const pkgPath = join(process.cwd(), 'node_modules', pkg, 'package.json');
        if (existsSync(pkgPath)) {
          const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));
          versions[pkg] = pkgJson.version;
        } else {
          versions[pkg] = 'NOT_FOUND';
        }
      } catch {
        versions[pkg] = 'ERROR';
      }
    }

    // Check the main package.json for expected versions
    let expectedVersions: Record<string, string> = {};
    try {
      const mainPkgPath = join(process.cwd(), 'package.json');
      if (existsSync(mainPkgPath)) {
        const mainPkg = JSON.parse(readFileSync(mainPkgPath, 'utf-8'));
        expectedVersions = {
          'next-auth': mainPkg.dependencies?.['next-auth'] || 'NOT_SPECIFIED',
          '@auth/prisma-adapter': mainPkg.dependencies?.['@auth/prisma-adapter'] || 'NOT_SPECIFIED',
        };

        // Check pnpm overrides
        if (mainPkg.pnpm?.overrides?.['@auth/core']) {
          expectedVersions['@auth/core (override)'] = mainPkg.pnpm.overrides['@auth/core'];
        }
      }
    } catch {
      // Ignore
    }

    // Determine if there's a version mismatch
    const authCoreVersion = versions['@auth/core'];
    const isVersionMismatch = authCoreVersion !== '0.37.2';

    return NextResponse.json({
      status: 'Version Check',
      timestamp: new Date().toISOString(),
      deployed: {
        ...versions,
      },
      expected: expectedVersions,
      diagnosis: {
        isAuthCoreCorrect: authCoreVersion === '0.37.2',
        isNextAuthCorrect: versions['next-auth'] === '5.0.0-beta.25',
        isPrismaAdapterCorrect: versions['@auth/prisma-adapter'] === '2.7.0',
        hasVersionMismatch: isVersionMismatch,
        recommendation: isVersionMismatch
          ? 'Railway needs to rebuild with the new package versions. Try triggering a fresh deploy.'
          : 'All versions are correct. If issue persists, check Railway logs for actual error.',
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'Version Check Error',
      error: error instanceof Error ? error.message : 'Unknown',
    }, { status: 500 });
  }
}
