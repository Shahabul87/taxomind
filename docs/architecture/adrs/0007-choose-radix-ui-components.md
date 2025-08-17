# ADR-0007: Choose Radix UI with Tailwind CSS for Component Library

## Status
Accepted

## Context
The Taxomind LMS requires a comprehensive UI component system that provides:
- Accessibility-first components meeting WCAG 2.1 AA standards
- Consistent design language across the application
- Responsive design for mobile, tablet, and desktop
- High performance with minimal bundle size
- Customizable theming and styling
- TypeScript support with proper type definitions
- Server Component compatibility for Next.js 15
- Rich interactive components (modals, dropdowns, tooltips, etc.)

The UI system needs to support:
- Complex forms with validation
- Data tables with sorting and filtering
- Rich text editing
- Charts and data visualization
- Drag-and-drop interactions
- Keyboard navigation
- Screen reader compatibility

## Decision
We will use Radix UI primitives for behavioral components combined with Tailwind CSS for styling, enhanced with custom component abstractions using shadcn/ui patterns.

## Consequences

### Positive
- **Accessibility Built-in**: Radix UI provides ARIA-compliant components by default
- **Unstyled Primitives**: Complete control over visual design
- **Performance**: Small bundle size, tree-shakeable components
- **Tailwind Integration**: Utility-first CSS with excellent DX
- **TypeScript Support**: Full type safety and auto-completion
- **Composability**: Build complex components from primitives
- **Keyboard Navigation**: Built-in keyboard support for all components
- **Focus Management**: Proper focus trapping and restoration
- **Animation Ready**: Works well with Framer Motion or CSS animations
- **Community**: Large ecosystem with shadcn/ui patterns

### Negative
- **Learning Curve**: Understanding primitive composition patterns
- **Boilerplate**: More initial setup compared to pre-styled libraries
- **Styling Overhead**: Need to style all components from scratch
- **Documentation**: Need to document custom component APIs
- **Testing**: More components to test due to custom abstractions
- **Maintenance**: Keeping component library updated and consistent

## Alternatives Considered

### 1. Material-UI (MUI)
- **Pros**: Comprehensive components, Material Design, theming system
- **Cons**: Large bundle size, opinionated design, CSS-in-JS overhead
- **Reason for rejection**: Too heavy and opinionated for our needs

### 2. Ant Design
- **Pros**: Enterprise-focused, extensive components, form handling
- **Cons**: Large bundle, Chinese-first documentation, style customization limitations
- **Reason for rejection**: Difficult to customize to match our design requirements

### 3. Chakra UI
- **Pros**: Good accessibility, modular, nice DX
- **Cons**: Runtime CSS-in-JS, larger bundle than Radix, less flexible
- **Reason for rejection**: Runtime overhead and less control over primitives

### 4. Headless UI
- **Pros**: Unstyled like Radix, Tailwind team maintained
- **Cons**: Fewer components, less mature, smaller ecosystem
- **Reason for rejection**: Radix has more components and better accessibility

### 5. React Aria (Adobe)
- **Pros**: Best-in-class accessibility, comprehensive hooks
- **Cons**: Lower level than Radix, more complex implementation
- **Reason for rejection**: Requires more work to build basic components

### 6. Custom Components
- **Pros**: Complete control, optimized for specific needs
- **Cons**: Time consuming, accessibility challenges, maintenance burden
- **Reason for rejection**: Reinventing the wheel, high development cost

## Implementation Notes

### Component Architecture
```typescript
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
```

### Dialog Component Pattern
```typescript
// components/ui/dialog.tsx
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName
```

### Form Components with React Hook Form
```typescript
// components/ui/form.tsx
import * as React from "react"
import { Controller, useFormContext } from "react-hook-form"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

const Form = FormProvider

const FormField = ({
  ...props
}: ControllerProps) => {
  return <Controller {...props} />
}

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
})
FormLabel.displayName = LabelPrimitive.Root.displayName
```

### Data Table Pattern
```typescript
// components/ui/data-table.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### Accessibility Utilities
```typescript
// lib/a11y.ts
export function useAriaAnnounce() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.setAttribute('class', 'sr-only')
    announcement.textContent = message
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
  
  return { announce }
}

export function useFocusTrap(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus()
          e.preventDefault()
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    firstFocusable?.focus()

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref])
}
```

### Theme System
```typescript
// lib/theme.ts
export const themes = {
  light: {
    background: "0 0% 100%",
    foreground: "222.2 84% 4.9%",
    primary: "222.2 47.4% 11.2%",
    secondary: "210 40% 96.1%",
  },
  dark: {
    background: "222.2 84% 4.9%",
    foreground: "210 40% 98%",
    primary: "210 40% 98%",
    secondary: "217.2 32.6% 17.5%",
  },
}

export function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  const colors = themes[theme]
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
  
  root.classList.toggle('dark', theme === 'dark')
}
```

## Component Guidelines
1. **Always use Radix primitives** for interactive components
2. **Style with Tailwind utilities** avoiding custom CSS
3. **Implement keyboard navigation** for all interactive elements
4. **Include ARIA labels** for screen readers
5. **Use semantic HTML** elements where possible
6. **Test with screen readers** and keyboard-only navigation
7. **Document component APIs** with TypeScript and JSDoc
8. **Create Storybook stories** for component documentation

## Performance Optimizations
1. Use dynamic imports for heavy components
2. Implement virtual scrolling for large lists
3. Lazy load images with Next.js Image component
4. Use CSS transforms for animations
5. Minimize re-renders with React.memo and useMemo

## Testing Strategy
1. Unit tests for component logic
2. Integration tests for complex interactions
3. Visual regression tests with Chromatic
4. Accessibility tests with jest-axe
5. Manual testing with screen readers

## References
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

## Date
2024-01-21

## Authors
- Taxomind Architecture Team