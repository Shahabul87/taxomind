'use client';
import { cn } from '@/lib/utils';
import Link, { LinkProps } from 'next/link';
import React, {
  useState,
  createContext,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

interface SidebarProps {
  children: ReactNode;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  animate?: boolean;
  className?: string;
}

export const Sidebar = ({ children, open, setOpen, animate = true, className }: SidebarProps) => {
  return (
    <aside className={cn('relative md:h-screen', className)}>
      <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
        {children}
      </SidebarProvider>
    </aside>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<'div'>)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          'h-full px-3 py-4 hidden  md:flex md:flex-col bg-slate-100 dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-700/50 w-[240px] flex-shrink-0 overflow-hidden',
          className
        )}
        animate={{
          width: animate ? (open ? '240px' : '80px') : '240px',
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({ className, children, ...props }: React.ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      {/* Fixed mobile header bar */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 h-14 px-4 flex flex-row md:hidden items-center justify-between bg-slate-100 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700/50 w-full z-50'
        )}
        {...props}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Menu
              className="h-6 w-6 text-slate-700 dark:text-slate-300 cursor-pointer"
              onClick={() => setOpen(!open)}
              aria-label="Open menu"
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-[90] md:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Mobile sidebar menu */}
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
              className={cn(
                'fixed h-full w-[85vw] max-w-sm inset-y-0 left-0 bg-slate-100 dark:bg-slate-900/95 z-[100] flex flex-col shadow-xl',
                className
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Menu</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4 space-y-6 [&>div]:!overflow-visible [&>div]:!min-h-auto">
                  {children}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();

  const pathname = usePathname();

  const isActive = pathname === link.href; // Check if the current path matches the link's href

  return (
    <Link
      href={link.href}
      className={cn(
        'flex items-center justify-start gap-2 group/sidebar py-2 px-3 rounded-md transition-colors duration-200',
        isActive
          ? 'bg-slate-200 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 font-semibold shadow-sm border border-slate-300 dark:border-slate-600'
          : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100',
        className
      )}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
