"use client";

import React from "react";

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute bottom-0 left-0 right-0" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function DrawerTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  return <>{children}</>;
}

export function DrawerContent({ children, className, ...rest }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...rest}>{children}</div>;
}

export function DrawerHeader({ children, className, ...rest }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...rest}>{children}</div>;
}

export function DrawerTitle({ children, className, ...rest }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={className} {...rest}>{children}</h3>;
}


