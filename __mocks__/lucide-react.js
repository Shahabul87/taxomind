const React = require('react');

// Create a mock icon component factory
const createMockIcon = (name) => {
  const Icon = React.forwardRef((props, ref) =>
    React.createElement('svg', {
      ref,
      'data-testid': `icon-${name}`,
      'aria-hidden': 'true',
      ...props
    })
  );
  Icon.displayName = name;
  return Icon;
};

// Export commonly used icons
const iconNames = [
  'Home', 'Search', 'Menu', 'X', 'Check', 'ChevronDown', 'ChevronUp',
  'ChevronLeft', 'ChevronRight', 'ArrowLeft', 'ArrowRight', 'Plus',
  'Minus', 'Edit', 'Trash', 'Save', 'Download', 'Upload', 'Settings',
  'User', 'Users', 'Mail', 'Phone', 'Calendar', 'Clock', 'Star',
  'Heart', 'Bell', 'Eye', 'EyeOff', 'Lock', 'Unlock', 'Key',
  'Shield', 'ShieldCheck', 'AlertCircle', 'AlertTriangle', 'Info',
  'HelpCircle', 'MessageCircle', 'MessageSquare', 'Send', 'Share',
  'Copy', 'Clipboard', 'FileText', 'File', 'Folder', 'FolderOpen',
  'Image', 'Video', 'Music', 'Link', 'ExternalLink', 'Globe',
  'Loader', 'Loader2', 'RefreshCw', 'RotateCw', 'RotateCcw',
  'ZoomIn', 'ZoomOut', 'Maximize', 'Minimize', 'Move', 'Grip',
  'MoreHorizontal', 'MoreVertical', 'Filter', 'SortAsc', 'SortDesc',
  'LayoutGrid', 'LayoutList', 'Table', 'Columns', 'Rows',
  'PieChart', 'BarChart', 'LineChart', 'TrendingUp', 'TrendingDown',
  'DollarSign', 'CreditCard', 'ShoppingCart', 'Package', 'Truck',
  'MapPin', 'Navigation', 'Compass', 'Target', 'Award', 'Trophy',
  'Bookmark', 'BookOpen', 'Book', 'GraduationCap', 'School',
  'Brain', 'Lightbulb', 'Zap', 'Flame', 'Sun', 'Moon', 'Cloud',
  'Sparkles', 'Wand2', 'Palette', 'Paintbrush', 'Pencil', 'PenTool',
  'Code', 'Terminal', 'Command', 'Database', 'Server', 'Wifi',
  'Bluetooth', 'Battery', 'Power', 'Activity', 'Cpu', 'HardDrive',
  'Monitor', 'Smartphone', 'Tablet', 'Laptop', 'Watch', 'Tv',
  'Headphones', 'Speaker', 'Mic', 'MicOff', 'Volume', 'VolumeX',
  'Play', 'Pause', 'Stop', 'SkipBack', 'SkipForward', 'Rewind',
  'FastForward', 'Repeat', 'Shuffle', 'Radio', 'Podcast',
  'Camera', 'CameraOff', 'Aperture', 'Film', 'Youtube', 'Twitter',
  'Facebook', 'Instagram', 'Linkedin', 'Github', 'Gitlab',
  'Chrome', 'Firefox', 'Safari', 'Figma', 'Framer', 'Slack',
  'Dribbble', 'Trello', 'Notion', 'Discord', 'Twitch',
  'LogIn', 'LogOut', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX',
  'Inbox', 'Archive', 'Trash2', 'FolderPlus', 'FolderMinus',
  'FilePlus', 'FileMinus', 'FileCheck', 'FileX', 'FileSearch',
  'Printer', 'Scan', 'Receipt', 'Tags', 'Tag', 'Hash', 'AtSign',
  'CheckCircle', 'CheckSquare', 'Circle', 'Square', 'Triangle',
  'Hexagon', 'Octagon', 'Pentagon', 'Diamond', 'Shapes',
  'Grid', 'Layers', 'Box', 'Boxes', 'Component', 'Puzzle',
  'Construction', 'Wrench', 'Hammer', 'Screwdriver', 'Tool',
  'Scissors', 'Crop', 'Slice', 'Blend', 'Eraser', 'Type',
  'Bold', 'Italic', 'Underline', 'Strikethrough', 'AlignLeft',
  'AlignCenter', 'AlignRight', 'AlignJustify', 'List', 'ListOrdered',
  'Quote', 'Code2', 'Braces', 'Brackets', 'Regex', 'Variable',
  'Binary', 'Git', 'GitBranch', 'GitCommit', 'GitMerge', 'GitPullRequest',
  'Diff', 'History', 'Timer', 'TimerOff', 'Hourglass', 'Watch',
  'Alarm', 'AlarmCheck', 'AlarmMinus', 'AlarmPlus', 'AlarmOff',
  'Sunrise', 'Sunset', 'CloudRain', 'CloudSnow', 'CloudLightning',
  'Wind', 'Thermometer', 'Droplet', 'Waves', 'Umbrella',
  'Anchor', 'Ship', 'Plane', 'Car', 'Bus', 'Train', 'Bike',
  'Rocket', 'Satellite', 'Airplay', 'Cast', 'MonitorPlay',
  'PanelLeft', 'PanelRight', 'PanelTop', 'PanelBottom', 'Layout',
  'LayoutDashboard', 'Sidebar', 'SidebarOpen', 'SidebarClose',
  'CalendarDays', 'CalendarCheck', 'CalendarX', 'CalendarPlus',
  'CalendarMinus', 'CalendarClock', 'CalendarRange', 'CalendarOff',
  'BarChart2', 'BarChart3', 'BarChart4', 'AreaChart', 'ScatterChart',
  'Gauge', 'Percent', 'Calculator', 'Equal', 'Infinity',
  'Sigma', 'Pi', 'Divide', 'X', 'Plus', 'Minus', 'Asterisk',
  'LucideIcon'
];

const icons = {};
iconNames.forEach(name => {
  icons[name] = createMockIcon(name);
});

// Also create a Proxy to handle any icon that might not be in the list
module.exports = new Proxy(icons, {
  get: (target, prop) => {
    if (prop === '__esModule') return true;
    if (prop in target) return target[prop];
    // For any icon not in our list, create it on demand
    return createMockIcon(String(prop));
  }
});
