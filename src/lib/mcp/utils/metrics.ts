"use client";

import { logger, LogLevel } from "./logger";

// Define metric types
export enum MetricType {
  // Server metrics
  SERVER_CONNECTION_COUNT = "server_connection_count",
  SERVER_UPTIME = "server_uptime",
  SERVER_RECONNECT_COUNT = "server_reconnect_count",
  
  // Operation metrics
  TOOL_EXECUTION_COUNT = "tool_execution_count",
  TOOL_EXECUTION_TIME = "tool_execution_time",
  RESOURCE_QUERY_COUNT = "resource_query_count",
  RESOURCE_QUERY_TIME = "resource_query_time",
  PROMPT_RENDERING_COUNT = "prompt_rendering_count",
  PROMPT_RENDERING_TIME = "prompt_rendering_time",
  
  // Error metrics
  ERROR_COUNT = "error_count",
  ERROR_BY_TYPE = "error_by_type",
  
  // WebSocket metrics
  WEBSOCKET_MESSAGE_COUNT = "websocket_message_count",
  WEBSOCKET_MESSAGE_SIZE = "websocket_message_size",
  
  // API metrics
  API_REQUEST_COUNT = "api_request_count",
  API_REQUEST_TIME = "api_request_time",
}

// Metric data interface
export interface MetricData {
  type: MetricType;
  value: number;
  timestamp: Date;
  serverId?: string;
  tags?: Record<string, string>;
}

/**
 * MCP Metrics utility
 * Provides a way to track metrics for MCP operations
 */
export class MCPMetrics {
  private static instance: MCPMetrics;
  private metrics: MetricData[] = [];
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private maxMetricEntries: number = 10000;
  private listeners: Array<(metric: MetricData) => void> = [];
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  /**
   * Get the singleton instance of MCPMetrics
   */
  public static getInstance(): MCPMetrics {
    if (!MCPMetrics.instance) {
      MCPMetrics.instance = new MCPMetrics();
    }
    return MCPMetrics.instance;
  }
  
  /**
   * Record a metric
   */
  public recordMetric(
    type: MetricType,
    value: number,
    serverId?: string,
    tags?: Record<string, string>
  ): void {
    const metric: MetricData = {
      type,
      value,
      timestamp: new Date(),
      serverId,
      tags,
    };
    
    // Add to metrics array
    this.metrics.push(metric);
    
    // Trim metrics if necessary
    this.trimMetrics();
    
    // Update counters, gauges, or histograms based on metric type
    this.updateMetricStore(metric);
    
    // Notify listeners
    this.notifyListeners(metric);
    
    // Log metric at debug level
    logger.debug(
      `Metric recorded: ${type}`,
      { value, tags },
      serverId,
      "metrics"
    );
  }
  
  /**
   * Increment a counter metric
   */
  public incrementCounter(
    type: MetricType,
    increment: number = 1,
    serverId?: string,
    tags?: Record<string, string>
  ): void {
    // Create counter key
    const key = this.createMetricKey(type, serverId, tags);
    
    // Get current value or initialize to 0
    const currentValue = this.counters.get(key) || 0;
    
    // Increment counter
    const newValue = currentValue + increment;
    this.counters.set(key, newValue);
    
    // Record metric
    this.recordMetric(type, newValue, serverId, tags);
  }
  
  /**
   * Set a gauge metric
   */
  public setGauge(
    type: MetricType,
    value: number,
    serverId?: string,
    tags?: Record<string, string>
  ): void {
    // Create gauge key
    const key = this.createMetricKey(type, serverId, tags);
    
    // Set gauge value
    this.gauges.set(key, value);
    
    // Record metric
    this.recordMetric(type, value, serverId, tags);
  }
  
  /**
   * Record a histogram value
   */
  public recordHistogram(
    type: MetricType,
    value: number,
    serverId?: string,
    tags?: Record<string, string>
  ): void {
    // Create histogram key
    const key = this.createMetricKey(type, serverId, tags);
    
    // Get current values or initialize to empty array
    const values = this.histograms.get(key) || [];
    
    // Add value to histogram
    values.push(value);
    
    // Keep only the last 100 values in the histogram
    if (values.length > 100) {
      values.shift();
    }
    
    // Update histogram
    this.histograms.set(key, values);
    
    // Record metric
    this.recordMetric(type, value, serverId, tags);
  }
  
  /**
   * Get all metrics
   */
  public getMetrics(): MetricData[] {
    return [...this.metrics];
  }
  
  /**
   * Get metrics by type
   */
  public getMetricsByType(type: MetricType): MetricData[] {
    return this.metrics.filter(metric => metric.type === type);
  }
  
  /**
   * Get metrics by server
   */
  public getMetricsByServer(serverId: string): MetricData[] {
    return this.metrics.filter(metric => metric.serverId === serverId);
  }
  
  /**
   * Get counter value
   */
  public getCounter(
    type: MetricType,
    serverId?: string,
    tags?: Record<string, string>
  ): number {
    const key = this.createMetricKey(type, serverId, tags);
    return this.counters.get(key) || 0;
  }
  
  /**
   * Get gauge value
   */
  public getGauge(
    type: MetricType,
    serverId?: string,
    tags?: Record<string, string>
  ): number {
    const key = this.createMetricKey(type, serverId, tags);
    return this.gauges.get(key) || 0;
  }
  
  /**
   * Get histogram values
   */
  public getHistogram(
    type: MetricType,
    serverId?: string,
    tags?: Record<string, string>
  ): number[] {
    const key = this.createMetricKey(type, serverId, tags);
    return [...(this.histograms.get(key) || [])];
  }
  
  /**
   * Get histogram statistics
   */
  public getHistogramStats(
    type: MetricType,
    serverId?: string,
    tags?: Record<string, string>
  ): {
    count: number;
    min: number;
    max: number;
    avg: number;
    median: number;
    p95: number;
    p99: number;
  } {
    const values = this.getHistogram(type, serverId, tags);
    
    if (values.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        median: 0,
        p95: 0,
        p99: 0,
      };
    }
    
    // Sort values for percentile calculations
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      median: this.getPercentile(sorted, 50),
      p95: this.getPercentile(sorted, 95),
      p99: this.getPercentile(sorted, 99),
    };
  }
  
  /**
   * Add a metric listener
   */
  public addListener(listener: (metric: MetricData) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a metric listener
   */
  public removeListener(listener: (metric: MetricData) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Reset all metrics
   */
  public resetMetrics(): void {
    this.metrics = [];
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
  
  /**
   * Timing utility for measuring operation durations
   */
  public async timing<T>(
    type: MetricType,
    operation: () => Promise<T>,
    serverId?: string,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      return await operation();
    } finally {
      const duration = performance.now() - startTime;
      this.recordHistogram(type, duration, serverId, tags);
    }
  }
  
  /**
   * Create a metric key for maps
   */
  private createMetricKey(
    type: MetricType,
    serverId?: string,
    tags?: Record<string, string>
  ): string {
    let key = String(type);
    
    if (serverId) {
      key += `:${serverId}`;
    }
    
    if (tags) {
      const tagString = Object.entries(tags)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([k, v]) => `${k}=${v}`)
        .join(",");
      
      if (tagString) {
        key += `:${tagString}`;
      }
    }
    
    return key;
  }
  
  /**
   * Update the appropriate metric store based on metric type
   */
  private updateMetricStore(metric: MetricData): void {
    // Handle based on metric type
    switch (metric.type) {
      // These are cumulative counters
      case MetricType.TOOL_EXECUTION_COUNT:
      case MetricType.RESOURCE_QUERY_COUNT:
      case MetricType.PROMPT_RENDERING_COUNT:
      case MetricType.ERROR_COUNT:
      case MetricType.WEBSOCKET_MESSAGE_COUNT:
      case MetricType.API_REQUEST_COUNT:
      case MetricType.SERVER_CONNECTION_COUNT:
      case MetricType.SERVER_RECONNECT_COUNT:
        // Already handled by incrementCounter
        break;
      
      // These are gauges
      case MetricType.SERVER_UPTIME:
        // Already handled by setGauge
        break;
      
      // These are histograms
      case MetricType.TOOL_EXECUTION_TIME:
      case MetricType.RESOURCE_QUERY_TIME:
      case MetricType.PROMPT_RENDERING_TIME:
      case MetricType.API_REQUEST_TIME:
      case MetricType.WEBSOCKET_MESSAGE_SIZE:
        // Already handled by recordHistogram
        break;
      
      default:
        // For unknown metric types, do nothing special
        break;
    }
  }
  
  /**
   * Calculate a percentile from sorted values
   */
  private getPercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) {
      return 0;
    }
    
    if (sortedValues.length === 1) {
      return sortedValues[0];
    }
    
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      // This should always be defined since we check array length above
      return sortedValues[lower] ?? 0;
    }
    
    // Ensure we have defaults in case of unexpected issues
    const lowerValue = sortedValues[lower] ?? 0;
    const upperValue = sortedValues[upper] ?? 0;
    
    return lowerValue + (index - lower) * (upperValue - lowerValue);
  }
  
  /**
   * Trim metrics to maximum size
   */
  private trimMetrics(): void {
    if (this.metrics.length > this.maxMetricEntries) {
      this.metrics = this.metrics.slice(this.metrics.length - this.maxMetricEntries);
    }
  }
  
  /**
   * Notify all listeners of a new metric
   */
  private notifyListeners(metric: MetricData): void {
    this.listeners.forEach(listener => {
      try {
        listener(metric);
      } catch (error) {
        console.error("Error in metric listener:", error);
      }
    });
  }
}

// Export a singleton instance
export const metrics = MCPMetrics.getInstance();