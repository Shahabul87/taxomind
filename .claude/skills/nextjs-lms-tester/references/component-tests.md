# ⚛️ Component Test Reference

## Setup & Conventions

### Required Imports
```tsx
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
```

### Test File Structure
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ComponentUnderTest } from './component-under-test'

// Mock external dependencies at module level
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/lib/db', () => ({
  db: { /* mocked prisma */ }
}))

describe('ComponentUnderTest', () => {
  const user = userEvent.setup()

  const defaultProps = {
    // sensible defaults for required props
  }

  const renderComponent = (overrides = {}) => {
    return render(<ComponentUnderTest {...defaultProps} {...overrides} />)
  }

  describe('rendering', () => {
    it('renders the component with required content', () => {
      renderComponent()
      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })

    it('renders empty state when no data', () => {
      renderComponent({ items: [] })
      expect(screen.getByText('No items found')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('handles click action', async () => {
      const onAction = jest.fn()
      renderComponent({ onAction })

      await user.click(screen.getByRole('button', { name: /submit/i }))
      expect(onAction).toHaveBeenCalledTimes(1)
    })
  })

  describe('conditional rendering', () => {
    it('shows admin controls when user is admin', () => {
      renderComponent({ role: 'admin' })
      expect(screen.getByText('Delete Course')).toBeInTheDocument()
    })

    it('hides admin controls for regular users', () => {
      renderComponent({ role: 'student' })
      expect(screen.queryByText('Delete Course')).not.toBeInTheDocument()
    })
  })
})
```

## Common Mocking Patterns

### Next.js Navigation
```tsx
const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/courses/123',
  useSearchParams: () => new URLSearchParams('?page=1'),
  useParams: () => ({ courseId: '123' }),
}))

// Reset in beforeEach
beforeEach(() => {
  mockPush.mockClear()
  mockRefresh.mockClear()
})
```

### NextAuth Session
```tsx
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'STUDENT' }
    },
    status: 'authenticated',
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// For unauthenticated state:
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}))
```

### Next.js Image
```tsx
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))
```

### Zustand Store
```tsx
// Option 1: Mock the store entirely
jest.mock('@/store/use-auth-store', () => ({
  useAuthStore: (selector: any) => selector({
    user: { id: '1', name: 'Test' },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
  })
}))

// Option 2: Create a test store
import { create } from 'zustand'
const useTestStore = create(() => ({
  user: null,
  setUser: jest.fn(),
}))
```

### Toast/Notifications
```tsx
const mockToast = jest.fn()
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: Object.assign(mockToast, {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  }),
}))
```

### Framer Motion
```tsx
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({ start: jest.fn() }),
  useInView: () => true,
}))
```

### Intersection Observer
```tsx
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})
window.IntersectionObserver = mockIntersectionObserver
```

## Testing Patterns by Component Type

### Form Components
```tsx
describe('CourseCreateForm', () => {
  const user = userEvent.setup()

  it('submits form with valid data', async () => {
    const onSubmit = jest.fn()
    render(<CourseCreateForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/title/i), 'My Course')
    await user.type(screen.getByLabelText(/description/i), 'Course description')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'My Course' })
      )
    })
  })

  it('shows validation errors for empty required fields', async () => {
    render(<CourseCreateForm onSubmit={jest.fn()} />)

    await user.click(screen.getByRole('button', { name: /create/i }))

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument()
  })

  it('disables submit button while submitting', async () => {
    // Use a never-resolving promise to keep loading state
    const onSubmit = jest.fn(() => new Promise(() => {}))
    render(<CourseCreateForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/title/i), 'Course')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
    })
  })
})
```

### List/Card Components
```tsx
describe('CourseCard', () => {
  const mockCourse = {
    id: '1',
    title: 'Test Course',
    imageUrl: '/test.jpg',
    price: 29.99,
    chaptersCount: 10,
    progress: 50,
    category: 'Programming',
  }

  it('renders course information', () => {
    render(<CourseCard course={mockCourse} />)

    expect(screen.getByText('Test Course')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
    expect(screen.getByText('10 Chapters')).toBeInTheDocument()
  })

  it('shows progress bar when enrolled', () => {
    render(<CourseCard course={mockCourse} />)

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '50')
  })

  it('shows free badge when price is 0', () => {
    render(<CourseCard course={{ ...mockCourse, price: 0 }} />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('navigates to course page on click', async () => {
    const user = userEvent.setup()
    render(<CourseCard course={mockCourse} />)

    await user.click(screen.getByText('Test Course'))
    expect(mockPush).toHaveBeenCalledWith('/courses/1')
  })
})
```

### Modal/Dialog Components
```tsx
describe('ConfirmModal', () => {
  const user = userEvent.setup()

  it('renders when open', () => {
    render(<ConfirmModal isOpen onConfirm={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ConfirmModal isOpen={false} onConfirm={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirmed', async () => {
    const onConfirm = jest.fn()
    render(<ConfirmModal isOpen onConfirm={onConfirm} onCancel={jest.fn()} />)

    await user.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when backdrop clicked', async () => {
    const onCancel = jest.fn()
    render(<ConfirmModal isOpen onConfirm={jest.fn()} onCancel={onCancel} />)

    await user.click(screen.getByTestId('modal-backdrop'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
```

## Query Priorities (what to use)

1. `getByRole` — Best: accessible, resilient
2. `getByLabelText` — Great for form fields
3. `getByPlaceholderText` — OK for inputs
4. `getByText` — OK for static content
5. `getByTestId` — Last resort (add `data-testid`)

**Avoid:** `getByClassName`, `container.querySelector` — implementation details.

## Anti-Patterns to Avoid

| ❌ Bad | ✅ Good | Why |
|--------|---------|-----|
| `expect(container.innerHTML).toContain('text')` | `expect(screen.getByText('text')).toBeInTheDocument()` | Fragile, tests implementation |
| `wrapper.find('.my-class')` | `screen.getByRole('button')` | Tests behavior not styling |
| `await new Promise(r => setTimeout(r, 1000))` | `await waitFor(() => expect(...))` | Deterministic, not time-based |
| `expect(setState).toHaveBeenCalled()` | `expect(screen.getByText('new value'))` | Tests outcome, not mechanism |
| `toMatchSnapshot()` for everything | Targeted assertions | Snapshots are low-signal |
| `act(() => { ... })` everywhere | `userEvent` handles it | RTL wraps in act automatically |
