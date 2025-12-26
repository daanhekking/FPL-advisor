/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UNIFIED FPL PERFORMANCE SCORING ALGORITHM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This is the SINGLE SOURCE OF TRUTH for all player evaluation.
 * Every decision in the app flows through these functions:
 * 
 * - Starting 11 selection
 * - Captain & Vice-Captain selection  
 * - Transfer recommendations
 * - Bench ordering
 * - Performance ratings
 * 
 * RULE: Never create alternative scoring logic elsewhere in the app.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORE PERFORMANCE SCORE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate base performance score for a player
 * 
 * Formula:
 * Performance Score = 
 *   (Total Points × 3)
 *   + (Form × 20)
 *   + (Price × 15)
 *   + (PPG × 10)
 *   + (Goals × 8)
 *   + (Assists × 5)
 *   + Fixture Bonus/Penalty
 *   + Home Bonus (+8)
 *   + Ownership Bonus (+10 if ≥50%)
 * 
 * @param {Object} player - Player object from FPL API
 * @param {Array} fixtures - Player's upcoming fixtures (sorted, earliest first)
 * @returns {Object} { baseScore, nextFixture, fixtureBonus }
 */
export const calculateBasePerformanceScore = (player, fixtures) => {
  let score = 0

  // 1. Total Points (×3) - Season quality indicator
  const totalPoints = player.total_points || 0
  score += totalPoints * 3

  // 2. Form (×20) - Recent performance
  const form = parseFloat(player.form || 0)
  score += form * 20

  // 3. Price (×15) - Quality indicator (managers' assessment)
  const price = (player.now_cost || 0) / 10
  score += price * 15

  // 4. Points Per Game (×10) - Consistency metric
  // Use the PPG field directly from API (accounts for minutes played)
  const ppg = parseFloat(player.points_per_game || 0)
  score += ppg * 10

  // 5. Goals (×8) - Attacking output
  const goals = player.goals_scored || 0
  score += goals * 8

  // 6. Assists (×5) - Creativity
  const assists = player.assists || 0
  score += assists * 5

  // 7. Fixture Difficulty Bonus/Penalty
  const nextFixture = fixtures[0] || null
  let fixtureBonus = 0

  if (nextFixture) {
    const difficulty = nextFixture.difficulty

    if (difficulty === 1) fixtureBonus = 40
    else if (difficulty === 2) fixtureBonus = 25
    else if (difficulty === 3) fixtureBonus = 5
    else if (difficulty === 4) fixtureBonus = -15
    else if (difficulty === 5) fixtureBonus = -30

    score += fixtureBonus

    // 8. Home Advantage (+8)
    if (nextFixture.isHome) {
      score += 8
    }
  }

  // 9. Ownership Bonus (+10 if ≥50%)
  const ownership = parseFloat(player.selected_by_percent || 0)
  if (ownership >= 50) {
    score += 10
  }

  // 10. Availability Penalty (CRITICAL for transfers)
  // Penalize players heavily if they are unlikely to play (injuries, suspensions, AFCON/Asian Cup)
  const chance = player.status === 'u' || player.status === 'i' || player.status === 's' || player.status === 'n'
    ? (player.chance_of_playing_next_round !== null ? player.chance_of_playing_next_round : 0)
    : 100

  // Massive penalties for unavailable players to force transfers
  if (chance === 0) score -= 500 // Definitely out (Red) - Priority Sell
  else if (chance === 25) score -= 200 // Very unlikely (Red/Orange)
  else if (chance === 50) score -= 100 // Unlikely (Orange)
  else if (chance === 75) score -= 25 // Doubtful (Yellow)

  return {
    baseScore: score,
    nextFixture,
    fixtureBonus,
    difficulty: nextFixture ? nextFixture.difficulty : null
  }
}

/**
 * Apply fixture impact penalties based on player rank
 * 
 * RULES:
 * - Moderate fixtures (difficulty 3): -30% for players outside top 10
 * - Hard fixtures (difficulty 4-5): -60% for players outside top 20
 * - Top 10 players: NO penalties (elite players overcome fixtures)
 * - Top 20 players: Immune to hard fixture penalties
 * 
 * This is applied AFTER initial scoring to preserve relative ranking
 * 
 * @param {Array} players - Players sorted by baseScore (highest first)
 * @returns {Array} Players with finalScore calculated
 */
export const applyFixturePenalties = (players) => {
  return players.map((player, index) => {
    const rank = index + 1 // 1-indexed ranking
    let finalScore = player.baseScore
    let penaltyApplied = null

    const difficulty = player.difficulty

    // Top 10: No penalties ever (elite players)
    if (rank <= 10) {
      penaltyApplied = 'NONE (Top 10 - Elite)'
    }
    // Moderate fixtures (3): -30% for players outside top 10
    else if (difficulty === 3 && rank > 10) {
      finalScore = finalScore * 0.7 // 30% penalty
      penaltyApplied = 'MODERATE (-30%)'
    }
    // Hard fixtures (4-5): -60% for players outside top 20
    else if ((difficulty === 4 || difficulty === 5) && rank > 20) {
      finalScore = finalScore * 0.4 // 60% penalty
      penaltyApplied = 'HARD (-60%)'
    }
    // Top 20: Immune to hard fixture penalties
    else if ((difficulty === 4 || difficulty === 5) && rank > 10 && rank <= 20) {
      penaltyApplied = 'NONE (Top 20 - Immune to hard fixtures)'
    }
    // Easy fixtures or no penalty needed
    else {
      penaltyApplied = 'NONE'
    }

    return {
      ...player,
      rank,
      finalScore,
      penaltyApplied
    }
  })
}

/**
 * Get complete performance score with all details
 * 
 * This is the main function to use for evaluating a single player
 * 
 * @param {Object} player - Player object
 * @param {Array} fixtures - Player's upcoming fixtures
 * @param {Number} rank - Player's rank (optional, for penalty calculation)
 * @returns {Object} Complete scoring breakdown
 */
export const getPlayerPerformanceData = (player, fixtures, rank = null) => {
  const { baseScore, nextFixture, fixtureBonus, difficulty } =
    calculateBasePerformanceScore(player, fixtures)

  let finalScore = baseScore
  let penaltyApplied = null

  // Apply penalties if rank is provided
  if (rank !== null) {
    if (rank <= 10) {
      penaltyApplied = 'NONE (Top 10)'
    } else if (difficulty === 3 && rank > 10) {
      finalScore = finalScore * 0.7
      penaltyApplied = 'MODERATE (-30%)'
    } else if ((difficulty === 4 || difficulty === 5) && rank > 20) {
      finalScore = finalScore * 0.4
      penaltyApplied = 'HARD (-60%)'
    } else if ((difficulty === 4 || difficulty === 5) && rank > 10 && rank <= 20) {
      penaltyApplied = 'NONE (Top 20)'
    } else {
      penaltyApplied = 'NONE'
    }
  }

  return {
    ...player,
    baseScore,
    finalScore,
    nextFixture,
    fixtureBonus,
    difficulty,
    rank,
    penaltyApplied,
    fixtures
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STARTING 11 SELECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Valid FPL formations
 * Format: { DEF: number, MID: number, FWD: number }
 * GK is always 1
 */
const VALID_FORMATIONS = [
  { DEF: 3, MID: 4, FWD: 3 }, // 3-4-3
  { DEF: 3, MID: 5, FWD: 2 }, // 3-5-2
  { DEF: 4, MID: 3, FWD: 3 }, // 4-3-3
  { DEF: 4, MID: 4, FWD: 2 }, // 4-4-2
  { DEF: 4, MID: 5, FWD: 1 }, // 4-5-1
  { DEF: 5, MID: 3, FWD: 2 }, // 5-3-2
  { DEF: 5, MID: 4, FWD: 1 }, // 5-4-1
  { DEF: 5, MID: 2, FWD: 3 }, // 5-2-3
]

/**
 * Get position type from element_type
 */
const getPositionType = (elementType) => {
  const positionMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' }
  return positionMap[elementType] || 'FWD'
}

/**
 * Score a formation based on player final scores
 */
const scoreFormation = (formation, playersByPosition) => {
  let totalScore = 0

  // GK (always 1)
  if (playersByPosition.GKP[0]) {
    totalScore += playersByPosition.GKP[0].finalScore || 0
  }

  // DEF
  for (let i = 0; i < formation.DEF; i++) {
    if (playersByPosition.DEF[i]) {
      totalScore += playersByPosition.DEF[i].finalScore || 0
    }
  }

  // MID
  for (let i = 0; i < formation.MID; i++) {
    if (playersByPosition.MID[i]) {
      totalScore += playersByPosition.MID[i].finalScore || 0
    }
  }

  // FWD
  for (let i = 0; i < formation.FWD; i++) {
    if (playersByPosition.FWD[i]) {
      totalScore += playersByPosition.FWD[i].finalScore || 0
    }
  }

  return totalScore
}

/**
 * Select optimal starting 11 from squad
 * 
 * Process:
 * 1. Score all players (base score)
 * 2. Sort by base score globally
 * 3. Apply fixture penalties based on rank
 * 4. Group by position
 * 5. Try all formations
 * 6. Return best formation
 * 
 * @param {Array} squad - Current squad (15 players)
 * @param {Function} getFixturesForPlayer - Function to get fixtures: (playerId) => fixtures[]
 * @returns {Object} { starting11, bench, formation, formationScore }
 */
export const selectOptimalStarting11 = (squad, getFixturesForPlayer) => {
  // Step 1: Calculate base scores for all players
  const scoredPlayers = squad.map(player => {
    const fixtures = getFixturesForPlayer(player.id)
    const scoreData = calculateBasePerformanceScore(player, fixtures)
    return {
      ...player,
      ...scoreData
    }
  })

  // Step 2: Sort by base score (highest first) to establish ranking
  scoredPlayers.sort((a, b) => b.baseScore - a.baseScore)

  // Step 3: Apply fixture penalties based on rank
  const playersWithPenalties = applyFixturePenalties(scoredPlayers)

  // Step 4: Group by position (using final scores for sorting)
  const playersByPosition = {
    GKP: [],
    DEF: [],
    MID: [],
    FWD: []
  }

  playersWithPenalties.forEach(player => {
    const position = getPositionType(player.element_type)
    playersByPosition[position].push(player)
  })

  // Sort each position by final score (best first)
  Object.keys(playersByPosition).forEach(position => {
    playersByPosition[position].sort((a, b) => b.finalScore - a.finalScore)
  })

  // Step 5: Try all valid formations
  let bestFormation = null
  let bestScore = -Infinity
  let bestStarting11 = []

  VALID_FORMATIONS.forEach(formation => {
    // Check if we have enough players
    const hasEnoughDEF = playersByPosition.DEF.length >= formation.DEF
    const hasEnoughMID = playersByPosition.MID.length >= formation.MID
    const hasEnoughFWD = playersByPosition.FWD.length >= formation.FWD
    const hasGK = playersByPosition.GKP.length >= 1

    if (!hasEnoughDEF || !hasEnoughMID || !hasEnoughFWD || !hasGK) {
      return // Skip this formation
    }

    // Calculate score for this formation
    const formationScore = scoreFormation(formation, playersByPosition)

    if (formationScore > bestScore) {
      bestScore = formationScore
      bestFormation = formation

      // Build starting 11 for this formation
      bestStarting11 = [
        playersByPosition.GKP[0],
        ...playersByPosition.DEF.slice(0, formation.DEF),
        ...playersByPosition.MID.slice(0, formation.MID),
        ...playersByPosition.FWD.slice(0, formation.FWD)
      ].filter(p => p) // Remove any undefined
    }
  })

  // Step 6: Build bench (remaining players)
  const starting11Ids = new Set(bestStarting11.map(p => p.id))
  const bench = playersWithPenalties
    .filter(p => !starting11Ids.has(p.id))
    .sort((a, b) => b.finalScore - a.finalScore) // Best bench players first

  return {
    starting11: bestStarting11,
    bench,
    formation: bestFormation,
    formationScore: bestScore,
    formationString: bestFormation
      ? `${bestFormation.DEF}-${bestFormation.MID}-${bestFormation.FWD}`
      : 'Unknown'
  }
}

/**
 * Select optimal 15 players (Bench Boost optimization)
 * 
 * simply sums the score of all 15 players as they all play.
 * 
 * @param {Array} players - List of players (must be 15)
 * @param {Function} getFixturesForPlayer - Function to get fixtures
 * @returns {Object} { starting11, bench, formation, formationScore }
 */
export const selectOptimalStarting15 = (players, getFixturesForPlayer) => {
  // Score all players
  const scoredPlayers = players.map(player => {
    const fixtures = getFixturesForPlayer(player.id)
    return getPlayerPerformanceData(player, fixtures)
  })

  // Calculate total score
  const totalScore = scoredPlayers.reduce((sum, p) => sum + (p.finalScore || 0), 0)

  // Sort by score for display purposes, but everyone is a "starter"
  const sortedPlayers = scoredPlayers.sort((a, b) => b.finalScore - a.finalScore)

  // In Bench Boost, everyone starts. Bench is empty.
  // We identify positions just for validity check if needed, but really we just want the score.

  return {
    starting11: sortedPlayers, // All 15 are "starting"
    bench: [],
    formation: { DEF: 5, MID: 5, FWD: 3 }, // Nominal "Max" formation (though actually 2 GKs involve)
    formationScore: totalScore,
    formationString: 'Bench Boost'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPTAINCY SELECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Select captain and vice-captain
 * 
 * RULES:
 * - Captain = highest final score
 * - Vice-captain = 2nd highest final score
 * - BOTH MUST BE IN STARTING 11 (guaranteed by design)
 * 
 * @param {Array} starting11 - The starting 11 players (already scored)
 * @returns {Object} { captain, vice, reasoning }
 */
export const selectCaptainAndVice = (starting11) => {
  // Sort starting 11 by final score (highest first)
  const sorted = [...starting11].sort((a, b) => b.finalScore - a.finalScore)

  const captain = sorted[0]
  const vice = sorted[1] || sorted[0] // Fallback to captain if only 1 player

  return {
    captain,
    vice,
    reasoning: captain
      ? `${captain.web_name} (${captain.finalScore.toFixed(0)} score, Rank #${captain.rank}) is your captain. ${vice.web_name} (${vice.finalScore.toFixed(0)} score, Rank #${vice.rank}) is vice-captain.`
      : 'No captain recommendation available',
    allPlayersScored: sorted
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSFER LOGIC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine how many transfers to make
 * 
 * RULES:
 * - 2 FTs → use 1-2 if upgrades exist
 * - 1 FT → use if clear upgrade exists
 * - 0 FTs → take hit only if multiple starters unavailable
 * 
 * @param {Number} freeTransfers - Available free transfers
 * @param {Array} starting11 - Current starting 11
 * @returns {Number} Maximum transfers to attempt
 */
export const determineTransferCount = (freeTransfers, starting11) => {
  let maxTransfers = Math.min(freeTransfers, 2) // Cap at 2

  // Emergency logic: 0 FTs but multiple unavailable starters
  if (maxTransfers === 0) {
    const unavailableStarters = starting11.filter(p =>
      p.chance_of_playing_next_round !== null &&
      p.chance_of_playing_next_round < 50
    ).length

    if (unavailableStarters >= 2) {
      maxTransfers = 1 // Take a hit
    }
  }

  return maxTransfers
}

/**
 * Evaluate if a transfer improves the starting 11
 * 
 * @param {Object} playerOut - Player being sold
 * @param {Object} playerIn - Player being bought
 * @param {Array} currentSquad - Current squad (15 players)
 * @param {Function} getFixturesForPlayer - Function to get fixtures
 * @returns {Object} { improves, scoreImprovement, playerInWillStart }
 */
export const evaluateTransfer = (playerOut, playerIn, currentSquad, getFixturesForPlayer) => {
  // Current starting 11
  const currentSelection = selectOptimalStarting11(currentSquad, getFixturesForPlayer)

  // Check if playerOut is in starting 11
  const playerOutIsStarting = currentSelection.starting11.some(p => p.id === playerOut.id)

  // Hypothetical squad after transfer
  const newSquad = currentSquad
    .filter(p => p.id !== playerOut.id)
    .concat([playerIn])

  const newSelection = selectOptimalStarting11(newSquad, getFixturesForPlayer)

  // Check if playerIn makes starting 11
  const playerInWillStart = newSelection.starting11.some(p => p.id === playerIn.id)

  const scoreImprovement = newSelection.formationScore - currentSelection.formationScore

  return {
    improves: scoreImprovement > 0 && playerInWillStart,
    scoreImprovement,
    playerOutWasStarting: playerOutIsStarting,
    playerInWillStart,
    worthIt: scoreImprovement > 0 && playerInWillStart
  }
}

/**
 * Generate transfer suggestions
 * 
 * RULES:
 * - Only transfer players IN STARTING 11
 * - Incoming player MUST become a starter
 * - Transfer must improve overall team score
 * - Must be affordable
 * 
 * @param {Object} params - { currentSquad, allPlayers, budget, freeTransfers, getFixturesForPlayer }
 * @returns {Array} Suggested transfers
 */
export const generateTransferSuggestions = ({
  currentSquad,
  allPlayers,
  budget,
  freeTransfers,
  getFixturesForPlayer,
  userInputTransfers = null
}) => {
  // Step 1: Get current selection to determine max transfers
  const currentSelection = selectOptimalStarting11(currentSquad, getFixturesForPlayer)
  const maxTransfers = userInputTransfers !== null
    ? userInputTransfers
    : determineTransferCount(freeTransfers, currentSelection.starting11)

  if (maxTransfers === 0) return []

  // Step 2: Prepare working data
  let workingSquad = [...currentSquad].map(p => {
    const fixtures = getFixturesForPlayer(p.id)
    return getPlayerPerformanceData(p, fixtures)
  })
  let workingBudget = budget
  const suggestedTransfers = []

  // Pre-calculate candidate scores (top 150 players not in squad)
  const myPlayerIds = new Set(workingSquad.map(p => p.id))
  const candidates = allPlayers
    .filter(p => !myPlayerIds.has(p.id))
    .map(p => {
      const fixtures = getFixturesForPlayer(p.id)
      return getPlayerPerformanceData(p, fixtures)
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 150)

  // Utility to check FPL team limits (max 3 per team)
  const getTeamCounts = (squad) => {
    const counts = {}
    squad.forEach(p => {
      counts[p.team] = (counts[p.team] || 0) + 1
    })
    return counts
  }

  // Step 3: Greedy optimization loop
  for (let i = 0; i < maxTransfers; i++) {
    let bestTransfer = null
    let maxGain = -Infinity
    const teamCounts = getTeamCounts(workingSquad)

    for (const playerOut of workingSquad) {
      const playerOutPrice = playerOut.now_cost / 10
      const availableBudget = workingBudget + playerOutPrice

      // Find best candidate for this playerOut
      for (const playerIn of candidates) {
        // Position match and budget check
        if (playerIn.element_type !== playerOut.element_type) continue
        if ((playerIn.now_cost / 10) > availableBudget) continue

        // Skip if already in suggested transfers
        if (suggestedTransfers.some(t => t.in.id === playerIn.id)) continue

        // Team limit check (max 3)
        if (playerIn.team !== playerOut.team && (teamCounts[playerIn.team] || 0) >= 3) continue

        // Calculate gain vs current player
        // Note: playerOut.finalScore already includes the massive penalty for unavailability
        // So gain will be huge if replacing an unavailable player (e.g. 50 - (-500) = 550 gain)
        const gain = playerIn.finalScore - playerOut.finalScore

        // Strategy: Only consider beneficial transfers (gain > 0)
        // or effectively unrelated moves if we have budget issues, but here we prioritize points.

        // Priority Override: If playerOut is unavailable (chance < 50), we almost ALWAYS want to sell them
        // The huge penalty in finalScore (-500) ensures 'gain' is massive, so standard logic handles it.
        // We just need to ensure we don't accidentally filter it out.

        const isUnavailable = playerOut.chance_of_playing_next_round !== null &&
          playerOut.chance_of_playing_next_round < 50

        if (gain > maxGain && (gain > 0 || isUnavailable)) {
          maxGain = gain
          bestTransfer = {
            out: playerOut,
            in: playerIn,
            gain,
            cost: (playerIn.now_cost / 10) - playerOutPrice
          }
        }
      }
    }

    if (bestTransfer) {
      // Execute best transfer found in this round
      suggestedTransfers.push({
        out: bestTransfer.out,
        in: bestTransfer.in,
        priceDiff: bestTransfer.cost,
        scoreImprovement: bestTransfer.gain,
        reasoning: bestTransfer.out.chance_of_playing_next_round !== null && bestTransfer.out.chance_of_playing_next_round < 75
          ? `${bestTransfer.out.web_name} is injured/uncertain. Replaced with higher-performing ${bestTransfer.in.web_name}.`
          : `Upgrade: ${bestTransfer.in.web_name} (+${bestTransfer.gain.toFixed(0)} points) replaces ${bestTransfer.out.web_name}.`
      })

      // Update working state
      workingSquad = workingSquad.map(p => p.id === bestTransfer.out.id ? bestTransfer.in : p)
      workingBudget -= bestTransfer.cost
    } else {
      break // No more beneficial transfers found
    }
  }

  return suggestedTransfers
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get difficulty rating string
 */
export const getDifficultyRating = (difficulty) => {
  if (difficulty === 1) return 'Very Easy'
  if (difficulty === 2) return 'Easy'
  if (difficulty === 3) return 'Moderate'
  if (difficulty === 4) return 'Tough'
  if (difficulty === 5) return 'Very Tough'
  return 'Unknown'
}

/**
 * Format performance score for display
 */
export const formatScore = (score) => {
  return Math.round(score)
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

const algorithmService = {
  // Core scoring
  calculateBasePerformanceScore,
  applyFixturePenalties,
  getPlayerPerformanceData,

  // Starting 11
  selectOptimalStarting11,
  selectOptimalStarting15,

  // Captaincy
  selectCaptainAndVice,

  // Transfers
  determineTransferCount,
  evaluateTransfer,
  generateTransferSuggestions,

  // Utilities
  getDifficultyRating,
  formatScore,
  getPositionType
}

export default algorithmService

