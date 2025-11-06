import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { teamId } = params
    const { searchParams } = new URL(request.url)
    const gameweek = searchParams.get('gameweek') || 'current'
    
    const commonHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://fantasy.premierleague.com/',
      'Origin': 'https://fantasy.premierleague.com',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    }

    // Fetch the current gameweek if not specified
    let gw = gameweek
    if (gameweek === 'current') {
      const bootstrapResponse = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
        headers: commonHeaders,
        cache: 'no-store',
      })
      const bootstrapData = await bootstrapResponse.json()
      const currentEvent = bootstrapData.events.find(e => e.is_current)
      gw = currentEvent ? currentEvent.id : bootstrapData.events.find(e => e.is_next).id
    }
    
    const response = await fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/event/${gw}/picks/`, {
      headers: commonHeaders,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`FPL API returned ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching team picks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team picks', message: error.message },
      { status: 500 }
    )
  }
}

