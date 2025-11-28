/**
 * Centralized Debug Logger
 * Tracks all API calls, errors, and app state changes
 */

class DebugLogger {
  constructor() {
    this.logs = []
    this.maxLogs = 100
    this.listeners = new Set()
  }

  /**
   * Add a log entry
   */
  log(type, message, data = null, error = null) {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type, // 'api', 'error', 'info', 'warn', 'success'
      message,
      data,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    }

    this.logs.unshift(entry)
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Notify listeners
    this.notifyListeners()

    // Also log to console for immediate debugging
    const emoji = {
      api: '🔌',
      error: '❌',
      info: 'ℹ️',
      warn: '⚠️',
      success: '✅'
    }[type] || '📝'

    if (type === 'error') {
      console.error(`${emoji} ${message}`, data, error)
    } else if (type === 'warn') {
      console.warn(`${emoji} ${message}`, data)
    } else {
      console.log(`${emoji} ${message}`, data)
    }

    return entry
  }

  /**
   * Subscribe to log updates
   */
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.logs)
      } catch (err) {
        console.error('Error in debug logger listener:', err)
      }
    })
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs
  }

  /**
   * Clear logs
   */
  clear() {
    this.logs = []
    this.notifyListeners()
  }

  /**
   * Get logs by type
   */
  getLogsByType(type) {
    return this.logs.filter(log => log.type === type)
  }

  /**
   * Get error logs
   */
  getErrors() {
    return this.logs.filter(log => log.type === 'error')
  }

  /**
   * Export logs as JSON
   */
  export() {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Singleton instance
export const debugLogger = new DebugLogger()

// Helper functions for common logging patterns
export const logAPI = (url, method = 'GET', data = null) => {
  return debugLogger.log('api', `API ${method}: ${url}`, data)
}

export const logAPISuccess = (url, duration, data = null) => {
  return debugLogger.log('success', `API Success: ${url} (${duration}ms)`, data)
}

export const logAPIError = (url, error, data = null) => {
  return debugLogger.log('error', `API Error: ${url}`, data, error)
}

export const logError = (message, error, context = null) => {
  return debugLogger.log('error', message, context, error)
}

export const logWarn = (message, data = null) => {
  return debugLogger.log('warn', message, data)
}

export const logInfo = (message, data = null) => {
  return debugLogger.log('info', message, data)
}

export const logSuccess = (message, data = null) => {
  return debugLogger.log('success', message, data)
}
