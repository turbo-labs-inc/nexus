"use client";

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Define a log entry structure
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  serverId?: string;
  context?: string;
}

/**
 * MCP Logger utility
 * Provides a centralized logging system for MCP operations
 */
export class MCPLogger {
  private static instance: MCPLogger;
  private logs: LogEntry[] = [];
  private logLevel: LogLevel = LogLevel.INFO;
  private maxLogEntries: number = 1000;
  private listeners: Array<(entry: LogEntry) => void> = [];
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  /**
   * Get the singleton instance of MCPLogger
   */
  public static getInstance(): MCPLogger {
    if (!MCPLogger.instance) {
      MCPLogger.instance = new MCPLogger();
    }
    return MCPLogger.instance;
  }
  
  /**
   * Set the minimum log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
  
  /**
   * Set the maximum number of log entries to keep
   */
  public setMaxLogEntries(max: number): void {
    this.maxLogEntries = max;
    this.trimLogs();
  }
  
  /**
   * Add a log entry
   * @param level Log level
   * @param message Log message
   * @param data Additional data
   * @param serverId Optional server ID
   * @param context Optional context string
   */
  public log(
    level: LogLevel,
    message: string,
    data?: any,
    serverId?: string,
    context?: string
  ): void {
    // Skip if below current log level
    if (level < this.logLevel) {
      return;
    }
    
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      serverId,
      context,
    };
    
    // Add to logs array
    this.logs.push(entry);
    
    // Trim logs if necessary
    this.trimLogs();
    
    // Notify listeners
    this.notifyListeners(entry);
    
    // Also log to console
    this.logToConsole(entry);
  }
  
  /**
   * Log a debug message
   */
  public debug(
    message: string,
    data?: any,
    serverId?: string,
    context?: string
  ): void {
    this.log(LogLevel.DEBUG, message, data, serverId, context);
  }
  
  /**
   * Log an info message
   */
  public info(
    message: string,
    data?: any,
    serverId?: string,
    context?: string
  ): void {
    this.log(LogLevel.INFO, message, data, serverId, context);
  }
  
  /**
   * Log a warning message
   */
  public warn(
    message: string,
    data?: any,
    serverId?: string,
    context?: string
  ): void {
    this.log(LogLevel.WARN, message, data, serverId, context);
  }
  
  /**
   * Log an error message
   */
  public error(
    message: string,
    data?: any,
    serverId?: string,
    context?: string
  ): void {
    this.log(LogLevel.ERROR, message, data, serverId, context);
  }
  
  /**
   * Get all logs
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }
  
  /**
   * Get logs filtered by server ID
   */
  public getLogsByServer(serverId: string): LogEntry[] {
    return this.logs.filter(entry => entry.serverId === serverId);
  }
  
  /**
   * Get logs filtered by minimum level
   */
  public getLogsByLevel(minLevel: LogLevel): LogEntry[] {
    return this.logs.filter(entry => entry.level >= minLevel);
  }
  
  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }
  
  /**
   * Add a log listener
   */
  public addListener(listener: (entry: LogEntry) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a log listener
   */
  public removeListener(listener: (entry: LogEntry) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Trim logs to maximum size
   */
  private trimLogs(): void {
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(this.logs.length - this.maxLogEntries);
    }
  }
  
  /**
   * Notify all listeners of a new log entry
   */
  private notifyListeners(entry: LogEntry): void {
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        console.error("Error in log listener:", error);
      }
    });
  }
  
  /**
   * Log to console
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const serverInfo = entry.serverId ? `[Server: ${entry.serverId}]` : "";
    const contextInfo = entry.context ? `[${entry.context}]` : "";
    const prefix = `${timestamp} ${this.getLevelLabel(entry.level)} ${serverInfo} ${contextInfo}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${entry.message}`, entry.data || "");
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${entry.message}`, entry.data || "");
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${entry.message}`, entry.data || "");
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${entry.message}`, entry.data || "");
        break;
    }
  }
  
  /**
   * Get label for log level
   */
  private getLevelLabel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "[DEBUG]";
      case LogLevel.INFO:
        return "[INFO]";
      case LogLevel.WARN:
        return "[WARN]";
      case LogLevel.ERROR:
        return "[ERROR]";
      default:
        return "[UNKNOWN]";
    }
  }
}

// Export a singleton instance
export const logger = MCPLogger.getInstance();