/**
 * Monitoring Dashboard Configuration
 * Real-time metrics visualization and dashboard management
 */

import { MetricsCollector, BusinessMetrics, TechnicalMetrics } from './metrics';
import { AlertManager, Alert, AlertSeverity } from './alerting';
import { HealthMonitor, SystemHealth } from './health';
import { APMCollector } from './apm';
import { EventEmitter } from 'events';

/**
 * Dashboard types
 */
export enum DashboardType {
  OVERVIEW = 'overview',
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  INFRASTRUCTURE = 'infrastructure',
  SECURITY = 'security',
  CUSTOM = 'custom',
}

/**
 * Dashboard widget types
 */
export enum WidgetType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  GAUGE = 'gauge',
  NUMBER = 'number',
  TABLE = 'table',
  HEATMAP = 'heatmap',
  ALERT_LIST = 'alert_list',
  LOG_VIEWER = 'log_viewer',
  TRACE_VIEWER = 'trace_viewer',
}

/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  metrics: string[];
  refreshInterval: number;
  timeRange: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
}

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
  id: string;
  name: string;
  type: DashboardType;
  description: string;
  widgets: DashboardWidget[];
  refreshInterval: number;
  timeRange: string;
  filters?: Record<string, any>;
  permissions: {
    view: string[];
    edit: string[];
  };
}

/**
 * Dashboard data point
 */
export interface DataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

/**
 * Time series data
 */
export interface TimeSeriesData {
  name: string;
  data: DataPoint[];
  unit?: string;
  color?: string;
}

/**
 * Dashboard manager
 */
export class DashboardManager {
  private static instance: DashboardManager;
  private dashboards: Map<string, DashboardConfig> = new Map();
  private widgetData: Map<string, any> = new Map();
  private dataEmitter = new EventEmitter();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  private metricsCollector: MetricsCollector;
  private alertManager: AlertManager;
  private healthMonitor: HealthMonitor;
  
  private constructor() {
    this.metricsCollector = MetricsCollector.getInstance();
    this.alertManager = AlertManager.getInstance();
    this.healthMonitor = HealthMonitor.getInstance();
    
    this.initializeDefaultDashboards();
    this.startDataCollection();
  }
  
  public static getInstance(): DashboardManager {
    if (!DashboardManager.instance) {
      DashboardManager.instance = new DashboardManager();
    }
    return DashboardManager.instance;
  }
  
  /**
   * Initialize default dashboards
   */
  private initializeDefaultDashboards(): void {
    // Overview Dashboard
    this.registerDashboard({
      id: 'overview',
      name: 'System Overview',
      type: DashboardType.OVERVIEW,
      description: 'High-level system health and performance overview',
      refreshInterval: 10000,
      timeRange: '1h',
      widgets: [
        {
          id: 'health-status',
          type: WidgetType.GAUGE,
          title: 'System Health',
          metrics: ['system.health'],
          refreshInterval: 10000,
          timeRange: 'realtime',
          position: { x: 0, y: 0, width: 3, height: 2 },
          config: {
            thresholds: [
              { value: 0, color: 'red', label: 'Unhealthy' },
              { value: 50, color: 'yellow', label: 'Degraded' },
              { value: 80, color: 'green', label: 'Healthy' },
            ],
          },
        },
        {
          id: 'active-users',
          type: WidgetType.NUMBER,
          title: 'Active Users',
          metrics: ['business.active_users'],
          refreshInterval: 30000,
          timeRange: 'realtime',
          position: { x: 3, y: 0, width: 3, height: 2 },
          config: {
            format: 'number',
            trend: true,
          },
        },
        {
          id: 'response-time',
          type: WidgetType.LINE_CHART,
          title: 'Response Time',
          metrics: ['performance.response_time_avg', 'performance.response_time_p95', 'performance.response_time_p99'],
          refreshInterval: 10000,
          timeRange: '1h',
          position: { x: 6, y: 0, width: 6, height: 3 },
          config: {
            yAxis: { label: 'Time (ms)' },
            xAxis: { label: 'Time' },
            showLegend: true,
          },
        },
        {
          id: 'error-rate',
          type: WidgetType.LINE_CHART,
          title: 'Error Rate',
          metrics: ['performance.error_rate'],
          refreshInterval: 10000,
          timeRange: '1h',
          position: { x: 0, y: 2, width: 6, height: 3 },
          config: {
            yAxis: { label: 'Rate (%)' },
            xAxis: { label: 'Time' },
            threshold: 5,
            thresholdColor: 'red',
          },
        },
        {
          id: 'active-alerts',
          type: WidgetType.ALERT_LIST,
          title: 'Active Alerts',
          metrics: ['alerts.active'],
          refreshInterval: 5000,
          timeRange: 'realtime',
          position: { x: 0, y: 5, width: 12, height: 3 },
          config: {
            maxItems: 10,
            showSeverity: true,
            showTime: true,
          },
        },
      ],
      permissions: {
        view: ['admin', 'developer', 'ops'],
        edit: ['admin'],
      },
    });
    
    // Performance Dashboard
    this.registerDashboard({
      id: 'performance',
      name: 'Performance Metrics',
      type: DashboardType.PERFORMANCE,
      description: 'Detailed performance metrics and analysis',
      refreshInterval: 5000,
      timeRange: '6h',
      widgets: [
        {
          id: 'throughput',
          type: WidgetType.LINE_CHART,
          title: 'Request Throughput',
          metrics: ['performance.throughput'],
          refreshInterval: 5000,
          timeRange: '1h',
          position: { x: 0, y: 0, width: 6, height: 3 },
          config: {
            yAxis: { label: 'Requests/min' },
            xAxis: { label: 'Time' },
          },
        },
        {
          id: 'latency-distribution',
          type: WidgetType.HEATMAP,
          title: 'Latency Distribution',
          metrics: ['performance.latency_distribution'],
          refreshInterval: 10000,
          timeRange: '1h',
          position: { x: 6, y: 0, width: 6, height: 3 },
          config: {
            buckets: [0, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
            colorScheme: 'blues',
          },
        },
        {
          id: 'db-performance',
          type: WidgetType.LINE_CHART,
          title: 'Database Performance',
          metrics: ['db.query_time_avg', 'db.query_time_p95', 'db.connection_pool'],
          refreshInterval: 10000,
          timeRange: '1h',
          position: { x: 0, y: 3, width: 6, height: 3 },
          config: {
            yAxis: { label: 'Time (ms) / Connections' },
            xAxis: { label: 'Time' },
            showLegend: true,
          },
        },
        {
          id: 'cache-performance',
          type: WidgetType.PIE_CHART,
          title: 'Cache Hit Rate',
          metrics: ['cache.hit_rate', 'cache.miss_rate'],
          refreshInterval: 30000,
          timeRange: '5m',
          position: { x: 6, y: 3, width: 3, height: 3 },
          config: {
            showPercentage: true,
            colors: ['green', 'red'],
          },
        },
        {
          id: 'memory-usage',
          type: WidgetType.GAUGE,
          title: 'Memory Usage',
          metrics: ['system.memory_usage'],
          refreshInterval: 5000,
          timeRange: 'realtime',
          position: { x: 9, y: 3, width: 3, height: 3 },
          config: {
            max: 100,
            unit: '%',
            thresholds: [
              { value: 0, color: 'green' },
              { value: 70, color: 'yellow' },
              { value: 90, color: 'red' },
            ],
          },
        },
      ],
      permissions: {
        view: ['admin', 'developer', 'ops'],
        edit: ['admin', 'ops'],
      },
    });
    
    // Business Dashboard
    this.registerDashboard({
      id: 'business',
      name: 'Business Metrics',
      type: DashboardType.BUSINESS,
      description: 'Business KPIs and user engagement metrics',
      refreshInterval: 60000,
      timeRange: '7d',
      widgets: [
        {
          id: 'revenue',
          type: WidgetType.NUMBER,
          title: 'Revenue (30d)',
          metrics: ['business.revenue'],
          refreshInterval: 300000,
          timeRange: '30d',
          position: { x: 0, y: 0, width: 3, height: 2 },
          config: {
            format: 'currency',
            prefix: '$',
            trend: true,
          },
        },
        {
          id: 'conversion-rate',
          type: WidgetType.NUMBER,
          title: 'Conversion Rate',
          metrics: ['business.conversion_rate'],
          refreshInterval: 300000,
          timeRange: '7d',
          position: { x: 3, y: 0, width: 3, height: 2 },
          config: {
            format: 'percentage',
            suffix: '%',
            trend: true,
          },
        },
        {
          id: 'user-growth',
          type: WidgetType.LINE_CHART,
          title: 'User Growth',
          metrics: ['business.new_users', 'business.active_users'],
          refreshInterval: 3600000,
          timeRange: '30d',
          position: { x: 6, y: 0, width: 6, height: 3 },
          config: {
            yAxis: { label: 'Users' },
            xAxis: { label: 'Date' },
            showLegend: true,
          },
        },
        {
          id: 'course-metrics',
          type: WidgetType.BAR_CHART,
          title: 'Course Performance',
          metrics: ['business.course_completions', 'business.course_enrollments'],
          refreshInterval: 3600000,
          timeRange: '7d',
          position: { x: 0, y: 2, width: 6, height: 3 },
          config: {
            yAxis: { label: 'Count' },
            xAxis: { label: 'Course' },
            grouped: true,
          },
        },
        {
          id: 'engagement-metrics',
          type: WidgetType.TABLE,
          title: 'Engagement Metrics',
          metrics: ['business.engagement_table'],
          refreshInterval: 300000,
          timeRange: '24h',
          position: { x: 6, y: 3, width: 6, height: 3 },
          config: {
            columns: ['Metric', 'Value', 'Change', 'Target'],
            sortable: true,
            pagination: true,
          },
        },
      ],
      permissions: {
        view: ['admin', 'product', 'marketing'],
        edit: ['admin'],
      },
    });
    
    // Infrastructure Dashboard
    this.registerDashboard({
      id: 'infrastructure',
      name: 'Infrastructure',
      type: DashboardType.INFRASTRUCTURE,
      description: 'Infrastructure health and resource utilization',
      refreshInterval: 10000,
      timeRange: '6h',
      widgets: [
        {
          id: 'cpu-usage',
          type: WidgetType.LINE_CHART,
          title: 'CPU Usage',
          metrics: ['system.cpu_usage'],
          refreshInterval: 5000,
          timeRange: '1h',
          position: { x: 0, y: 0, width: 6, height: 3 },
          config: {
            yAxis: { label: 'Usage (%)', max: 100 },
            xAxis: { label: 'Time' },
            fillArea: true,
          },
        },
        {
          id: 'memory-breakdown',
          type: WidgetType.BAR_CHART,
          title: 'Memory Breakdown',
          metrics: ['system.memory_heap', 'system.memory_rss', 'system.memory_external'],
          refreshInterval: 10000,
          timeRange: 'realtime',
          position: { x: 6, y: 0, width: 6, height: 3 },
          config: {
            yAxis: { label: 'Memory (MB)' },
            stacked: true,
          },
        },
        {
          id: 'disk-usage',
          type: WidgetType.PIE_CHART,
          title: 'Disk Usage',
          metrics: ['system.disk_used', 'system.disk_free'],
          refreshInterval: 60000,
          timeRange: 'realtime',
          position: { x: 0, y: 3, width: 4, height: 3 },
          config: {
            showPercentage: true,
            unit: 'GB',
          },
        },
        {
          id: 'network-io',
          type: WidgetType.LINE_CHART,
          title: 'Network I/O',
          metrics: ['system.network_in', 'system.network_out'],
          refreshInterval: 5000,
          timeRange: '1h',
          position: { x: 4, y: 3, width: 8, height: 3 },
          config: {
            yAxis: { label: 'Bandwidth (Mbps)' },
            xAxis: { label: 'Time' },
            showLegend: true,
          },
        },
        {
          id: 'service-health',
          type: WidgetType.TABLE,
          title: 'Service Health',
          metrics: ['infrastructure.service_health'],
          refreshInterval: 30000,
          timeRange: 'realtime',
          position: { x: 0, y: 6, width: 12, height: 3 },
          config: {
            columns: ['Service', 'Status', 'Response Time', 'Last Check'],
            colorCode: 'status',
          },
        },
      ],
      permissions: {
        view: ['admin', 'ops', 'developer'],
        edit: ['admin', 'ops'],
      },
    });
  }
  
  /**
   * Register a dashboard
   */
  public registerDashboard(config: DashboardConfig): void {
    this.dashboards.set(config.id, config);
    
    // Start data collection for widgets
    config.widgets.forEach(widget => {
      this.startWidgetDataCollection(widget);
    });
  }
  
  /**
   * Start data collection for a widget
   */
  private startWidgetDataCollection(widget: DashboardWidget): void {
    const intervalId = setInterval(async () => {
      const data = await this.collectWidgetData(widget);
      this.widgetData.set(widget.id, data);
      
      // Emit data update event
      this.dataEmitter.emit('widget_data_updated', {
        widgetId: widget.id,
        data,
        timestamp: new Date(),
      });
    }, widget.refreshInterval);
    
    this.updateIntervals.set(widget.id, intervalId);
    
    // Collect initial data
    this.collectWidgetData(widget).then(data => {
      this.widgetData.set(widget.id, data);
    });
  }
  
  /**
   * Collect data for a widget
   */
  private async collectWidgetData(widget: DashboardWidget): Promise<any> {
    switch (widget.type) {
      case WidgetType.LINE_CHART:
        return this.collectTimeSeriesData(widget.metrics, widget.timeRange);
        
      case WidgetType.BAR_CHART:
        return this.collectBarChartData(widget.metrics);
        
      case WidgetType.PIE_CHART:
        return this.collectPieChartData(widget.metrics);
        
      case WidgetType.GAUGE:
        return this.collectGaugeData(widget.metrics[0]);
        
      case WidgetType.NUMBER:
        return this.collectNumberData(widget.metrics[0]);
        
      case WidgetType.TABLE:
        return this.collectTableData(widget.metrics[0]);
        
      case WidgetType.HEATMAP:
        return this.collectHeatmapData(widget.metrics[0], widget.config);
        
      case WidgetType.ALERT_LIST:
        return this.collectAlertData();
        
      default:
        return null;
    }
  }
  
  /**
   * Collect time series data
   */
  private async collectTimeSeriesData(
    metrics: string[],
    timeRange: string
  ): Promise<TimeSeriesData[]> {
    const data: TimeSeriesData[] = [];
    
    for (const metric of metrics) {
      // Generate sample data (in production, fetch from metrics storage)
      const points: DataPoint[] = [];
      const now = Date.now();
      const interval = this.parseTimeRange(timeRange) / 100;
      
      for (let i = 0; i < 100; i++) {
        points.push({
          timestamp: new Date(now - (100 - i) * interval),
          value: Math.random() * 100,
        });
      }
      
      data.push({
        name: metric,
        data: points,
        unit: this.getMetricUnit(metric),
      });
    }
    
    return data;
  }
  
  /**
   * Collect bar chart data
   */
  private async collectBarChartData(metrics: string[]): Promise<any> {
    const categories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const series: any[] = [];
    
    for (const metric of metrics) {
      series.push({
        name: metric,
        data: categories.map(() => Math.random() * 100),
      });
    }
    
    return {
      categories,
      series,
    };
  }
  
  /**
   * Collect pie chart data
   */
  private async collectPieChartData(metrics: string[]): Promise<any> {
    const data: any[] = [];
    
    for (const metric of metrics) {
      data.push({
        name: metric,
        value: Math.random() * 100,
      });
    }
    
    return data;
  }
  
  /**
   * Collect gauge data
   */
  private async collectGaugeData(metric: string): Promise<number> {
    // In production, fetch actual metric value
    if (metric === 'system.health') {
      const health = this.healthMonitor.getSystemHealth();
      return health?.status === 'healthy' ? 100 : 
             health?.status === 'degraded' ? 50 : 0;
    }
    
    return Math.random() * 100;
  }
  
  /**
   * Collect number data
   */
  private async collectNumberData(metric: string): Promise<any> {
    const value = Math.random() * 1000;
    const previousValue = value * (0.8 + Math.random() * 0.4);
    
    return {
      value,
      previousValue,
      change: ((value - previousValue) / previousValue) * 100,
      trend: value > previousValue ? 'up' : 'down',
    };
  }
  
  /**
   * Collect table data
   */
  private async collectTableData(metric: string): Promise<any> {
    if (metric === 'business.engagement_table') {
      return {
        headers: ['Metric', 'Value', 'Change', 'Target'],
        rows: [
          ['Active Users', '1,234', '+12%', '1,500'],
          ['Session Duration', '25m', '+5%', '30m'],
          ['Pages per Session', '4.5', '-2%', '5.0'],
          ['Bounce Rate', '35%', '-3%', '30%'],
        ],
      };
    }
    
    if (metric === 'infrastructure.service_health') {
      const health = this.healthMonitor.getSystemHealth();
      return {
        headers: ['Service', 'Status', 'Response Time', 'Last Check'],
        rows: health?.dependencies.map(dep => [
          dep.name,
          dep.status,
          `${dep.responseTime.toFixed(2)}ms`,
          new Date(dep.lastChecked).toLocaleTimeString(),
        ]) || [],
      };
    }
    
    return { headers: [], rows: [] };
  }
  
  /**
   * Collect heatmap data
   */
  private async collectHeatmapData(metric: string, config: any): Promise<any> {
    const buckets = config.buckets || [0, 10, 50, 100, 500, 1000];
    const data: any[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      for (let bucket = 0; bucket < buckets.length - 1; bucket++) {
        data.push({
          hour,
          bucket: `${buckets[bucket]}-${buckets[bucket + 1]}ms`,
          count: Math.floor(Math.random() * 100),
        });
      }
    }
    
    return data;
  }
  
  /**
   * Collect alert data
   */
  private async collectAlertData(): Promise<Alert[]> {
    return this.alertManager.getActiveAlerts();
  }
  
  /**
   * Parse time range string
   */
  private parseTimeRange(timeRange: string): number {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));
    
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // Default 1 hour
    }
  }
  
  /**
   * Get metric unit
   */
  private getMetricUnit(metric: string): string {
    if (metric.includes('time')) return 'ms';
    if (metric.includes('rate')) return '%';
    if (metric.includes('memory')) return 'MB';
    if (metric.includes('cpu')) return '%';
    if (metric.includes('throughput')) return 'req/s';
    return '';
  }
  
  /**
   * Start data collection
   */
  private startDataCollection(): void {
    // Collect metrics every minute
    setInterval(async () => {
      const businessMetrics = await this.metricsCollector.collectBusinessMetrics();
      const technicalMetrics = await this.metricsCollector.collectTechnicalMetrics();
      
      // Emit metrics update
      this.dataEmitter.emit('metrics_updated', {
        business: businessMetrics,
        technical: technicalMetrics,
        timestamp: new Date(),
      });
    }, 60000);
  }
  
  /**
   * Get dashboard configuration
   */
  public getDashboard(id: string): DashboardConfig | undefined {
    return this.dashboards.get(id);
  }
  
  /**
   * Get all dashboards
   */
  public getAllDashboards(): DashboardConfig[] {
    return Array.from(this.dashboards.values());
  }
  
  /**
   * Get widget data
   */
  public getWidgetData(widgetId: string): any {
    return this.widgetData.get(widgetId);
  }
  
  /**
   * Get data emitter for real-time updates
   */
  public getDataEmitter(): EventEmitter {
    return this.dataEmitter;
  }
  
  /**
   * Create custom dashboard
   */
  public createCustomDashboard(
    name: string,
    widgets: DashboardWidget[],
    userId: string
  ): string {
    const dashboardId = `custom_${userId}_${Date.now()}`;
    
    this.registerDashboard({
      id: dashboardId,
      name,
      type: DashboardType.CUSTOM,
      description: `Custom dashboard created by user ${userId}`,
      widgets,
      refreshInterval: 30000,
      timeRange: '1h',
      permissions: {
        view: [userId],
        edit: [userId],
      },
    });
    
    return dashboardId;
  }
  
  /**
   * Export dashboard data
   */
  public async exportDashboardData(
    dashboardId: string,
    format: 'json' | 'csv'): Promise<string> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');
    
    const data: any = {
      dashboard: dashboard.name,
      exported: new Date().toISOString(),
      widgets: {},
    };
    
    for (const widget of dashboard.widgets) {
      data.widgets[widget.id] = this.widgetData.get(widget.id);
    }
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Convert to CSV format
      // Implementation would depend on specific data structure
      return 'CSV export not implemented';
    }
  }
  
  /**
   * Stop dashboard manager
   */
  public stop(): void {
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();
  }
}