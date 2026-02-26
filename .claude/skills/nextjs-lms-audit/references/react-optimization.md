# ⚛️ React Optimization Audit Reference

## What to Check

### 1. Client vs Server Component Boundary
```bash
# Map the 'use client' boundary
echo "=== Client Component Distribution ==="
grep -rl "'use client'" app/ components/ --include="*.tsx" 2>/dev/null | while read f; do
  dir=$(dirname "$f" | sed 's|app/||' | cut -d'/' -f1-2)
  echo "$dir"
done | sort | uniq -c | sort -rn | head -20

# Find client components that don't use client-only features
# These are candidates for conversion to server components
for f in $(grep -rl "'use client'" app/ components/ --include="*.tsx" 2>/dev/null); do
  has_hooks=$(grep -c "useState\|useEffect\|useRef\|useCallback\|useMemo\|useContext\|onClick\|onChange\|onSubmit" "$f")
  if [ "$has_hooks" -eq 0 ]; then
    echo "CANDIDATE FOR SERVER COMPONENT: $f"
  fi
done

# Find server components accidentally importing client-only code
grep -rn "import.*from.*zustand\|import.*from.*framer-motion\|import.*from.*react-hot-toast" app/ --include="*.tsx" | grep -v "'use client'" | head -10
```

**Anti-patterns:**
- `'use client'` at layout level (makes entire subtree client)
- Client component wrapping server components unnecessarily
- Data fetching in client components when server would work

### 2. Unnecessary Re-renders
```bash
# Find components passing new object/array literals as props
grep -rn "={{" app/ components/ --include="*.tsx" | grep -v "style={{" | head -20
# e.g., <Child data={{ key: value }} /> creates new object every render

# Find inline function props (create new function reference each render)
grep -rn "onClick={() =>\|onChange={() =>\|onSubmit={() =>" app/ components/ --include="*.tsx" | head -20
# Not always bad, but in lists/frequent re-renderers it matters

# Find components in lists without proper memoization
grep -rn "\.map(" app/ components/ --include="*.tsx" -A 3 | grep -B 1 "=>" | head -20

# Check for key anti-patterns in lists
grep -rn "key={index}\|key={i}\|key={Math.random" app/ components/ --include="*.tsx" | head -10
```

### 3. Memoization Audit
```bash
# Check React.memo usage
grep -rn "React.memo\|memo(" app/ components/ --include="*.tsx" | head -15

# Check useMemo usage
grep -rn "useMemo(" app/ components/ --include="*.tsx" | head -15

# Check useCallback usage
grep -rn "useCallback(" app/ components/ --include="*.tsx" | head -15

# Find OVER-memoization (useMemo for trivial computations)
grep -rn "useMemo(" app/ components/ --include="*.tsx" -A 2 | grep "return\|=>" | head -10
# If the computation is a simple string concatenation or boolean, useMemo adds overhead

# Find components that SHOULD be memoized (rendered in lists, receive stable props)
grep -rn "\.map(" app/ components/ --include="*.tsx" -B 5 | grep "Component\|Card\|Item\|Row" | head -10
```

**When to memoize:**
- ✅ Components in lists with 20+ items
- ✅ Components receiving stable primitive props
- ✅ Expensive computations (filtering/sorting large arrays)
- ❌ Components with frequently changing props
- ❌ Trivial computations (string concat, boolean checks)
- ❌ Components that always re-render anyway (their parent always changes)

### 4. State Management (Zustand)
```bash
# Find Zustand stores
find . -path "*/store*" -name "*.ts" -o -path "*/stores*" -name "*.ts" | grep -v node_modules | head -20
grep -rn "create(" app/ lib/ store/ stores/ --include="*.ts" | grep "zustand\|import.*create" | head -10

# Check for selector patterns (prevent unnecessary re-renders)
grep -rn "useStore\|use.*Store" app/ components/ --include="*.tsx" | head -20
# BAD: const { user, theme, notifications } = useStore()
# GOOD: const user = useStore(state => state.user)

# Check store size (large stores should be split)
find . -path "*/store*" -name "*.ts" | grep -v node_modules | xargs wc -l 2>/dev/null | sort -rn | head -10
```

### 5. Context Provider Placement
```bash
# Find context providers
grep -rn "createContext\|Provider value=" app/ components/ --include="*.tsx" | head -15

# Check if providers are at the root level (could cause full-tree re-renders)
grep -rn "Provider" app/layout.tsx 2>/dev/null || grep -rn "Provider" app/providers.tsx 2>/dev/null

# Find deeply nested providers
cat app/layout.tsx 2>/dev/null | grep -c "Provider"
# More than 5 nested providers in root layout is a smell
```

**Best practices:**
- Push providers down to the lowest necessary subtree
- Split large contexts into focused ones
- Use Zustand instead of Context for frequently updated state

### 6. Effect Cleanup & Dependencies
```bash
# Find useEffect without cleanup (potential memory leaks)
grep -rn "useEffect(" app/ components/ --include="*.tsx" -A 10 | grep -B 5 "^\-\-$\|}, \[" | head -30

# Find useEffect with missing dependencies (stale closures)
# This is hard to detect statically, but we can find effects that reference state
grep -rn "useEffect(" app/ components/ --include="*.tsx" -A 5 | grep "useState\|useRef" | head -10

# Find effects that should be event handlers instead
grep -rn "useEffect(" app/ components/ --include="*.tsx" -A 3 | grep "fetch\|axios\|submit\|save" | head -10

# Find effects with empty deps that reference external values
grep -rn "}, \[\])" app/ components/ --include="*.tsx" | head -20
```

### 7. Component Composition Patterns
```bash
# Find very large component files (should be split)
find app/ components/ -name "*.tsx" -exec wc -l {} \; | sort -rn | head -20

# Find components with too many props (>8 props = needs refactoring)
grep -rn "interface.*Props\|type.*Props" app/ components/ --include="*.tsx" -A 20 | grep -c ":" | head -10

# Find prop drilling (passing the same prop through 3+ levels)
for prop in "userId" "courseId" "chapterId" "sessionId"; do
  count=$(grep -rn "$prop" app/ components/ --include="*.tsx" | wc -l)
  if [ "$count" -gt 10 ]; then
    echo "POTENTIAL PROP DRILLING: $prop appears in $count files"
  fi
done
```

### 8. Hydration Safety
```bash
# Find hydration mismatch risks
# Date/time rendering (differs between server and client)
grep -rn "new Date()\|Date.now()\|toLocaleDateString\|toLocaleString" app/ components/ --include="*.tsx" | grep -v "'use client'" | head -10

# Window/document access outside useEffect
grep -rn "window\.\|document\.\|navigator\.\|localStorage\|sessionStorage" app/ components/ --include="*.tsx" | grep -v "useEffect\|typeof window\|typeof document" | head -10

# Math.random in render
grep -rn "Math.random()" app/ components/ --include="*.tsx" | grep -v "useEffect\|useState\|useMemo" | head -5
```

### 9. Image & Media Components
```bash
# Check for lazy loading on images below the fold
grep -rn "Image\b" app/ components/ --include="*.tsx" | grep -v "priority\|loading=" | head -10

# Check for priority on above-the-fold images
grep -rn "priority" app/ components/ --include="*.tsx" | head -10

# Find large image dimensions without responsive sizing
grep -rn "width={1920}\|width={1280}\|height={1080}" app/ components/ --include="*.tsx" | head -5
```

### 10. Form Optimization
```bash
# Check react-hook-form usage patterns
grep -rn "useForm\|register\|handleSubmit\|Controller" app/ components/ --include="*.tsx" | head -15

# Find uncontrolled vs controlled inputs
grep -rn "useState.*input\|onChange.*setState\|value={.*State" app/ components/ --include="*.tsx" | head -10

# Check for form libraries (should use react-hook-form, not controlled state for large forms)
grep -rn "<form" app/ components/ --include="*.tsx" | head -10
```

## Quick Fix Templates

### Convert Unnecessary Client Component to Server Component
```tsx
// BEFORE (client component with no client features)
'use client'
import { db } from '@/lib/db'

export default function CourseList() {
  // This can be a server component!
}

// AFTER (server component)
import { db } from '@/lib/db'

export default async function CourseList() {
  const courses = await db.course.findMany()
  return <div>{/* render courses */}</div>
}
```

### Proper Zustand Selector
```tsx
// BEFORE (re-renders on ANY store change)
const { user } = useAuthStore()

// AFTER (re-renders only when user changes)
const user = useAuthStore((state) => state.user)
```

### List Component Memoization
```tsx
// BEFORE
function CourseCard({ course }) { /* ... */ }

// AFTER
const CourseCard = memo(function CourseCard({ course }) { /* ... */ })
```

## Scoring

| Check | Weight | Score Criteria |
|-------|--------|---------------|
| RSC Boundary | 20% | No unnecessary 'use client', data fetching in server |
| Re-render Prevention | 20% | No inline objects/functions in hot paths |
| Memoization | 15% | Appropriate (not over/under) memoization |
| State Management | 15% | Zustand selectors used, no prop drilling |
| Effect Safety | 10% | All effects have cleanup, correct deps |
| Hydration | 10% | No mismatch risks |
| Component Size | 10% | No file >500 lines, props <8 per component |
