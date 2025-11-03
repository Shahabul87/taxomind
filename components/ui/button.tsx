import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground font-semibold",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-emerald-600 text-white hover:bg-emerald-600/80 shadow-md hover:shadow-lg",
        creategroup:"border border-[#94a3b8] text-[#94a3b8] px-6 py-3 rounded-lg hover:bg-[#1e293b] transition duration-200",
        createcourse:"bg-gray-800 hove:bg-gray-700",
        prevbutton:"bg-blue-600 text-white hover:bg-blue-700 font-semibold",
        // Enterprise-level variants
        enterprise: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98]",
        "enterprise-outline": "border-2 border-indigo-500/50 dark:border-indigo-400/50 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 hover:border-indigo-600 dark:hover:border-indigo-400 shadow-md hover:shadow-lg active:scale-[0.98]",
        "enterprise-ghost": "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:shadow-md active:scale-[0.98]",
        "enterprise-purple": "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-violet-700 active:scale-[0.98]",
        "enterprise-purple-outline": "border-2 border-purple-500/50 dark:border-purple-400/50 bg-purple-50/50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/70 hover:border-purple-600 dark:hover:border-purple-400 shadow-md hover:shadow-lg active:scale-[0.98]",
        "enterprise-success": "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98]",
        "enterprise-danger": "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg hover:shadow-xl hover:from-rose-700 hover:to-red-700 active:scale-[0.98]",
        "enterprise-danger-outline": "border-2 border-rose-500/50 dark:border-rose-400/50 bg-rose-50/50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/70 hover:border-rose-600 dark:hover:border-rose-400 shadow-md hover:shadow-lg active:scale-[0.98]",
        "glass": "bg-white/10 dark:bg-slate-800/10 backdrop-blur-md border border-white/20 dark:border-slate-700/20 text-slate-900 dark:text-white hover:bg-white/20 dark:hover:bg-slate-700/20 shadow-lg hover:shadow-xl active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-10 rounded-md px-4",
        lg: "h-11 rounded-lg px-8 text-base",
        xl: "h-12 rounded-lg px-10 text-lg",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
