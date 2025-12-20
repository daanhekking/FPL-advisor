import { getPlayerFixtures } from './fpl-service'
import {
    selectOptimalStarting11,
    selectOptimalStarting15,
    selectCaptainAndVice,
    generateTransferSuggestions as unifiedGenerateTransfers,
    determineTransferCount
} from './unified-fpl-algorithm'

// Note: calculateHybridScore has been deprecated
// The unified algorithm now handles all scoring via calculateBasePerformanceScore
// Keeping this as a stub for backwards compatibility during migration
export const calculateHybridScore = (player, fixtures) => {
    console.warn('calculateHybridScore is deprecated. Use unified-fpl-algorithm instead.')
    // Basic fallback scoring for any legacy code
    const form = parseFloat(player.form || 0)
    const ppg = parseFloat(player.points_per_game || 0)
    return (form * 2.0) + (ppg * 2.0)
}

export const generateRecommendations = (picks, players, teams, fixtures, seed = 0, fixtureWindow = 5, last3PointsData = {}, userInputTransfers = null, targetGW = null, useBenchBoost = false) => {
    const myPlayerIds = picks.picks.map(p => p.element)
    const myPlayerData = myPlayerIds.map(id => {
        const player = players.find(p => p.id === id)
        const pick = picks.picks.find(p => p.element === id)
        return { ...player, pick }
    }).filter(p => p && p.id)

    // Filter fixtures based on targetGW
    let upcomingFixtures = fixtures.filter(f => !f.finished_provisional)
    if (targetGW) {
        upcomingFixtures = upcomingFixtures.filter(f => f.event >= targetGW)
    }
    upcomingFixtures = upcomingFixtures.slice(0, 50)

    const budget = (picks.entry_history?.bank || 0) / 10

    // Create fixture lookup function for unified algorithm
    const getFixturesForPlayer = (playerId) => {
        return getPlayerFixtures(playerId, players, teams, upcomingFixtures).slice(0, fixtureWindow)
    }

    // STEP 1: Determine current optimal starting 11 (or 15 if Bench Boost)
    const currentTeamSelection = useBenchBoost
        ? selectOptimalStarting15(myPlayerData, getFixturesForPlayer)
        : selectOptimalStarting11(myPlayerData, getFixturesForPlayer)

    const starting11Ids = new Set(currentTeamSelection.starting11.map(p => p.id))

    // STEP 2: Generate transfer suggestions using unified algorithm
    // Note: The greedy algorithm in unifiedGenerateTransfers naturally optimizes for total score improvement
    const freeTransfers = picks.transfers?.limit || 1
    const transferSuggestions = unifiedGenerateTransfers({
        currentSquad: myPlayerData,
        allPlayers: players,
        budget,
        freeTransfers,
        getFixturesForPlayer,
        userInputTransfers
    })

    // STEP 3: Apply transfers to get post-transfer squad
    let postTransferSquad = [...myPlayerData]
    transferSuggestions.forEach(transfer => {
        postTransferSquad = postTransferSquad.filter(p => p.id !== transfer.out.id)
        postTransferSquad.push(transfer.in)
    })

    // STEP 4: Determine optimal starting 11 for the NEW squad
    const postTransferSelection = useBenchBoost
        ? selectOptimalStarting15(postTransferSquad, getFixturesForPlayer)
        : selectOptimalStarting11(postTransferSquad, getFixturesForPlayer)

    // STEP 5: Build weak players list (for display purposes)
    const weakPlayers = currentTeamSelection.starting11
        .filter(p => {
            const form = parseFloat(p.form || 0)
            const chanceOfPlaying = p.chance_of_playing_next_round
            const isInjured = chanceOfPlaying !== null && chanceOfPlaying < 50
            const isUncertain = chanceOfPlaying !== null && chanceOfPlaying >= 50 && chanceOfPlaying < 75
            return form < 3.0 || isInjured || isUncertain || (p.finalScore && p.finalScore < 200)
        })
        .map(p => {
            const team = teams.find(t => t.id === p.team)
            const fixtures = getFixturesForPlayer(p.id)
            return {
                ...p,
                fixtures,
                team,
                form: parseFloat(p.form || 0),
                totalPoints: p.total_points || 0,
                hybridScore: p.finalScore || 0
            }
        })
        .sort((a, b) => a.hybridScore - b.hybridScore)

    // STEP 6: Build transfer targets list (for display purposes)
    const transferTargets = transferSuggestions
        .map(t => t.in)
        .filter((player, index, self) =>
            index === self.findIndex(p => p.id === player.id)
        )
        .map(p => {
            const team = teams.find(t => t.id === p.team)
            const fixtures = getFixturesForPlayer(p.id)
            return {
                ...p,
                team,
                fixtures,
                form: parseFloat(p.form || 0),
                totalPoints: p.total_points || 0,
                transferScore: p.finalScore || p.baseScore || 0
            }
        })

    // STEP 7: Select captain and vice-captain using unified algorithm (on POST-transfer squad)
    // Even in Bench Boost, you still have a captain!
    const captaincy = selectCaptainAndVice(postTransferSelection.starting11)

    return {
        weakPlayers,
        transferTargets,
        budget,
        suggestedTransfers: transferSuggestions,
        numTransfers: transferSuggestions.length,
        freeTransfersAvailable: freeTransfers,
        starting11: postTransferSelection.starting11,
        bench: postTransferSelection.bench,
        formation: postTransferSelection.formation,
        formationString: postTransferSelection.formationString,
        // Add captaincy data to recommendations
        captain: captaincy.captain,
        vice: captaincy.vice,
        captaincyReasoning: captaincy.reasoning,
        allPlayersScored: captaincy.allPlayersScored
    }
}
