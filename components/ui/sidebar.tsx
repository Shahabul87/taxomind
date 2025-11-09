"use client";
import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext, ReactNode, Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { usePathname } from 'next/navigation'

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

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
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

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate = true,
  className
}: SidebarProps) => {
  return (
    <aside className={cn("relative h-screen", className)}>
      <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
        {children}
      </SidebarProvider>
    </aside>
  );
};

export const   SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
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
          "h-full px-4 py-4 hidden  md:flex md:flex-col bg-slate-100 dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-700/50 w-[300px] flex-shrink-0 overflow-hidden",
          className
        )}
        animate={{
          width: animate ? (open ? "280px" : "100px") : "280px",
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

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden  items-center justify-between bg-slate-100 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700/50 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-slate-700 dark:text-slate-300"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-slate-100 dark:bg-slate-900/95 p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-slate-700 dark:text-slate-300"
                onClick={() => setOpen(!open)}
              >
                <X className="text-slate-700 dark:text-slate-300"/>
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
  
  const pathname = usePathname()

  const isActive = pathname === link.href; // Check if the current path matches the link's href

  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2 px-3 rounded-md transition-colors duration-200",
        isActive
          ? "bg-slate-200 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 font-semibold shadow-sm border border-slate-300 dark:border-slate-600"
          : "hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100",
        className
      )}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
