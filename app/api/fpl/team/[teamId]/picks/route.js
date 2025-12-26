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

export async function GET(request, { params }) {
  try {
    const { teamId } = params
    const { searchParams } = new URL(request.url)
    let gameweek = searchParams.get('gameweek')

    // If gameweek is 'current', try to get from bootstrap cache or default to 1
    if (gameweek === 'current') {
      try {
        const bootstrapRes = await fetchWithAgent('https://fantasy.premierleague.com/api/bootstrap-static/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json'
          },
          timeout: 5000
        })

        if (bootstrapRes.ok) {
          const bootstrap = await bootstrapRes.json()
          const currentEvent = bootstrap.events.find(e => e.is_current)
          gameweek = currentEvent ? currentEvent.id : 1
        } else {
          gameweek = 1
        }
      } catch (err) {
        // If bootstrap fetch fails or times out, default to gameweek 1
        gameweek = 1
      }
    }

    const response = await fetchWithAgent(
      `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gameweek}/picks/`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    )

    // Handle 404 (picks not available for this gameweek yet)
    if (response.status === 404 && gameweek > 1) {
      console.log(`Picks for GW${gameweek} not found. Falling back to GW${gameweek - 1}`)

      const fallbackResponse = await fetchWithAgent(
        `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gameweek - 1}/picks/`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      )

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json()
        return NextResponse.json({
          ...data,
          _is_fallback: true,
          _fallback_gameweek: gameweek - 1,
          _original_gameweek: gameweek
        }, {
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        })
      }
    }

    if (!response.ok) {
      // Return a 404 instead of a 500 if the FPL API returned 404
      if (response.status === 404) {
        return NextResponse.json({
          error: 'Picks not found for this gameweek',
          gameweek,
          teamId
        }, { status: 404 })
      }
      throw new Error(`FPL API returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Picks API error:', error)

    return NextResponse.json({
      error: error.message || 'Failed to fetch picks data',
      teamId: params.teamId,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  }
}
