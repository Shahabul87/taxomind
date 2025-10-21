# SAM Assistant Initial Position Fix

Status: Fixed

Summary
- Prevent the redesigned global assistant window from opening off-screen.
- Add dynamic sizing and clamped positioning for all viewport sizes.
- Use mobile/tablet-specific UI (Drawer/Sheet) and keep floating window for desktop only.

Problem
- On some screens, `<SAMGlobalAssistantRedesigned />` opened partially or fully outside the viewport.
- The component assumed a fixed size (450×650) while Tailwind min constraints and small viewports caused overflow.

Root Cause
- Hard-coded dimensions were used for initial placement and bounds checks (450×650), while the UI enforced minimum size through CSS classes. On small viewports, this mismatch pushed the window beyond screen bounds.
- The component always rendered on all screen sizes instead of delegating to the responsive mobile/tablet components.

Fix Overview
1) Compute dynamic size based on the current viewport with margins.
2) Use the computed size for initial placement and all clamping (drag/resize).
3) Remove rigid Tailwind min-size enforcement in favor of inline width/height from state.
4) Gate the floating assistant to desktop only; use the existing mobile/tablet responsive component otherwise.

Key Changes (with references)
- Dynamic size calculation and safe initial placement
  - `computeSamSize()` computes width/height to fit within `(viewport - 2×margin)`
    - sam-ai-tutor/components/global/sam-global-assistant-redesigned.tsx:168
  - `calculateInitialPosition()` uses computed size for bottom-right placement inside bounds
    - sam-ai-tutor/components/global/sam-global-assistant-redesigned.tsx:184
  - `handleOpenSAM()` sets size first, then position, then opens
    - sam-ai-tutor/components/global/sam-global-assistant-redesigned.tsx:203

- Clamp position on open, resize, and drag using dynamic size
  - Open/bounds enforcement effect
    - sam-ai-tutor/components/global/sam-global-assistant-redesigned.tsx:213
  - Resize listener recomputes size and clamps position
    - sam-ai-tutor/components/global/sam-global-assistant-redesigned.tsx:236
  - Drag move handler clamps to viewport using dynamic size
    - sam-ai-tutor/components/global/sam-global-assistant-redesigned.tsx:527

- Inline size instead of rigid Tailwind dimensions
  - Set `style.width`/`style.height` from `samSize`
    - sam-ai-tutor/components/global/sam-global-assistant-redesigned.tsx:849

- Device-specific rendering split
  - Desktop-only gate for floating window
    - sam-ai-tutor/components/global/sam-global-assistant-redesigned.tsx:144
  - Add mobile/tablet responsive component to global layout
    - app/layout.tsx:21
    - app/layout.tsx:224

Behavior After Fix
- Desktop (≥1024px): Opens bottom-right fully on-screen with 20px margin. Dragging remains within viewport. Resizing keeps it clamped and resizes as needed.
- Tablet (768–1023px): Uses side Sheet UI (no floating window).
- Mobile (<768px): Uses bottom Drawer (no floating window).

Testing
1) Desktop
   - Load any page, click the SAM button → window opens bottom-right and is fully visible.
   - Drag to each edge → window remains fully on-screen.
   - Resize the browser smaller/larger → window resizes/clamps to stay visible.
2) Tablet simulation (~800px width)
   - Verify floating window does not render; Sheet UI opens from the right.
3) Mobile simulation (~375px width)
   - Verify floating window does not render; Drawer UI opens from bottom.

Notes
- Margin used for clamping is 20px.
- Default desktop target size remains 450×650 but is capped by available viewport space.

Future Improvements (optional)
- Persist window position and preferred size per route for enhanced UX.
- Animate size transitions on resize for smoother feel.
- Add a snap-to-corners option for fast repositioning.

