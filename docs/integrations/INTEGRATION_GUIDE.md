# New Landing Page Integration Guide

## Current Status

✅ **Old Landing Page**: `/courses` (intact, fully functional)
✅ **New Landing Page**: `/courses/new` (ready for production)

---

## RECOMMENDED: Option 1 - Replace Old Page

### Quick Integration (5 minutes):

```bash
# 1. Backup old files
cp app/courses/page.tsx app/courses/page.backup.tsx
cp -r app/courses/_components app/courses/_components.backup

# 2. Replace with new design
cp app/courses/new/page.tsx app/courses/page.tsx
rm -rf app/courses/_components
cp -r app/courses/new/_components app/courses/_components

# 3. Test
npm run dev
# Visit http://localhost:3000/courses

# 4. Clean up (optional, after testing)
# rm -rf app/courses/new
```

**Result**: `/courses` now shows the new enterprise design ✨

---

## Option 2: Keep Both + Add Toggle

Add this to your navbar (`components/layout/CoursesNavbarResizable.tsx`):

```tsx
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

// Inside navbar component
const pathname = usePathname();

<Link href={pathname === "/courses" ? "/courses/new" : "/courses"}>
  <Button variant="outline" size="sm" className="gap-2">
    <Sparkles className="w-4 h-4" />
    {pathname === "/courses" ? "New Design" : "Classic"}
  </Button>
</Link>
```

---

## Option 3: Simple Redirect

Replace `app/courses/page.tsx` with:

```tsx
import { redirect } from 'next/navigation';

export default function CoursesPage() {
  redirect('/courses/new');
}
```

---

## Testing Checklist

- ✅ All sections render
- ✅ Course cards work
- ✅ Search functions
- ✅ Mobile responsive
- ✅ No console errors

---

## Rollback (if needed)

```bash
cp app/courses/page.backup.tsx app/courses/page.tsx
cp -r app/courses/_components.backup app/courses/_components
```

---

**Recommendation**: Use Option 1 - the new design is production-ready and superior! 🚀
