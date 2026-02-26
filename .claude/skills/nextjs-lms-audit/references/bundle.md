# 📦 Bundle & Build Optimization Reference

## What to Check

### 1. Bundle Size Analysis
```bash
# Check if bundle analyzer is configured
grep -n "ANALYZE\|bundle-analyzer\|withBundleAnalyzer" next.config.* 2>/dev/null

# Check current build output size (if .next exists)
if [ -d ".next" ]; then
  du -sh .next/
  find .next/static/chunks -name "*.js" -exec ls -lh {} \; | sort -k5 -rh | head -20
fi

# Check for the build analysis script
cat scripts/bundle-size-tracker.js 2>/dev/null | head -20
```

### 2. Heavy Dependencies Detection
```bash
# Identify heaviest packages (approximate sizes)
# These are known-heavy packages — check if they're used and if lighter alternatives exist
for pkg in "lodash" "moment" "monaco-editor" "@tiptap" "firebase-admin" "puppeteer" "googleapis" "chart.js" "recharts" "reactflow" "three" "pdf" "cheerio"; do
  count=$(grep -r "from ['\"]${pkg}" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
  if [ "$count" -gt 0 ]; then
    echo "$pkg: imported in $count files"
  fi
done

# Check for full lodash import vs specific imports
grep -rn "import.*lodash\|require.*lodash" app/ lib/ components/ --include="*.ts" --include="*.tsx" | head -10
# BAD: import _ from 'lodash'
# GOOD: import debounce from 'lodash/debounce'
```

### 3. Dynamic Import Opportunities
```bash
# Find heavy components that should be dynamically imported
# Monaco Editor - MUST be dynamic (no SSR)
grep -rn "monaco-editor\|@monaco-editor" app/ components/ --include="*.tsx" | grep -v "dynamic\|lazy" | head -5

# TipTap Editor - should be dynamic on pages where it's not always visible
grep -rn "@tiptap" app/ components/ --include="*.tsx" -l | head -10

# Chart libraries - should be dynamic
grep -rn "recharts\|chart.js\|react-chartjs" app/ components/ --include="*.tsx" | grep -v "dynamic\|lazy" | head -10

# ReactFlow - should be dynamic
grep -rn "reactflow" app/ components/ --include="*.tsx" | grep -v "dynamic\|lazy" | head -5

# Check existing dynamic imports
grep -rn "next/dynamic\|React.lazy\|dynamic(" app/ components/ --include="*.tsx" | head -20
```

**Critical dynamic import candidates for this stack:**
- `monaco-editor` → MUST be `dynamic(() => import(...), { ssr: false })`
- `react-quill-new` → MUST be `{ ssr: false }`
- `reactflow` → Should be dynamic
- `recharts` / `chart.js` → Should be dynamic on non-dashboard pages
- `react-confetti` / `canvas-confetti` → Should be dynamic
- `html2canvas` + `jspdf` → Should be dynamic (PDF export)
- `@tiptap/*` → Should be dynamic when not primary page content
- `react-youtube` → Should be dynamic
- `socket.io-client` → Should be dynamic or lazy-connected
- `katex` / `react-katex` → Should be dynamic unless math-heavy page
- `react-syntax-highlighter` → Should be dynamic

### 4. Barrel File Anti-Pattern
```bash
# Find barrel files (index.ts that re-export everything)
find app/ components/ lib/ -name "index.ts" -o -name "index.tsx" | xargs grep -l "export \* from\|export {" 2>/dev/null | head -10

# Check if barrel files export unused items
# Look for large re-export files
find components/ -name "index.ts" -exec wc -l {} \; | sort -rn | head -10
```

**Bad:** `components/ui/index.ts` re-exports 40+ components, but most pages use 3-4
**Good:** Direct imports like `import { Button } from '@/components/ui/button'`

### 5. Duplicate Dependencies
```bash
# Check for duplicate packages in node_modules
npm ls --all 2>/dev/null | grep -i "deduped" | wc -l
npm ls --all 2>/dev/null | grep "UNMET\|invalid" | head -10

# Check for React version mismatches (critical!)
npm ls react 2>/dev/null | head -10

# Check for multiple versions of common packages
for pkg in "react" "react-dom" "zod" "framer-motion" "next-auth"; do
  echo "=== $pkg ==="
  npm ls "$pkg" 2>/dev/null | grep "$pkg@" | sort -u
done
```

### 6. Tree-Shaking Verification
```bash
# Check for CommonJS imports that break tree-shaking
grep -rn "require(" app/ components/ lib/ --include="*.ts" --include="*.tsx" | grep -v "node_modules\|.test.\|.spec.\|scripts/" | head -10

# Check next.config for transpilePackages (needed for some CJS packages)
grep -n "transpilePackages\|serverExternalPackages" next.config.* 2>/dev/null
```

### 7. CSS Optimization
```bash
# Check Tailwind config for content purging
cat tailwind.config.* 2>/dev/null | head -30

# Check for unused CSS files
find app/ components/ -name "*.css" -exec wc -l {} \; | sort -rn | head -10

# Check for CSS-in-JS (adds to bundle)
grep -rn "styled-components\|@emotion\|styled(" app/ components/ --include="*.tsx" | head -5

# Check for duplicate Tailwind classes
grep -rn "className=" app/ components/ --include="*.tsx" | grep -oP 'className="[^"]{200,}"' | head -5
```

### 8. Build Configuration Review
```bash
# Review next.config
cat next.config.mjs 2>/dev/null || cat next.config.js 2>/dev/null || cat next.config.ts 2>/dev/null

# Key things to look for:
# - experimental.optimizePackageImports (should include heavy packages)
# - images.remotePatterns (should be restrictive, not *)
# - webpack config (custom overrides that might break optimization)
# - output: 'standalone' for Docker deployments
# - compiler options (removeConsole in production)
```

### 9. Monorepo Package Sizes
```bash
# Check SAM AI workspace package sizes
if [ -d "packages" ]; then
  for dir in packages/*/; do
    if [ -f "$dir/package.json" ]; then
      name=$(node -pe "require('./$dir/package.json').name" 2>/dev/null)
      size=$(du -sh "$dir/dist" 2>/dev/null | cut -f1)
      echo "$name: $size"
    fi
  done
fi
```

## Key Optimizations for This Stack

### Must-Have `optimizePackageImports`
```js
// next.config.mjs
experimental: {
  optimizePackageImports: [
    'lucide-react',
    '@radix-ui/react-icons',
    '@tabler/icons-react',
    'lodash',
    'date-fns',
    'recharts',
    'react-syntax-highlighter',
    'framer-motion',
    '@tiptap/react',
    '@tiptap/starter-kit',
  ]
}
```

### Must-Have Dynamic Imports
```tsx
// Monaco Editor
const CodeEditor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => <EditorSkeleton />
});

// Rich Text Editor
const RichEditor = dynamic(() => import('./rich-editor'), { 
  ssr: false,
  loading: () => <EditorSkeleton />
});

// PDF Export
const PDFExport = dynamic(() => import('./pdf-export'), {
  ssr: false
});
```

## Scoring

| Check | Weight | Score Criteria |
|-------|--------|---------------|
| First Load JS | 20% | <150kB shared = full, <250kB = half |
| Dynamic Imports | 20% | All heavy libs dynamically imported |
| No Duplicates | 15% | 0 duplicate React/core packages |
| Tree-Shaking | 15% | No CJS imports in app code |
| CSS Optimization | 10% | Tailwind purge configured, no unused CSS |
| optimizePackageImports | 10% | All icon/UI libs listed |
| Build Config | 10% | Production optimizations enabled |
