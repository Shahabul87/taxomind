// Optimized third-party library imports with tree-shaking
"use client";

// Date utilities - tree-shaken imports
export const dateUtils = {
  format: () => import('date-fns/format'),
  parseISO: () => import('date-fns/parseISO'),
  addDays: () => import('date-fns/addDays'),
  differenceInDays: () => import('date-fns/differenceInDays'),
  isAfter: () => import('date-fns/isAfter'),
  isBefore: () => import('date-fns/isBefore'),
  startOfDay: () => import('date-fns/startOfDay'),
  endOfDay: () => import('date-fns/endOfDay'),
};

// Lodash utilities - tree-shaken imports
export const lodashUtils = {
  debounce: () => import('lodash/debounce'),
  throttle: () => import('lodash/throttle'),
  cloneDeep: () => import('lodash/cloneDeep'),
  merge: () => import('lodash/merge'),
  isEmpty: () => import('lodash/isEmpty'),
  isEqual: () => import('lodash/isEqual'),
  pick: () => import('lodash/pick'),
  omit: () => import('lodash/omit'),
  uniq: () => import('lodash/uniq'),
  groupBy: () => import('lodash/groupBy'),
  sortBy: () => import('lodash/sortBy'),
  findIndex: () => import('lodash/findIndex'),
};

// React Icons - tree-shaken imports
export const iconUtils = {
  // Lucide React icons
  ChevronDown: () => import('lucide-react').then(mod => ({ default: mod.ChevronDown })),
  ChevronRight: () => import('lucide-react').then(mod => ({ default: mod.ChevronRight })),
  Plus: () => import('lucide-react').then(mod => ({ default: mod.Plus })),
  Minus: () => import('lucide-react').then(mod => ({ default: mod.Minus })),
  Edit: () => import('lucide-react').then(mod => ({ default: mod.Edit })),
  Trash: () => import('lucide-react').then(mod => ({ default: mod.Trash })),
  Save: () => import('lucide-react').then(mod => ({ default: mod.Save })),
  Search: () => import('lucide-react').then(mod => ({ default: mod.Search })),
  Settings: () => import('lucide-react').then(mod => ({ default: mod.Settings })),
  User: () => import('lucide-react').then(mod => ({ default: mod.User })),
  Home: () => import('lucide-react').then(mod => ({ default: mod.Home })),
  BookOpen: () => import('lucide-react').then(mod => ({ default: mod.BookOpen })),
  BarChart: () => import('lucide-react').then(mod => ({ default: mod.BarChart })),
  
  // React Icons
  FiCheck: () => import('react-icons/fi').then(mod => ({ default: mod.FiCheck })),
  FiX: () => import('react-icons/fi').then(mod => ({ default: mod.FiX })),
  FiLoader: () => import('react-icons/fi').then(mod => ({ default: mod.FiLoader })),
  FiAlert: () => import('react-icons/fi').then(mod => ({ default: mod.FiAlert })),
};

// Chart.js - optimized imports
export const chartUtils = {
  Chart: () => import('chart.js/auto'),
  CategoryScale: () => import('chart.js').then(mod => ({ default: mod.CategoryScale })),
  LinearScale: () => import('chart.js').then(mod => ({ default: mod.LinearScale })),
  BarElement: () => import('chart.js').then(mod => ({ default: mod.BarElement })),
  LineElement: () => import('chart.js').then(mod => ({ default: mod.LineElement })),
  PointElement: () => import('chart.js').then(mod => ({ default: mod.PointElement })),
  ArcElement: () => import('chart.js').then(mod => ({ default: mod.ArcElement })),
  Title: () => import('chart.js').then(mod => ({ default: mod.Title })),
  Tooltip: () => import('chart.js').then(mod => ({ default: mod.Tooltip })),
  Legend: () => import('chart.js').then(mod => ({ default: mod.Legend })),
};

// Recharts - optimized imports
export const rechartUtils = {
  ResponsiveContainer: () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  BarChart: () => import('recharts').then(mod => ({ default: mod.BarChart })),
  LineChart: () => import('recharts').then(mod => ({ default: mod.LineChart })),
  PieChart: () => import('recharts').then(mod => ({ default: mod.PieChart })),
  AreaChart: () => import('recharts').then(mod => ({ default: mod.AreaChart })),
  XAxis: () => import('recharts').then(mod => ({ default: mod.XAxis })),
  YAxis: () => import('recharts').then(mod => ({ default: mod.YAxis })),
  CartesianGrid: () => import('recharts').then(mod => ({ default: mod.CartesianGrid })),
  Tooltip: () => import('recharts').then(mod => ({ default: mod.Tooltip })),
  Legend: () => import('recharts').then(mod => ({ default: mod.Legend })),
  Bar: () => import('recharts').then(mod => ({ default: mod.Bar })),
  Line: () => import('recharts').then(mod => ({ default: mod.Line })),
  Area: () => import('recharts').then(mod => ({ default: mod.Area })),
};

// Framer Motion - optimized imports
export const motionUtils = {
  motion: () => import('framer-motion').then(mod => ({ default: mod.motion })),
  AnimatePresence: () => import('framer-motion').then(mod => ({ default: mod.AnimatePresence })),
  useAnimation: () => import('framer-motion').then(mod => ({ default: mod.useAnimation })),
  useMotionValue: () => import('framer-motion').then(mod => ({ default: mod.useMotionValue })),
  useTransform: () => import('framer-motion').then(mod => ({ default: mod.useTransform })),
  useSpring: () => import('framer-motion').then(mod => ({ default: mod.useSpring })),
  useScroll: () => import('framer-motion').then(mod => ({ default: mod.useScroll })),
  useInView: () => import('framer-motion').then(mod => ({ default: mod.useInView })),
};

// TipTap Editor - optimized imports
export const editorUtils = {
  useEditor: () => import('@tiptap/react').then(mod => ({ default: mod.useEditor })),
  EditorContent: () => import('@tiptap/react').then(mod => ({ default: mod.EditorContent })),
  StarterKit: () => import('@tiptap/starter-kit'),
  Link: () => import('@tiptap/extension-link'),
  Image: () => import('@tiptap/extension-image'),
  Table: () => import('@tiptap/extension-table'),
  TableRow: () => import('@tiptap/extension-table-row'),
  TableCell: () => import('@tiptap/extension-table-cell'),
  TableHeader: () => import('@tiptap/extension-table-header'),
  BulletList: () => import('@tiptap/extension-bullet-list'),
  OrderedList: () => import('@tiptap/extension-ordered-list'),
  ListItem: () => import('@tiptap/extension-list-item'),
  Heading: () => import('@tiptap/extension-heading'),
  Bold: () => import('@tiptap/extension-bold'),
  Italic: () => import('@tiptap/extension-italic'),
  Underline: () => import('@tiptap/extension-underline'),
  Color: () => import('@tiptap/extension-color'),
  Highlight: () => import('@tiptap/extension-highlight'),
  TextAlign: () => import('@tiptap/extension-text-align'),
  Placeholder: () => import('@tiptap/extension-placeholder'),
};

// React Flow - optimized imports
export const flowUtils = {
  ReactFlow: () => import('reactflow').then(mod => ({ default: mod.default })),
  Background: () => import('reactflow').then(mod => ({ default: mod.Background })),
  Controls: () => import('reactflow').then(mod => ({ default: mod.Controls })),
  MiniMap: () => import('reactflow').then(mod => ({ default: mod.MiniMap })),
  Handle: () => import('reactflow').then(mod => ({ default: mod.Handle })),
  Position: () => import('reactflow').then(mod => ({ default: mod.Position })),
  useNodesState: () => import('reactflow').then(mod => ({ default: mod.useNodesState })),
  useEdgesState: () => import('reactflow').then(mod => ({ default: mod.useEdgesState })),
  useReactFlow: () => import('reactflow').then(mod => ({ default: mod.useReactFlow })),
};

// Utility function to load multiple imports
export async function loadMultipleImports<T extends Record<string, () => Promise<any>>>(
  imports: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const entries = Object.entries(imports);
  const results = await Promise.all(
    entries.map(([key, importFn]) => importFn().then(module => [key, module]))
  );
  
  return Object.fromEntries(results) as { [K in keyof T]: Awaited<ReturnType<T[K]>> };
}

// Preloader for critical imports
export const preloadCriticalImports = {
  icons: () => Promise.all([
    iconUtils.ChevronDown(),
    iconUtils.ChevronRight(),
    iconUtils.Plus(),
    iconUtils.Edit(),
    iconUtils.Search(),
    iconUtils.Settings(),
    iconUtils.User(),
    iconUtils.Home(),
  ]),
  
  utilities: () => Promise.all([
    lodashUtils.debounce(),
    lodashUtils.throttle(),
    lodashUtils.isEmpty(),
    lodashUtils.isEqual(),
    dateUtils.format(),
    dateUtils.parseISO(),
  ]),
  
  motion: () => Promise.all([
    motionUtils.motion(),
    motionUtils.AnimatePresence(),
  ]),
};

// Bundle size monitoring
export const bundleMetrics = {
  trackImport: (module: string, size?: number) => {
    if (typeof window !== 'undefined' && window.performance) {
      const mark = `import-${module}-${Date.now()}`;
      performance.mark(mark);
      
      // Store in session storage for debugging
      const metrics = JSON.parse(sessionStorage.getItem('bundle-metrics') || '{}');
      metrics[module] = {
        timestamp: Date.now(),
        size: size || 0,
        mark,
      };
      sessionStorage.setItem('bundle-metrics', JSON.stringify(metrics));
    }
  },
  
  getMetrics: () => {
    if (typeof window !== 'undefined') {
      return JSON.parse(sessionStorage.getItem('bundle-metrics') || '{}');
    }
    return {};
  },
  
  clearMetrics: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bundle-metrics');
    }
  },
};