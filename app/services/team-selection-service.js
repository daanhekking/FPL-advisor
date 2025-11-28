/**
 * Team Selection Service
 * Handles starting 11 selection and formation logic according to FPL rules
 */

import { calculateHybridScore } from './algorithm-service'
import { getPlayerFixtures } from './fpl-service'

/**
 * FPL Formation Rules:
 * - Exactly 1 GK in starting 11
 * - 3-5 DEF in starting 11
 * - 2-5 MID in starting 11  
 * - 1-3 FWD in starting 11
 * - Total = 11 players
 * 
 * Squad composition:
 * - 2 GK total (1 starts, 1 bench)
 * - 5 DEF total
 * - 5 MID total
 * - 3 FWD total
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
 * Get player position type
 */
export const getPositionType = (elementType) => {
  const positionMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' }
  return positionMap[elementType] || 'FWD'
}

/**
 * Score a formation based on the players in it
 */
const scoreFormation = (formation, playersByPosition, players, teams, fixtures) => {
  let totalScore = 0
  
  // Score GK (always 1)
  if (playersByPosition.GKP[0]) {
    const gk = playersByPosition.GKP[0]
    const gkFixtures = getPlayerFixtures(gk.id, players, teams, fixtures).slice(0, 5)
    totalScore += calculateHybridScore(gk, gkFixtures)
  }
  
  // Score DEF
  for (let i = 0; i < formation.DEF; i++) {
    if (playersByPosition.DEF[i]) {
      const player = playersByPosition.DEF[i]
      const playerFixtures = getPlayerFixtures(player.id, players, teams, fixtures).slice(0, 5)
      totalScore += calculateHybridScore(player, playerFixtures)
    }
  }
  
  // Score MID
  for (let i = 0; i < formation.MID; i++) {
    if (playersByPosition.MID[i]) {
      const player = playersByPosition.MID[i]
      const playerFixtures = getPlayerFixtures(player.id, players, teams, fixtures).slice(0, 5)
      totalScore += calculateHybridScore(player, playerFixtures)
    }
  }
  
  // Score FWD
  for (let i = 0; i < formation.FWD; i++) {
    if (playersByPosition.FWD[i]) {
      const player = playersByPosition.FWD[i]
      const playerFixtures = getPlayerFixtures(player.id, players, teams, fixtures).slice(0, 5)
      totalScore += calculateHybridScore(player, playerFixtures)
    }
  }
  
  return totalScore
}

/**
 * Select the optimal starting 11 from a squad
 * Returns: { starting11: [], bench: [], formation: {} }
 */
export const selectOptimalStarting11 = (squad, players, teams, fixtures) => {
  // Identify top 10 and top 20 players in FPL by total points
  const sortedPlayers = players.sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
  
  const top10PlayerIds = new Set(sortedPlayers.slice(0, 10).map(p => p.id))
  const top20PlayerIds = new Set(sortedPlayers.slice(0, 20).map(p => p.id))
  
  // Group players by position and sort by hybrid score
  const playersByPosition = {
    GKP: [],
    DEF: [],
    MID: [],
    FWD: []
  }
  
  squad.forEach(player => {
    const position = getPositionType(player.element_type)
    const playerFixtures = getPlayerFixtures(player.id, players, teams, fixtures).slice(0, 5)
    let hybridScore = calculateHybridScore(player, playerFixtures)
    
    // Check next gameweek fixture difficulty
    const nextFixture = playerFixtures[0]
    const isTop10Player = top10PlayerIds.has(player.id)
    const isTop20Player = top20PlayerIds.has(player.id)
    
    // Fixture difficulty penalties based on player tier
    if (nextFixture) {
      if (nextFixture.difficulty === 3) {
        // Moderate fixtures: Only penalize if not in top 10
        if (!isTop10Player) {
          hybridScore = hybridScore * 0.7 // 30% penalty for moderate fixtures
        }
        // Top 10 players are immune to fixture 3 penalty
      } else if (nextFixture.difficulty === 4 || nextFixture.difficulty === 5) {
        // Hard fixtures: Penalize if not in top 20
        if (!isTop20Player) {
          hybridScore = hybridScore * 0.4 // 60% penalty for hard fixtures
        }
        // Top 20 players are immune to fixtures 4-5 penalty
      }
    }
    
    playersByPosition[position].push({
      ...player,
      hybridScore,
      fixtures: playerFixtures,
      isTop10Player,
      isTop20Player
    })
  })
  
  // Sort each position by hybrid score (best first)
  Object.keys(playersByPosition).forEach(position => {
    playersByPosition[position].sort((a, b) => b.hybridScore - a.hybridScore)
  })
  
  // Try all valid formations and pick the best one
  let bestFormation = null
  let bestScore = -Infinity
  let bestStarting11 = []
  
  VALID_FORMATIONS.forEach(formation => {
    // Check if we have enough players for this formation
    const hasEnoughDEF = playersByPosition.DEF.length >= formation.DEF
    const hasEnoughMID = playersByPosition.MID.length >= formation.MID
    const hasEnoughFWD = playersByPosition.FWD.length >= formation.FWD
    const hasGK = playersByPosition.GKP.length >= 1
    
    if (!hasEnoughDEF || !hasEnoughMID || !hasEnoughFWD || !hasGK) {
      return // Skip this formation
    }
    
    // Calculate score for this formation
    const formationScore = scoreFormation(formation, playersByPosition, players, teams, fixtures)
    
    if (formationScore > bestScore) {
      bestScore = formationScore
      bestFormation = formation
      
      // Build starting 11 for this formation
      bestStarting11 = [
        playersByPosition.GKP[0], // Best GK
        ...playersByPosition.DEF.slice(0, formation.DEF),
        ...playersByPosition.MID.slice(0, formation.MID),
        ...playersByPosition.FWD.slice(0, formation.FWD)
      ]
    }
  })
  
  // Build bench (remaining players)
  const starting11Ids = new Set(bestStarting11.map(p => p.id))
  const bench = squad
    .filter(p => !starting11Ids.has(p.id))
    .map(p => {
      const position = getPositionType(p.element_type)
      const playerFixtures = getPlayerFixtures(p.id, players, teams, fixtures).slice(0, 5)
      const hybridScore = calculateHybridScore(p, playerFixtures)
      return { ...p, hybridScore, fixtures: playerFixtures }
    })
    .sort((a, b) => b.hybridScore - a.hybridScore) // Best bench players first
  
  return {
    starting11: bestStarting11,
    bench,
    formation: bestFormation,
    formationScore: bestScore
  }
}

/**
 * Check if a player would make it into the starting 11
 */
export const wouldPlayerStart = (player, currentSquad, players, teams, fixtures) => {
  // Create hypothetical squad with this player
  const hypotheticalSquad = [...currentSquad, player]
  
  const { starting11 } = selectOptimalStarting11(hypotheticalSquad, players, teams, fixtures)
  
  return starting11.some(p => p.id === player.id)
}

/**
 * Evaluate if a transfer improves the starting 11
 */
export const evaluateTransfer = (playerOut, playerIn, currentSquad, players, teams, fixtures) => {
  // Current starting 11
  const currentSelection = selectOptimalStarting11(currentSquad, players, teams, fixtures)
  
  // Check if playerOut is even in starting 11
  const playerOutInStarting11 = currentSelection.starting11.some(p => p.id === playerOut.id)
  
  // New squad after transfer
  const newSquad = currentSquad
    .filter(p => p.id !== playerOut.id)
    .concat([playerIn])
  
  const newSelection = selectOptimalStarting11(newSquad, players, teams, fixtures)
  
  // Check if playerIn makes the starting 11
  const playerInInStarting11 = newSelection.starting11.some(p => p.id === playerIn.id)
  
  return {
    scoreImprovement: newSelection.formationScore - currentSelection.formationScore,
    playerOutWasStarting: playerOutInStarting11,
    playerInWillStart: playerInInStarting11,
    worthIt: newSelection.formationScore > currentSelection.formationScore && playerInInStarting11
  }
}

