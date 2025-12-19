/**
 * Team Selection Service
 * Re-exports from unified algorithm for backwards compatibility
 * All selection logic now uses the unified FPL algorithm
 */

import { getPlayerFixtures } from './fpl-service'
import {
  selectOptimalStarting11 as unifiedSelectStarting11,
  evaluateTransfer as unifiedEvaluateTransfer,
  calculateBasePerformanceScore,
  getPositionType as unifiedGetPositionType
} from './unified-fpl-algorithm'

/**
 * Calculate performance score for a player
 * Now uses the unified algorithm's calculateBasePerformanceScore
 * @deprecated Use unified-fpl-algorithm directly for new code
 */
export const calculatePerformanceScore = (player, fixtures) => {
  const result = calculateBasePerformanceScore(player, fixtures)
  return result.baseScore // Return just the score for backwards compatibility
}

/**
 * Get player position type
 * Re-exported from unified algorithm
 */
export const getPositionType = unifiedGetPositionType

/**
 * Select the optimal starting 11 from a squad
 * Wrapper around unified algorithm for backwards compatibility
 * @deprecated Use unified-fpl-algorithm directly for new code
 */
export const selectOptimalStarting11 = (squad, players, teams, fixtures) => {
  // Create fixture lookup function
  const getFixturesForPlayer = (playerId) => {
    return getPlayerFixtures(playerId, players, teams, fixtures).slice(0, 5)
  }
  
  // Use unified algorithm
  return unifiedSelectStarting11(squad, getFixturesForPlayer)
}

/**
 * Check if a player would make it into the starting 11
 * Wrapper around unified algorithm for backwards compatibility
 * @deprecated Use unified-fpl-algorithm directly for new code
 */
export const wouldPlayerStart = (player, currentSquad, players, teams, fixtures) => {
  const hypotheticalSquad = [...currentSquad, player]
  const { starting11 } = selectOptimalStarting11(hypotheticalSquad, players, teams, fixtures)
  return starting11.some(p => p.id === player.id)
}

/**
 * Evaluate if a transfer improves the starting 11
 * Wrapper around unified algorithm for backwards compatibility
 * @deprecated Use unified-fpl-algorithm directly for new code
 */
export const evaluateTransfer = (playerOut, playerIn, currentSquad, players, teams, fixtures) => {
  // Create fixture lookup function
  const getFixturesForPlayer = (playerId) => {
    return getPlayerFixtures(playerId, players, teams, fixtures).slice(0, 5)
  }
  
  // Use unified algorithm
  return unifiedEvaluateTransfer(playerOut, playerIn, currentSquad, getFixturesForPlayer)
}

