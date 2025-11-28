import { NextResponse } from 'next/server'
import https from 'https'

// Revalidate every 0 seconds (always fresh)
export const revalidate = 0

// Simple fetch wrapper using node-fetch-like behavior
async function fetchWithAgent(url, options = {}) {
  const https = await import('https')
  const http = await import('http')
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const protocol = urlObj.protocol === 'https:' ? https : http
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      rejectUnauthorized: false
    }
    
    const req = protocol.request(requestOptions, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: async () => JSON.parse(data),
          text: async () => data
        })
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    if (options.timeout) {
      req.setTimeout(options.timeout, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })
    }
    
    req.end()
  })
}

export async function GET() {
  try {
    const response = await fetchWithAgent('https://fantasy.premierleague.com/api/fixtures/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 30000
    })

    if (!response.ok) {
      throw new Error(`FPL API returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Fixtures API error:', error)
    
    return NextResponse.json({
      error: error.message || 'Failed to fetch fixtures',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  }
}
