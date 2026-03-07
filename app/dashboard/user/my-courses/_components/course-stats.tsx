import { cn } from '@/lib/utils';

interface CourseStatsProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle: string;
  color: 'blue' | 'emerald' | 'orange' | 'purple' | 'amber' | 'indigo';
}

const iconBgMap: Record<CourseStatsProps['color'], string> = {
  blue: 'bg-blue-100 dark:bg-blue-950/40',
  emerald: 'bg-emerald-100 dark:bg-emerald-950/40',
  orange: 'bg-orange-100 dark:bg-orange-950/40',
  purple: 'bg-purple-100 dark:bg-purple-950/40',
  amber: 'bg-amber-100 dark:bg-amber-950/40',
  indigo: 'bg-indigo-100 dark:bg-indigo-950/40',
};

export const CourseStats = ({ title, value, icon, subtitle, color }: CourseStatsProps) => {
  return (
    <div
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
      role="group"
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className={cn('p-1.5 rounded-lg flex-shrink-0', iconBgMap[color])}>
          {icon}
        </div>
        <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">
          {title}
        </span>
      </div>
      <div className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </div>
      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
        {subtitle}
      </p>
    </div>
  );
};
