# Clear Browser Cache - Fix Hydration Error

## The Problem
Your browser has cached the old version of the app with `<div>` tags, but the server is now rendering with `<main>` tags. This causes a hydration mismatch.

## Solution: Clear Service Worker & Cache

### Option 1: Clear via Browser DevTools (RECOMMENDED)
1. Open your browser at `http://localhost:3000`
2. Open DevTools (`F12` or `Cmd/Ctrl + Shift + I`)
3. Go to the **Application** tab
4. In the left sidebar:
   - Click **Storage**
   - Check all boxes:
     - ✅ Unregister service workers
     - ✅ Local and session storage
     - ✅ IndexedDB
     - ✅ Web SQL
     - ✅ Cookies
     - ✅ Cache storage
   - Click **"Clear site data"** button
5. Close DevTools
6. **Hard refresh**: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)

### Option 2: Manually Unregister Service Worker
1. Open DevTools → **Application** tab
2. Click **Service Workers** in left sidebar
3. If you see any registered workers, click **"Unregister"**
4. Go to **Cache Storage** and delete all caches
5. Hard refresh

### Option 3: Open in Incognito/Private Mode
1. Open a new Incognito/Private window
2. Navigate to `http://localhost:3000`
3. This will bypass all caches

### Option 4: Different Browser
Try opening the app in a different browser (Chrome, Firefox, Safari, Edge)

### Option 5: Clear DNS Cache (Nuclear Option)
**Mac:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Windows:**
```bash
ipconfig /flushdns
```

**Linux:**
```bash
sudo systemctl restart systemd-resolved
```

---

## Verify It's Fixed

After clearing cache, you should see:
- ✅ No hydration errors in console
- ✅ Page loads without warnings
- ✅ Discussion forum visible at bottom of section page

---

## Why This Happened

Service workers aggressively cache HTML to enable offline functionality. When we changed the layout from `<div>` to `<main>`, the service worker was still serving the old cached version, causing a mismatch between server and client rendering.

## Prevention

Service workers are disabled in development mode, so this won't happen during development. In production, the service worker automatically updates when you deploy a new version.
