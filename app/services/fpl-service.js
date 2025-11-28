import { logInfo, logSuccess, logError } from '../utils/debug-logger'
import { monitoredFetchJSON } from '../utils/monitored-fetch'

export const fetchFPLData = async (teamId) => {
    try {
        logInfo(`Starting FPL data fetch for team ${teamId}`, { teamId })

        // Fetch in parallel where possible - using monitored fetch
        const [bootstrap, team, fixturesData] = await Promise.all([
            monitoredFetchJSON('/api/fpl/bootstrap', { cache: 'no-store' }, 20000, 1)
                .catch(err => {
                    logError('Failed to fetch bootstrap data', err, { teamId })
                    throw new Error(`Bootstrap data failed: ${err.message}`)
                }),
            monitoredFetchJSON(`/api/fpl/team/${teamId}`, { cache: 'no-store' }, 20000, 1)
                .catch(err => {
                    logError('Failed to fetch team data', err, { teamId })
                    throw new Error(`Team data failed: ${err.message}`)
                }),
            monitoredFetchJSON('/api/fpl/fixtures', { cache: 'no-store' }, 20000, 1)
                .catch(err => {
                    logError('Failed to fetch fixtures', err, { teamId })
                    throw new Error(`Fixtures data failed: ${err.message}`)
                })
        ])

        logSuccess('Core FPL data fetched successfully', {
            players: bootstrap.elements?.length,
            teams: bootstrap.teams?.length,
            fixtures: fixturesData?.length
        })

        // Fetch picks and history in parallel
        const [picks, history] = await Promise.all([
            monitoredFetchJSON(`/api/fpl/team/${teamId}/picks?gameweek=current`, { cache: 'no-store' }, 20000, 1)
                .catch(err => {
                    logError('Failed to fetch team picks', err, { teamId })
                    throw new Error(`Team picks failed: ${err.message}`)
                }),
            monitoredFetchJSON(`/api/fpl/team/${teamId}/history`, { cache: 'no-store' }, 20000, 1)
                .catch(err => {
                    logError('Failed to fetch team history', err, { teamId })
                    throw new Error(`Team history failed: ${err.message}`)
                })
        ])

        logSuccess('All FPL data fetched successfully', {
            teamId,
            squadSize: picks.picks?.length,
            historyEntries: history.current?.length
        })

        return {
            allPlayers: bootstrap.elements,
            allTeams: bootstrap.teams,
            myTeam: team,
            myPicks: picks,
            fixtures: fixturesData,
            myHistory: history
        }
    } catch (err) {
        logError('Critical error in fetchFPLData', err, { teamId })
        console.error('Error fetching data:', err)
        throw err
    }
}

export const getPlayerFixtures = (playerId, players, teams, upcomingFixtures) => {
    const player = players.find(p => p.id === playerId)
    if (!player) return []

    return upcomingFixtures
        .filter(f => f.team_h === player.team || f.team_a === player.team)
        .slice(0, 5)
        .map(f => {
            const isHome = f.team_h === player.team
            const opponentId = isHome ? f.team_a : f.team_h
            const opponent = teams.find(t => t.id === opponentId)
            const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty
            return {
                opponent: opponent?.short_name || 'TBD',
                difficulty,
                isHome,
                event: f.event
            }
        })
}

export const calculateLast3GameweeksPoints = async (playerIds) => {
    try {
        // Limit to top 15 players to reduce API calls significantly
        const limitedIds = playerIds.slice(0, 15)
        
        logInfo(`Calculating last 3 gameweeks for ${limitedIds.length} players`, {
            playerCount: limitedIds.length
        })

        // Fetch player histories in parallel with timeout
        const batchSize = 5 // Smaller batches to avoid overwhelming
        const results = {}

        for (let i = 0; i < limitedIds.length; i += batchSize) {
            const batch = limitedIds.slice(i, i + batchSize)
            const promises = batch.map(async (playerId) => {
                try {
                    const data = await monitoredFetchJSON(`/api/fpl/player/${playerId}`, { cache: 'no-store' }, 5000, 0)
                    
                    // Get last 3 gameweeks from history
                    const history = data.history || []
                    const last3 = history.slice(-3)
                    const totalPoints = last3.reduce((sum, gw) => sum + (gw.total_points || 0), 0)

                    return { playerId, points: totalPoints }
                } catch (err) {
                    // Silently fail for individual players - use approximation
                    logInfo(`Failed to fetch history for player ${playerId}`, { 
                        playerId, 
                        error: err.message 
                    })
                    return { playerId, points: null }
                }
            })

            const batchResults = await Promise.allSettled(promises)
            batchResults.forEach((result) => {
                if (result.status === 'fulfilled' && result.value) {
                    const { playerId, points } = result.value
                    results[playerId] = points
                }
            })

            // Small delay between batches to avoid rate limiting
            if (i + batchSize < limitedIds.length) {
                await new Promise(resolve => setTimeout(resolve, 200))
            }
        }

        const successCount = Object.keys(results).filter(k => results[k] !== null).length
        logSuccess(`Completed last 3 gameweeks calculation`, {
            total: limitedIds.length,
            successful: successCount,
            failed: limitedIds.length - successCount
        })

        return results
    } catch (err) {
        logError('Error calculating last 3 gameweeks', err)
        console.error('Error calculating last 3 gameweeks:', err)
        return {}
    }
}

