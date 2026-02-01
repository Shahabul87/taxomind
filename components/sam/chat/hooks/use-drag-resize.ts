import { useCallback, useEffect, useRef, useState } from 'react';
import type { WindowPosition, WindowSize, ResizeHandle } from '../types';
import { DEFAULT_WINDOW_SIZE, MIN_WINDOW_SIZE, MOBILE_BREAKPOINT } from '../types';

interface UseDragResizeOptions {
  initialPosition?: WindowPosition;
  initialSize?: WindowSize;
  enabled?: boolean;
}

interface UseDragResizeReturn {
  position: WindowPosition;
  size: WindowSize;
  isDragging: boolean;
  isResizing: boolean;
  isMobile: boolean;
  dragHandlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
  resizeHandlers: (handle: ResizeHandle) => {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
  resetPosition: () => void;
}

function getDefaultPosition(): WindowPosition {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  return {
    x: window.innerWidth - DEFAULT_WINDOW_SIZE.width - 24,
    y: window.innerHeight - DEFAULT_WINDOW_SIZE.height - 24,
  };
}

export function useDragResize(options: UseDragResizeOptions = {}): UseDragResizeReturn {
  const { enabled = true } = options;

  const [position, setPosition] = useState<WindowPosition>(
    options.initialPosition ?? getDefaultPosition
  );
  const [size, setSize] = useState<WindowSize>(
    options.initialSize ?? DEFAULT_WINDOW_SIZE
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Refs for stable closures (per CLAUDE.md: useRef for callback values)
  const positionRef = useRef(position);
  positionRef.current = position;

  const sizeRef = useRef(size);
  sizeRef.current = size;

  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const resizeStartRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    posX: number;
    posY: number;
    handle: ResizeHandle;
  } | null>(null);

  // Detect mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Clamp position to viewport
  const clamp = useCallback((pos: WindowPosition, sz: WindowSize): WindowPosition => {
    if (typeof window === 'undefined') return pos;
    return {
      x: Math.max(0, Math.min(pos.x, window.innerWidth - sz.width)),
      y: Math.max(0, Math.min(pos.y, window.innerHeight - sz.height)),
    };
  }, []);

  // Drag handlers
  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || isMobile) return;
      dragStartRef.current = {
        x: clientX,
        y: clientY,
        posX: positionRef.current.x,
        posY: positionRef.current.y,
      };
      setIsDragging(true);
    },
    [enabled, isMobile]
  );

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      const start = dragStartRef.current;
      if (!start) return;

      const dx = clientX - start.x;
      const dy = clientY - start.y;
      const newPos = clamp(
        { x: start.posX + dx, y: start.posY + dy },
        sizeRef.current
      );
      setPosition(newPos);
    },
    [clamp]
  );

  const handleDragEnd = useCallback(() => {
    dragStartRef.current = null;
    setIsDragging(false);
  }, []);

  // Resize handlers
  const handleResizeStart = useCallback(
    (clientX: number, clientY: number, handle: ResizeHandle) => {
      if (!enabled || isMobile) return;
      resizeStartRef.current = {
        x: clientX,
        y: clientY,
        width: sizeRef.current.width,
        height: sizeRef.current.height,
        posX: positionRef.current.x,
        posY: positionRef.current.y,
        handle,
      };
      setIsResizing(true);
    },
    [enabled, isMobile]
  );

  const handleResizeMove = useCallback(
    (clientX: number, clientY: number) => {
      const start = resizeStartRef.current;
      if (!start) return;

      const dx = clientX - start.x;
      const dy = clientY - start.y;

      let newWidth = start.width;
      let newHeight = start.height;
      let newX = start.posX;
      let newY = start.posY;

      // East handles
      if (start.handle.includes('e')) {
        newWidth = Math.max(MIN_WINDOW_SIZE.width, start.width + dx);
      }
      // West handles
      if (start.handle.includes('w')) {
        const delta = Math.min(dx, start.width - MIN_WINDOW_SIZE.width);
        newWidth = start.width - delta;
        newX = start.posX + delta;
      }
      // South handles
      if (start.handle.includes('s')) {
        newHeight = Math.max(MIN_WINDOW_SIZE.height, start.height + dy);
      }
      // North handles
      if (start.handle === 'n' || start.handle === 'ne' || start.handle === 'nw') {
        const delta = Math.min(dy, start.height - MIN_WINDOW_SIZE.height);
        newHeight = start.height - delta;
        newY = start.posY + delta;
      }

      const clampedPos = clamp({ x: newX, y: newY }, { width: newWidth, height: newHeight });
      setSize({ width: newWidth, height: newHeight });
      setPosition(clampedPos);
    },
    [clamp]
  );

  const handleResizeEnd = useCallback(() => {
    resizeStartRef.current = null;
    setIsResizing(false);
  }, []);

  // Global mouse/touch event listeners for drag and resize
  useEffect(() => {
    if (!enabled) return;

    const onMouseMove = (e: MouseEvent) => {
      if (dragStartRef.current) {
        e.preventDefault();
        handleDragMove(e.clientX, e.clientY);
      }
      if (resizeStartRef.current) {
        e.preventDefault();
        handleResizeMove(e.clientX, e.clientY);
      }
    };

    const onMouseUp = () => {
      if (dragStartRef.current) handleDragEnd();
      if (resizeStartRef.current) handleResizeEnd();
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (dragStartRef.current) {
        e.preventDefault();
        handleDragMove(touch.clientX, touch.clientY);
      }
      if (resizeStartRef.current) {
        e.preventDefault();
        handleResizeMove(touch.clientX, touch.clientY);
      }
    };

    const onTouchEnd = () => {
      if (dragStartRef.current) handleDragEnd();
      if (resizeStartRef.current) handleResizeEnd();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, handleDragMove, handleDragEnd, handleResizeMove, handleResizeEnd]);

  // Keep window in bounds on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onWindowResize = () => {
      if (window.innerWidth < MOBILE_BREAKPOINT) return;
      setPosition((prev) => clamp(prev, sizeRef.current));
    };

    window.addEventListener('resize', onWindowResize);
    return () => window.removeEventListener('resize', onWindowResize);
  }, [clamp]);

  const dragHandlers = {
    onMouseDown: (e: React.MouseEvent) => {
      // Only drag from left button, ignore buttons inside header
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[role="button"]')) return;
      handleDragStart(e.clientX, e.clientY);
    },
    onTouchStart: (e: React.TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[role="button"]')) return;
      const touch = e.touches[0];
      if (touch) handleDragStart(touch.clientX, touch.clientY);
    },
  };

  const resizeHandlers = (handle: ResizeHandle) => ({
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleResizeStart(e.clientX, e.clientY, handle);
    },
    onTouchStart: (e: React.TouchEvent) => {
      e.stopPropagation();
      const touch = e.touches[0];
      if (touch) handleResizeStart(touch.clientX, touch.clientY, handle);
    },
  });

  const resetPosition = useCallback(() => {
    setPosition(getDefaultPosition());
    setSize(DEFAULT_WINDOW_SIZE);
  }, []);

  return {
    position,
    size,
    isDragging,
    isResizing,
    isMobile,
    dragHandlers,
    resizeHandlers,
    resetPosition,
  };
}
