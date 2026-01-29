/**
 * Tests for SystemHealthClient component
 */

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock framer-motion to render children directly
jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...filterDomProps(props)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock date-fns
jest.mock("date-fns", () => ({
  formatDistanceToNow: jest.fn(() => "less than a minute ago"),
}));

/** Filter out non-DOM props that framer-motion would normally consume */
function filterDomProps(props: Record<string, unknown>) {
  const domSafe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      ![
        "variants",
        "initial",
        "animate",
        "exit",
        "whileHover",
        "whileTap",
        "layout",
        "transition",
      ].includes(key)
    ) {
      domSafe[key] = value;
    }
  }
  return domSafe;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

function makeHealthyData() {
  return {
    status: "healthy" as const,
    healthScore: 95,
    timestamp: new Date().toISOString(),
    uptime: 86400 + 3600 + 120, // 1d 1h 2m
    services: {
      database: { status: "up" as const, responseTime: 5 },
      redis: { status: "not_configured" as const },
      samAI: {
        status: "initialized" as const,
        circuitBreaker: "closed",
        adapterSource: "anthropic",
      },
      embedding: { status: "initialized" as const },
    },
    database: {
      totalQueries: 1500,
      errorCount: 2,
      errorRate: 0.13,
      latency: { p50: 3, p95: 15, p99: 25, avg: 5, max: 50 },
    },
    api: {
      stats: {
        count: 300,
        min: 1,
        max: 400,
        avg: 30,
        p50: 20,
        p95: 100,
        p99: 250,
      },
      slowOperations: [],
    },
    memory: {
      heapUsed: 120.5,
      heapTotal: 256,
      rss: 350,
      heapUsagePercent: 47.07,
    },
    cache: { size: 42, maxSize: 1000 },
    rateLimiting: {
      totalBuckets: 3,
      bucketsByCategory: { "sam:standard": 2, "sam:ai": 1 },
    },
    environment: {
      nodeEnv: "development",
      platform: "darwin",
      version: "1.0.0",
    },
    samHealth: {
      healthScore: 92,
      components: [
        {
          name: "orchestrator",
          status: "healthy" as const,
          errorRate: 0.1,
          latencyMs: 45,
        },
        {
          name: "memory",
          status: "healthy" as const,
          errorRate: 0,
          latencyMs: 12,
        },
      ],
      alerts: [],
      metrics: {
        activeConnections: 8,
        memoryUsageMb: 256.5,
        errorRate: 0.5,
        latencyP50Ms: 30,
        latencyP95Ms: 120,
      },
    },
    syntheticMonitor: {
      status: "healthy" as const,
      totalResponseTime: 120,
      services: {
        database: { status: "healthy", error: null },
        posts: { status: "healthy", count: 1, error: null },
        courses: { status: "healthy", count: 1, error: null },
      },
      performance: { averageResponseTime: 40, status: "good" as const },
    },
    recommendations: ["All systems are operating normally."],
  };
}

function mockFetchSuccess(data = makeHealthyData()) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data }),
  }) as jest.Mock;
}

function mockFetchError(statusCode = 500) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: statusCode,
    json: () =>
      Promise.resolve({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Server error" },
      }),
  }) as jest.Mock;
}

// ---------------------------------------------------------------------------
// Import the component under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { SystemHealthClient } from "@/app/dashboard/admin/system-health/_components/SystemHealthClient";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SystemHealthClient", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---- Loading / error states ----

  it("shows loading skeleton initially", () => {
    // Never resolve the fetch
    global.fetch = jest.fn().mockReturnValue(
      new Promise(() => {})
    ) as jest.Mock;

    render(<SystemHealthClient />);

    // Header text should NOT appear during loading (skeleton is shown)
    expect(
      screen.queryByText("System Health & Performance")
    ).not.toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    mockFetchError();

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load system health data")
      ).toBeInTheDocument();
    });

    expect(screen.getByText("HTTP 500")).toBeInTheDocument();
  });

  it("shows retry button on error", async () => {
    mockFetchError();

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  // ---- Successful rendering ----

  it("renders header after successful fetch", async () => {
    mockFetchSuccess();

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(
        screen.getByText("System Health & Performance")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Real-time monitoring of all platform services")
    ).toBeInTheDocument();
  });

  it("renders overall status banner", async () => {
    mockFetchSuccess();

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(screen.getByText("Healthy")).toBeInTheDocument();
    });

    // Score shown in gauge
    expect(screen.getByText("95")).toBeInTheDocument();
    expect(screen.getByText("Development")).toBeInTheDocument();
  });

  it("renders service health cards", async () => {
    mockFetchSuccess();

    render(<SystemHealthClient />);

    await waitFor(() => {
      // "Database" appears both as a service card and tab trigger
      // Use getAllByText to verify at least one of each exists
      const databaseTexts = screen.getAllByText("Database");
      expect(databaseTexts.length).toBeGreaterThanOrEqual(2); // card + tab
    });

    expect(screen.getByText("Cache / Redis")).toBeInTheDocument();
    expect(screen.getByText("SAM AI")).toBeInTheDocument();
    expect(screen.getByText("Embedding")).toBeInTheDocument();
  });

  it("renders performance metrics cards", async () => {
    mockFetchSuccess();

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(screen.getByText("Avg Response Time")).toBeInTheDocument();
    });

    expect(screen.getByText("P95 Latency")).toBeInTheDocument();
    // "Total Queries" appears in both performance cards and database tab
    expect(screen.getAllByText("Total Queries").length).toBeGreaterThanOrEqual(
      1
    );
    // "Error Rate" appears in performance card, database tab stats, and database tab progress bar
    expect(screen.getAllByText("Error Rate").length).toBeGreaterThanOrEqual(1);
  });

  it("renders recommendations section", async () => {
    mockFetchSuccess();

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(screen.getByText("Recommendations")).toBeInTheDocument();
    });

    expect(
      screen.getByText("All systems are operating normally.")
    ).toBeInTheDocument();
  });

  // ---- Tab content ----

  it("renders tab triggers for all 6 tabs", async () => {
    mockFetchSuccess();

    render(<SystemHealthClient />);

    // Wait for the tablist to appear
    await waitFor(() => {
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    const tablist = screen.getByRole("tablist");
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs).toHaveLength(6);

    // Verify specific tab names exist
    expect(
      within(tablist).getByRole("tab", { name: /API Perf/i })
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: /Memory/i })
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: /Rate Limiting/i })
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: /SAM Health/i })
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: /Synthetic/i })
    ).toBeInTheDocument();
  });

  it("shows database tab content by default", async () => {
    mockFetchSuccess();

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(screen.getByText("Database Metrics")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Query performance and connection pool health")
    ).toBeInTheDocument();
  });

  // ---- Null SAM / Synthetic data ----

  it("handles null samHealth gracefully", async () => {
    const user = userEvent.setup();
    const data = makeHealthyData();
    data.samHealth = null;
    mockFetchSuccess(data);

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(
        screen.getByText("System Health & Performance")
      ).toBeInTheDocument();
    });

    // Click SAM Health tab using userEvent for proper Radix UI interaction
    const samTab = screen.getByRole("tab", { name: /SAM Health/i });
    await user.click(samTab);

    await waitFor(() => {
      expect(
        screen.getByText(
          "SAM telemetry is not available. The service may not be initialized."
        )
      ).toBeInTheDocument();
    });
  });

  it("handles null syntheticMonitor gracefully", async () => {
    const user = userEvent.setup();
    const data = makeHealthyData();
    data.syntheticMonitor = null;
    mockFetchSuccess(data);

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(
        screen.getByText("System Health & Performance")
      ).toBeInTheDocument();
    });

    // Click Synthetic tab
    const syntheticTab = screen.getByRole("tab", { name: /Synthetic/i });
    await user.click(syntheticTab);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Synthetic monitoring data is unavailable. The monitor may have timed out or encountered an error."
        )
      ).toBeInTheDocument();
    });
  });

  // ---- Refresh controls ----

  it("renders refresh interval selector", async () => {
    mockFetchSuccess();

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(screen.getByText("15s")).toBeInTheDocument();
    });

    expect(screen.getByText("30s")).toBeInTheDocument();
    expect(screen.getByText("60s")).toBeInTheDocument();
    expect(screen.getByText("Off")).toBeInTheDocument();
  });

  it("renders manual refresh button", async () => {
    mockFetchSuccess();

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });
  });

  it("calls fetch again on manual refresh", async () => {
    const user = userEvent.setup();
    mockFetchSuccess();

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });

    // Reset fetch call count after initial load
    (global.fetch as jest.Mock).mockClear();
    mockFetchSuccess();

    const refreshBtn = screen.getByText("Refresh");
    await user.click(refreshBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/system-health",
        expect.objectContaining({ cache: "no-store" })
      );
    });
  });

  // ---- Degraded / unhealthy status ----

  it("renders degraded status correctly", async () => {
    const data = makeHealthyData();
    data.status = "degraded";
    data.healthScore = 65;
    mockFetchSuccess(data);

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(screen.getByText("Degraded")).toBeInTheDocument();
    });

    expect(screen.getByText("65")).toBeInTheDocument();
  });

  it("renders unhealthy status correctly", async () => {
    const data = makeHealthyData();
    data.status = "unhealthy";
    data.healthScore = 30;
    mockFetchSuccess(data);

    render(<SystemHealthClient />);

    await waitFor(() => {
      expect(screen.getByText("Unhealthy")).toBeInTheDocument();
    });

    expect(screen.getByText("30")).toBeInTheDocument();
  });

  // ---- Uptime formatting ----

  it("formats uptime with days, hours, minutes", async () => {
    mockFetchSuccess();

    render(<SystemHealthClient />);

    await waitFor(() => {
      // 86400 + 3600 + 120 = 1d 1h 2m
      expect(screen.getByText("1d 1h 2m")).toBeInTheDocument();
    });
  });
});
