import { NextResponse } from 'next/server'

// Revalidate every 1 minute for picks (can change frequently during transfers)
export const revalidate = 60

export async function GET(request, { params }) {
  try {
    const { teamId } = params
    const { searchParams } = new URL(request.url)
    let gameweek = searchParams.get('gameweek')

    // If gameweek is 'current', fetch bootstrap to get current gameweek
    if (gameweek === 'current') {
      const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        next: { revalidate: 60 }
      })
      
      if (bootstrapRes.ok) {
        const bootstrap = await bootstrapRes.json()
        const currentEvent = bootstrap.events.find(e => e.is_current)
        gameweek = currentEvent ? currentEvent.id : 1
      } else {
        gameweek = 1
      }
    }

    const response = await fetch(
      `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gameweek}/picks/`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://fantasy.premierleague.com/',
          'Origin': 'https://fantasy.premierleague.com',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        },
        next: { revalidate: 60 }
      }
    )

    if (!response.ok) {
      throw new Error(`FPL API returned ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    })
  } catch (error) {
    console.error('Picks API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch picks data' },
      { status: 500 }
    )
  }
}
