import { getPlayerFixtures } from './fpl-service'
import { selectOptimalStarting11, evaluateTransfer } from './team-selection-service'

// Placeholder for Sentiment/Scout data integration
// In the future, these will be passed in or fetched
const MOCK_SENTIMENT = {}
const MOCK_SCOUT_PICKS = new Set()

export const calculateHybridScore = (player, fixtures, sentimentData = MOCK_SENTIMENT, scoutPicks = MOCK_SCOUT_PICKS) => {
    // Injury/Availability Check (Must pass first)
    // 75%+ chance: Full consideration
    // 50-74%: Reduced consideration (50% penalty)
    // <50% or null (injured): Exclude from consideration
    const chanceOfPlaying = player.chance_of_playing_next_round
    
    if (chanceOfPlaying !== null && chanceOfPlaying < 50) {
        return 0 // Player unavailable or very unlikely to play
    }
    
    let availabilityMultiplier = 1.0
    if (chanceOfPlaying !== null && chanceOfPlaying >= 50 && chanceOfPlaying < 75) {
        availabilityMultiplier = 0.5 // 50% penalty for uncertain availability
    }
    
    const form = parseFloat(player.form || 0)
    const ppg = parseFloat(player.points_per_game || 0)

    const avgDifficulty = fixtures.length > 0
        ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
        : 3

    // 1. Form & Stats (40%)
    // Normalize: Form (0-10), PPG (0-10)
    const formStatsScore = (form * 2.0) + (ppg * 2.0)

    // 2. Fixtures (55%)
    // Inverted difficulty (easier fixtures = higher score)
    const fixtureScore = (5 - avgDifficulty) * 5.5

    // 3. Injury Status (5%) - Only factor we use from "sentiment"
    // Already handled via availabilityMultiplier above
    let injuryBonus = 0
    if (chanceOfPlaying === null || chanceOfPlaying === 100) {
        injuryBonus = 2 // Small bonus for fully fit players
    }

    // Weighted Combination: Form/Stats (40%) + Fixtures (55%) + Injury (5%)
    const totalScore = (formStatsScore + fixtureScore + injuryBonus) * availabilityMultiplier

    return totalScore
}

export const generateRecommendations = (picks, players, teams, fixtures, seed = 0, fixtureWindow = 5, last3PointsData = {}) => {
    const myPlayerIds = picks.picks.map(p => p.element)
    const myPlayerData = myPlayerIds.map(id => {
        const player = players.find(p => p.id === id)
        const pick = picks.picks.find(p => p.element === id)
        return { ...player, pick }
    }).filter(p => p && p.id)

    const upcomingFixtures = fixtures.filter(f => !f.finished_provisional).slice(0, 50)
    const budget = (picks.entry_history?.bank || 0) / 10

    // STEP 1: Determine current optimal starting 11
    const currentTeamSelection = selectOptimalStarting11(myPlayerData, players, teams, upcomingFixtures)
    const starting11Ids = new Set(currentTeamSelection.starting11.map(p => p.id))
    
    // STEP 2: Determine available transfers
    const freeTransfers = picks.transfers?.limit || 1
    let maxTransfers = Math.min(freeTransfers, 2) // Cap at 2
    
    // Emergency logic: If we have 0 FTs but multiple unavailable starters, consider a hit
    if (maxTransfers === 0) {
        const unavailableStarters = currentTeamSelection.starting11.filter(p => 
            p.chance_of_playing_next_round !== null && p.chance_of_playing_next_round < 50
        ).length
        
        if (unavailableStarters >= 2) {
            maxTransfers = 1 // Take a hit for critical injuries
        }
    }

    // STEP 3: Find weak players IN STARTING 11 ONLY
    // We only consider transfers for players who are actually starting
    const weakPlayers = currentTeamSelection.starting11
        .filter(p => {
            const form = parseFloat(p.form || 0)
            const chanceOfPlaying = p.chance_of_playing_next_round
            const isInjured = chanceOfPlaying !== null && chanceOfPlaying < 50 // Changed to 50% threshold
            const isUncertain = chanceOfPlaying !== null && chanceOfPlaying >= 50 && chanceOfPlaying < 75
            const minutes = p.minutes || 0
            return form < 3.0 || isInjured || isUncertain || minutes < 150
        })
        .map(p => {
            // Cache team lookup for performance
            const team = teams.find(t => t.id === p.team)
            const fixtures = getPlayerFixtures(p.id, players, teams, upcomingFixtures).slice(0, 5)
            const avgDifficulty = fixtures.length > 0
                ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
                : 3

            // Use new Hybrid Score
            const hybridScore = calculateHybridScore(p, fixtures)

            // Use real last 3 gameweeks points if available, otherwise approximate
            const last3Points = last3PointsData[p.id] !== undefined
                ? last3PointsData[p.id]
                : parseFloat(p.form || 0) * 3 // Fallback approximation

            return {
                ...p,
                fixtures,
                team,
                avgDifficulty,
                hybridScore,
                form: parseFloat(p.form || 0),
                totalPoints: p.total_points || 0,
                last3Points
            }
        })
        .sort((a, b) => a.hybridScore - b.hybridScore) // Lowest score first

    // STEP 4: Find best transfer targets - LIMIT to top candidates early for performance
    // Pre-filter aggressively to reduce computation
    const potentialTargets = players
        .filter(p => {
            const form = parseFloat(p.form || 0)
            const price = p.now_cost / 10
            const notInMyTeam = !myPlayerIds.includes(p.id)
            // More aggressive filtering to reduce candidates
            return notInMyTeam && form > 3.0 && p.minutes > 300 && price <= budget + 15
        })
        // Sort by form first (cheap operation) to get top candidates
        .sort((a, b) => parseFloat(b.form || 0) - parseFloat(a.form || 0))
        .slice(0, 100) // Limit to top 100 by form first

    // Now compute expensive operations on the limited set
    // Also filter out injured/unavailable players
    const transferTargets = potentialTargets
        .filter(p => {
            const chanceOfPlaying = p.chance_of_playing_next_round
            // Only consider players who are at least 75% likely to play
            return chanceOfPlaying === null || chanceOfPlaying >= 75
        })
        .map(p => {
            const team = teams.find(t => t.id === p.team)
            const fixtures = getPlayerFixtures(p.id, players, teams, upcomingFixtures).slice(0, 5)

            const avgDifficulty = fixtures.length > 0
                ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
                : 3

            // Use new Hybrid Score
            const transferScore = calculateHybridScore(p, fixtures)

            // Use real last 3 gameweeks points if available, otherwise approximate
            const last3Points = last3PointsData[p.id] !== undefined
                ? last3PointsData[p.id]
                : parseFloat(p.form || 0) * 3 // Fallback approximation

            return {
                ...p,
                team,
                avgDifficulty,
                transferScore,
                fixtures,
                form: parseFloat(p.form || 0),
                totalPoints: p.total_points || 0,
                last3Points
            }
        })
        .sort((a, b) => b.transferScore - a.transferScore)
        .slice(0, 50)

    // STEP 5: Generate suggested transfers
    // Only consider STARTING 11 players for transfers (not bench)
    const suggestedTransfers = []

    // Get all potential players to sell FROM STARTING 11
    // Weak players first, then other starters sorted by score
    const weakPlayerIds = new Set(weakPlayers.map(p => p.id))
    const otherStartingPlayers = currentTeamSelection.starting11
        .filter(p => !weakPlayerIds.has(p.id))
        .map(p => {
            const fixtures = getPlayerFixtures(p.id, players, teams, upcomingFixtures)
            const hybridScore = calculateHybridScore(p, fixtures)
            return { ...p, fixtures, hybridScore }
        })
        .sort((a, b) => a.hybridScore - b.hybridScore)

    // Combine weak starters first, then other starters
    const allPotentialSells = [...weakPlayers, ...otherStartingPlayers]

    // STEP 6: Intelligently select transfers
    // Calculate cumulative budget
    let remainingBudget = budget
    const usedPlayerIds = new Set()
    let actualTransfersMade = 0

    // Try to make up to maxTransfers
    for (let i = 0; i < Math.min(maxTransfers, allPotentialSells.length); i++) {
        const playerOut = allPotentialSells[i]
        if (!playerOut) break

        const isNotRecommended = !weakPlayerIds.has(playerOut.id)
        const playerOutPrice = playerOut.now_cost / 10
        
        // Add selling price to budget
        const availableBudget = remainingBudget + playerOutPrice

        // Find suitable replacements of same position
        const samePositionTargets = transferTargets.filter(p =>
            !usedPlayerIds.has(p.id) &&
            p.element_type === playerOut.element_type &&
            (p.now_cost / 10) <= availableBudget
        )

        if (samePositionTargets.length === 0) {
            continue // Skip if no affordable targets
        }

        // Select target (with seed for variation)
        const targetIndex = seed > 0 && samePositionTargets.length > 1
            ? Math.min(seed % samePositionTargets.length, samePositionTargets.length - 1)
            : 0
        const playerIn = samePositionTargets[targetIndex]

        // CRITICAL: Evaluate if this transfer improves the starting 11
        const currentSquadForEval = myPlayerData.filter(p => 
            !suggestedTransfers.some(t => t.out.id === p.id)
        )
        suggestedTransfers.forEach(t => currentSquadForEval.push(t.in))
        
        const evaluation = evaluateTransfer(
            playerOut, 
            playerIn, 
            currentSquadForEval, 
            players, 
            teams, 
            upcomingFixtures
        )

        // Only make the transfer if:
        // 1. The new player will actually start
        // 2. It improves the team score (or we're replacing an injured starter)
        const isInjured = playerOut.chance_of_playing_next_round !== null && 
                         playerOut.chance_of_playing_next_round < 75
        
        if (evaluation.playerInWillStart && (evaluation.worthIt || isInjured)) {
            remainingBudget = availableBudget - (playerIn.now_cost / 10)
            usedPlayerIds.add(playerIn.id)
            actualTransfersMade++

            suggestedTransfers.push({
                out: playerOut,
                in: playerIn,
                budget: remainingBudget,
                priceDiff: (playerIn.now_cost / 10) - playerOutPrice,
                notRecommended: isNotRecommended,
                scoreImprovement: evaluation.scoreImprovement
            })
        } else {
            // Transfer doesn't improve team enough, skip it
            // If this was a free transfer we decided not to use, that's OK
            continue
        }
    }

    return {
        weakPlayers,
        transferTargets,
        budget,
        suggestedTransfers,
        numTransfers: actualTransfersMade, // Return actual transfers made
        freeTransfersAvailable: freeTransfers,
        starting11: currentTeamSelection.starting11,
        bench: currentTeamSelection.bench,
        formation: currentTeamSelection.formation
    }
}
