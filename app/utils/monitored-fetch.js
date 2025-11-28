/**
 * Monitored Fetch Wrapper
 * Wraps fetch to automatically log all API calls
 */

import { logAPI, logAPISuccess, logAPIError } from './debug-logger'

/**
 * Enhanced fetch with automatic logging and error handling
 */
export const monitoredFetch = async (url, options = {}) => {
  const startTime = Date.now()
  const method = options.method || 'GET'
  
  // Log the request
  logAPI(url, method, {
    headers: options.headers,
    body: options.body,
    cache: options.cache
  })

  try {
    const response = await fetch(url, options)
    const duration = Date.now() - startTime

    if (!response.ok) {
      // Log failed response
      const errorText = await response.text().catch(() => 'Unable to read error response')
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      
      logAPIError(url, error, {
        status: response.status,
        statusText: response.statusText,
        duration,
        response: errorText
      })
      
      throw error
    }

    // Log success
    logAPISuccess(url, duration, {
      status: response.status,
      contentType: response.headers.get('content-type')
    })

    return response
  } catch (error) {
    const duration = Date.now() - startTime
    
    // Enhanced error information
    let errorDetails = {
      duration,
      type: error.name,
      isTimeout: error.name === 'AbortError',
      isNetworkError: error.message.includes('Failed to fetch'),
      isCORS: error.message.includes('CORS')
    }

    logAPIError(url, error, errorDetails)
    throw error
  }
}

/**
 * Fetch with timeout and retry
 */
export const fetchWithTimeoutAndRetry = async (
  url,
  options = {},
  timeout = 20000,
  maxRetries = 2
) => {
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      try {
        const response = await monitoredFetch(url, {
          ...options,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        return response
      } catch (error) {
        clearTimeout(timeoutId)
        
        if (error.name === 'AbortError') {
          lastError = new Error(`Request timed out after ${timeout}ms`)
          lastError.name = 'TimeoutError'
        } else {
          lastError = error
        }
        
        // If this is the last attempt, throw
        if (attempt === maxRetries) {
          throw lastError
        }
        
        // Wait before retrying (exponential backoff)
        const delay = 1000 * (attempt + 1)
        logAPI(url, 'RETRY', { 
          attempt: attempt + 1, 
          maxRetries, 
          delay,
          error: lastError.message 
        })
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error) {
      lastError = error
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Wait before retrying
      const delay = 1000 * (attempt + 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Monitored fetch that returns JSON directly
 * Includes timeout and retry logic
 */
export const monitoredFetchJSON = async (
  url,
  options = {},
  timeout = 20000,
  maxRetries = 2
) => {
  const response = await fetchWithTimeoutAndRetry(url, options, timeout, maxRetries)
  return await response.json()
}
