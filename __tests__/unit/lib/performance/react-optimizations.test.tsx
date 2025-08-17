/**
 * Unit Tests for React Performance Optimizations
 * Tests the React memo optimizations, virtual scrolling, and image optimization from Phase 3
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { 
  withOptimizedMemo,
  OptimizedMetricCard,
  OptimizedLineChart,
  OptimizedAreaChart,
  OptimizedPieChart,
  OptimizedUserProgress,
  OptimizedCourseList,
  compareProps,
} from '@/lib/performance/react-memo-optimizations';
import { VirtualScrollList } from '@/lib/performance/virtual-scrolling';
import { ReactTest, Performance, MockData, Memory } from '@/__tests__/utils/test-utilities';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe('React Performance Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Performance.clearMeasurements();
  });

  describe('Memoization HOC', () => {
    it('should prevent unnecessary re-renders with memo', () => {
      const TestComponent = ({ value, onClick }: any) => {
        const renderCount = React.useRef(0);
        renderCount.current++;
        
        return (
          <div data-testid="test-component">
            <span data-testid="render-count">{renderCount.current}</span>
            <span data-testid="value">{value}</span>
            <button onClick={onClick}>Click</button>
          </div>
        );
      };

      const MemoizedComponent = withMemoization(TestComponent);
      
      const { rerender } = render(
        <MemoizedComponent value="test" onClick={() => {}} />
      );

      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      // Re-render with same props
      rerender(<MemoizedComponent value="test" onClick={() => {}} />);
      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      // Re-render with different props
      rerender(<MemoizedComponent value="updated" onClick={() => {}} />);
      expect(screen.getByTestId('render-count')).toHaveTextContent('2');
    });

    it('should use custom comparison function', () => {
      const TestComponent = ({ data }: any) => {
        const renderCount = React.useRef(0);
        renderCount.current++;
        
        return <div data-testid="render-count">{renderCount.current}</div>;
      };

      const customCompare = (prevProps: any, nextProps: any) => {
        return prevProps.data.id === nextProps.data.id;
      };

      const MemoizedComponent = withMemoization(TestComponent, customCompare);
      
      const { rerender } = render(
        <MemoizedComponent data={{ id: 1, name: 'Test' }} />
      );

      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      // Same id, different name - should not re-render
      rerender(<MemoizedComponent data={{ id: 1, name: 'Updated' }} />);
      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      // Different id - should re-render
      rerender(<MemoizedComponent data={{ id: 2, name: 'New' }} />);
      expect(screen.getByTestId('render-count')).toHaveTextContent('2');
    });

    it('should demonstrate performance improvement with memoization', () => {
      const ExpensiveComponent = ({ data }: any) => {
        // Simulate expensive computation
        const computed = data.items.reduce((acc: number, item: any) => {
          return acc + item.value * item.quantity;
        }, 0);
        
        return <div data-testid="result">{computed}</div>;
      };

      const MemoizedExpensive = withMemoization(ExpensiveComponent);
      
      const testData = {
        items: MockData.generateLargeDataset(1000).map((item: any) => ({
          value: item.value,
          quantity: Math.floor(Math.random() * 10),
        })),
      };

      const result = ReactTest.testMemoization(
        MemoizedExpensive,
        { data: testData },
        { data: { ...testData, unrelatedProp: 'changed' } }
      );

      expect(result.initialRenders).toBe(0); // No re-render with same props
      expect(result.afterUpdateRenders).toBeGreaterThan(0); // Re-render with different props
    });
  });

  describe('Virtual Scrolling', () => {
    it('should render only visible items', () => {
      const items = MockData.generateLargeDataset(10000);
      
      const renderItem = (item: any, index: number) => (
        <div key={index} data-testid={`item-${index}`}>
          {item.field1}
        </div>
      );

      render(
        <VirtualScroll
          items={items}
          itemHeight={50}
          containerHeight={500}
          renderItem={renderItem}
          buffer={2}
        />
      );

      // Should only render visible items plus buffer
      const visibleCount = Math.ceil(500 / 50) + 2 * 2; // height/itemHeight + buffer*2
      const renderedItems = screen.queryAllByTestId(/^item-/);
      
      expect(renderedItems.length).toBeLessThanOrEqual(visibleCount);
      expect(renderedItems.length).toBeGreaterThan(0);
    });

    it('should update visible items on scroll', async () => {
      const items = MockData.generateLargeDataset(1000);
      
      const renderItem = (item: any, index: number) => (
        <div key={index} data-testid={`item-${index}`}>
          Item {index}
        </div>
      );

      const { container } = render(
        <VirtualScroll
          items={items}
          itemHeight={50}
          containerHeight={300}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.querySelector('[data-testid="virtual-scroll-container"]');
      expect(scrollContainer).toBeDefined();

      // Initially should show first items
      expect(screen.queryByTestId('item-0')).toBeInTheDocument();
      expect(screen.queryByTestId('item-100')).not.toBeInTheDocument();

      // Simulate scroll
      act(() => {
        fireEvent.scroll(scrollContainer!, { target: { scrollTop: 5000 } });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('item-0')).not.toBeInTheDocument();
        expect(screen.queryByTestId('item-100')).toBeInTheDocument();
      });
    });

    it('should handle dynamic item heights', () => {
      const items = MockData.generateLargeDataset(100);
      
      const getItemHeight = (index: number) => {
        return 30 + (index % 3) * 20; // Variable heights: 30, 50, 70
      };

      const renderItem = (item: any, index: number) => (
        <div 
          key={index} 
          data-testid={`item-${index}`}
          style={{ height: getItemHeight(index) }}
        >
          {item.field1}
        </div>
      );

      render(
        <VirtualScroll
          items={items}
          itemHeight={getItemHeight}
          containerHeight={400}
          renderItem={renderItem}
          dynamic={true}
        />
      );

      const renderedItems = screen.queryAllByTestId(/^item-/);
      expect(renderedItems.length).toBeGreaterThan(0);
      
      // Check that items have correct heights
      renderedItems.forEach((item, index) => {
        const expectedHeight = getItemHeight(index);
        expect(item.style.height).toBe(`${expectedHeight}px`);
      });
    });

    it('should optimize scroll performance', async () => {
      const items = MockData.generateLargeDataset(10000);
      const scrollEvents = 100;
      
      const renderItem = (item: any, index: number) => (
        <div key={index}>{item.field1}</div>
      );

      const { container } = render(
        <VirtualScroll
          items={items}
          itemHeight={50}
          containerHeight={500}
          renderItem={renderItem}
          throttleScroll={16} // 60fps throttle
        />
      );

      const scrollContainer = container.querySelector('[data-testid="virtual-scroll-container"]');
      
      Performance.startMeasure('virtual-scroll');
      
      // Simulate rapid scrolling
      for (let i = 0; i < scrollEvents; i++) {
        act(() => {
          fireEvent.scroll(scrollContainer!, { 
            target: { scrollTop: i * 100 } 
          });
        });
      }
      
      const duration = Performance.endMeasure('virtual-scroll');
      const avgTimePerScroll = duration / scrollEvents;
      
      // Should handle scroll events efficiently
      expect(avgTimePerScroll).toBeLessThan(16); // Less than one frame
    });
  });

  describe('Optimized Image Component', () => {
    it('should lazy load images', () => {
      const { container } = render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test Image"
          width={400}
          height={300}
          lazy={true}
        />
      );

      const img = container.querySelector('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should show placeholder while loading', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test Image"
          width={400}
          height={300}
          placeholder="/placeholder.jpg"
        />
      );

      const placeholder = screen.queryByTestId('image-placeholder');
      expect(placeholder).toBeInTheDocument();
    });

    it('should handle responsive images', () => {
      const { container } = render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test Image"
          width={800}
          height={600}
          responsive={true}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      );

      const img = container.querySelector('img');
      expect(img).toHaveAttribute('sizes');
      expect(img?.getAttribute('sizes')).toBe('(max-width: 768px) 100vw, 50vw');
    });

    it('should optimize with srcset', () => {
      const { container } = render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test Image"
          width={800}
          height={600}
          srcSet={[
            { width: 400, src: '/test-image-400.jpg' },
            { width: 800, src: '/test-image-800.jpg' },
            { width: 1200, src: '/test-image-1200.jpg' },
          ]}
        />
      );

      const img = container.querySelector('img');
      expect(img).toHaveAttribute('srcset');
      expect(img?.getAttribute('srcset')).toContain('400w');
      expect(img?.getAttribute('srcset')).toContain('800w');
      expect(img?.getAttribute('srcset')).toContain('1200w');
    });

    it('should handle progressive loading', async () => {
      const onLoad = jest.fn();
      
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test Image"
          width={800}
          height={600}
          progressive={true}
          onLoad={onLoad}
        />
      );

      // Simulate image load
      const img = screen.getByAltText('Test Image');
      fireEvent.load(img);

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });
    });
  });

  describe('Custom Hooks for Performance', () => {
    describe('useMemoizedCallback', () => {
      it('should memoize callbacks with dependencies', () => {
        const callback = jest.fn();
        
        const TestComponent = ({ value }: { value: number }) => {
          const memoizedCallback = useMemoizedCallback(
            () => callback(value),
            [value]
          );

          React.useEffect(() => {
            memoizedCallback();
          }, [memoizedCallback]);

          return <div>{value}</div>;
        };

        const { rerender } = render(<TestComponent value={1} />);
        expect(callback).toHaveBeenCalledWith(1);
        expect(callback).toHaveBeenCalledTimes(1);

        // Same value - callback should not change
        rerender(<TestComponent value={1} />);
        expect(callback).toHaveBeenCalledTimes(1);

        // Different value - callback should update
        rerender(<TestComponent value={2} />);
        expect(callback).toHaveBeenCalledWith(2);
        expect(callback).toHaveBeenCalledTimes(2);
      });
    });

    describe('useDeepCompareMemo', () => {
      it('should memoize with deep comparison', () => {
        const expensiveComputation = jest.fn((data: any) => {
          return data.items.reduce((sum: number, item: any) => sum + item.value, 0);
        });

        const TestComponent = ({ data }: { data: any }) => {
          const result = useDeepCompareMemo(
            () => expensiveComputation(data),
            [data]
          );

          return <div data-testid="result">{result}</div>;
        };

        const data1 = { items: [{ value: 1 }, { value: 2 }] };
        const data2 = { items: [{ value: 1 }, { value: 2 }] }; // Same content, different reference
        const data3 = { items: [{ value: 3 }, { value: 4 }] };

        const { rerender } = render(<TestComponent data={data1} />);
        expect(expensiveComputation).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('result')).toHaveTextContent('3');

        // Same content, different reference - should not recompute
        rerender(<TestComponent data={data2} />);
        expect(expensiveComputation).toHaveBeenCalledTimes(1);

        // Different content - should recompute
        rerender(<TestComponent data={data3} />);
        expect(expensiveComputation).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('result')).toHaveTextContent('7');
      });
    });

    describe('useThrottledState', () => {
      it('should throttle state updates', async () => {
        jest.useFakeTimers();
        
        const TestComponent = () => {
          const [value, setValue] = useThrottledState('', 100);
          
          return (
            <div>
              <input
                data-testid="input"
                onChange={(e) => setValue(e.target.value)}
              />
              <div data-testid="output">{value}</div>
            </div>
          );
        };

        render(<TestComponent />);
        
        const input = screen.getByTestId('input');
        
        // Rapid updates
        fireEvent.change(input, { target: { value: 'a' } });
        fireEvent.change(input, { target: { value: 'ab' } });
        fireEvent.change(input, { target: { value: 'abc' } });
        
        // Should throttle updates
        expect(screen.getByTestId('output')).toHaveTextContent('a');
        
        // Advance time
        act(() => {
          jest.advanceTimersByTime(100);
        });
        
        await waitFor(() => {
          expect(screen.getByTestId('output')).toHaveTextContent('abc');
        });
        
        jest.useRealTimers();
      });
    });

    describe('useDebouncedValue', () => {
      it('should debounce value changes', async () => {
        jest.useFakeTimers();
        
        const TestComponent = () => {
          const [input, setInput] = React.useState('');
          const debouncedValue = useDebouncedValue(input, 200);
          
          return (
            <div>
              <input
                data-testid="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div data-testid="debounced">{debouncedValue}</div>
            </div>
          );
        };

        render(<TestComponent />);
        
        const input = screen.getByTestId('input');
        
        // Rapid updates
        fireEvent.change(input, { target: { value: 'h' } });
        fireEvent.change(input, { target: { value: 'he' } });
        fireEvent.change(input, { target: { value: 'hel' } });
        fireEvent.change(input, { target: { value: 'hell' } });
        fireEvent.change(input, { target: { value: 'hello' } });
        
        // Should not update immediately
        expect(screen.getByTestId('debounced')).toHaveTextContent('');
        
        // Advance time past debounce delay
        act(() => {
          jest.advanceTimersByTime(200);
        });
        
        await waitFor(() => {
          expect(screen.getByTestId('debounced')).toHaveTextContent('hello');
        });
        
        jest.useRealTimers();
      });
    });
  });

  describe('Lazy Loading Components', () => {
    it('should lazy load components on demand', async () => {
      const LazyTestComponent = LazyComponent(() => 
        Promise.resolve({
          default: () => <div data-testid="lazy-content">Lazy Loaded</div>
        })
      );

      render(
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyTestComponent />
        </React.Suspense>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
      });
    });

    it('should handle lazy loading errors', async () => {
      const LazyErrorComponent = LazyComponent(() => 
        Promise.reject(new Error('Failed to load'))
      );

      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        const [hasError, setHasError] = React.useState(false);
        
        React.useEffect(() => {
          const handleError = () => setHasError(true);
          window.addEventListener('error', handleError);
          return () => window.removeEventListener('error', handleError);
        }, []);
        
        if (hasError) {
          return <div data-testid="error">Error occurred</div>;
        }
        
        return <>{children}</>;
      };

      render(
        <ErrorBoundary>
          <React.Suspense fallback={<div>Loading...</div>}>
            <LazyErrorComponent />
          </React.Suspense>
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('error')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should demonstrate render optimization improvements', async () => {
      const UnoptimizedList = ({ items }: { items: any[] }) => {
        return (
          <div>
            {items.map((item, index) => (
              <div key={index}>
                <span>{item.field1}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        );
      };

      const OptimizedList = React.memo(({ items }: { items: any[] }) => {
        return (
          <VirtualScroll
            items={items}
            itemHeight={30}
            containerHeight={500}
            renderItem={(item: any, index: any) => (
              <div key={index}>
                <span>{item.field1}</span>
                <span>{item.value}</span>
              </div>
            )}
          />
        );
      });

      const largeDataset = MockData.generateLargeDataset(5000);

      // Measure unoptimized rendering
      Performance.startMeasure('unoptimized');
      const { unmount: unmountUnoptimized } = render(
        <UnoptimizedList items={largeDataset} />
      );
      const unoptimizedTime = Performance.endMeasure('unoptimized');
      unmountUnoptimized();

      // Measure optimized rendering
      Performance.startMeasure('optimized');
      const { unmount: unmountOptimized } = render(
        <OptimizedList items={largeDataset} />
      );
      const optimizedTime = Performance.endMeasure('optimized');
      unmountOptimized();

      // Optimized should be significantly faster
      Performance.assertPerformanceImprovement(
        unoptimizedTime,
        optimizedTime,
        0.5 // At least 50% improvement
      );
    });

    it('should minimize memory usage with virtualization', async () => {
      const items = MockData.generateLargeDataset(10000);
      
      // Regular list (all items in DOM)
      const RegularList = ({ items }: { items: any[] }) => (
        <div>
          {items.map((item, i) => (
            <div key={i}>{item.field1}</div>
          ))}
        </div>
      );

      // Virtual list (only visible items in DOM)
      const VirtualList = ({ items }: { items: any[] }) => (
        <VirtualScroll
          items={items}
          itemHeight={30}
          containerHeight={500}
          renderItem={(item: any, i: any) => <div key={i}>{item.field1}</div>}
        />
      );

      // This is a simplified memory test
      // In real scenarios, you'd use Chrome DevTools or similar
      const regularListElements = render(<RegularList items={items} />);
      const regularDOMNodes = regularListElements.container.querySelectorAll('div').length;
      regularListElements.unmount();

      const virtualListElements = render(<VirtualList items={items} />);
      const virtualDOMNodes = virtualListElements.container.querySelectorAll('div').length;
      virtualListElements.unmount();

      // Virtual list should have significantly fewer DOM nodes
      expect(virtualDOMNodes).toBeLessThan(regularDOMNodes / 10);
    });
  });
});