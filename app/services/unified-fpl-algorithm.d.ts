/**
 * TypeScript Type Definitions for Unified FPL Algorithm
 * 
 * Use these types for full type safety when integrating the algorithm
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FPLPlayer {
  id: number
  web_name: string
  element_type: 1 | 2 | 3 | 4 // 1=GKP, 2=DEF, 3=MID, 4=FWD
  team: number
  now_cost: number // Price in tenths (e.g., 125 = £12.5m)
  total_points: number
  form: string // String representation of decimal
  points_per_game: string // String representation of decimal
  goals_scored: number
  assists: number
  minutes: number
  selected_by_percent: string // String representation of decimal
  chance_of_playing_next_round: number | null // null = 100%, 0-100 = percentage
}

export interface FPLFixture {
  id: number
  team_h: number // Home team ID
  team_a: number // Away team ID
  team_h_difficulty: number // 1-5
  team_a_difficulty: number // 1-5
  kickoff_time: string
  finished_provisional: boolean
}

export interface PlayerFixture {
  opponent: string // Team short name (e.g., "ARS")
  opponentId: number
  difficulty: 1 | 2 | 3 | 4 | 5
  isHome: boolean
  kickoffTime: string
  gameweek: number
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface BaseScoreResult {
  baseScore: number
  nextFixture: PlayerFixture | null
  fixtureBonus: number
  difficulty: 1 | 2 | 3 | 4 | 5 | null
}

export interface ScoredPlayer extends FPLPlayer, BaseScoreResult {
  rank: number // 1-indexed ranking (1 = best)
  finalScore: number // Score after fixture penalties
  penaltyApplied: string // Description of penalty
  fixtures: PlayerFixture[]
}

// ═══════════════════════════════════════════════════════════════════════════
// TEAM SELECTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Formation {
  DEF: number // 3-5
  MID: number // 2-5
  FWD: number // 1-3
}

export interface TeamSelection {
  starting11: ScoredPlayer[]
  bench: ScoredPlayer[]
  formation: Formation
  formationScore: number
  formationString: string // e.g., "4-4-2"
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPTAINCY TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CaptaincyRecommendation {
  captain: ScoredPlayer
  vice: ScoredPlayer
  reasoning: string
  allPlayersScored: ScoredPlayer[]
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSFER TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TransferEvaluation {
  improves: boolean
  scoreImprovement: number
  playerOutWasStarting: boolean
  playerInWillStart: boolean
  worthIt: boolean
}

export interface Transfer {
  out: ScoredPlayer
  in: ScoredPlayer
  budget: number // Remaining budget after transfer
  priceDiff: number // Price difference (positive = more expensive)
  scoreImprovement: number
  reasoning: string
}

export interface TransferSuggestionParams {
  currentSquad: FPLPlayer[]
  allPlayers: FPLPlayer[]
  budget: number // Available budget in £m
  freeTransfers: number
  getFixturesForPlayer: (playerId: number) => PlayerFixture[]
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTION SIGNATURES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate base performance score for a player
 */
export function calculateBasePerformanceScore(
  player: FPLPlayer,
  fixtures: PlayerFixture[]
): BaseScoreResult

/**
 * Apply fixture penalties based on player ranking
 */
export function applyFixturePenalties(
  players: Array<FPLPlayer & BaseScoreResult>
): ScoredPlayer[]

/**
 * Get complete performance data for a single player
 */
export function getPlayerPerformanceData(
  player: FPLPlayer,
  fixtures: PlayerFixture[],
  rank?: number | null
): ScoredPlayer

/**
 * Select optimal starting 11 from squad
 */
export function selectOptimalStarting11(
  squad: FPLPlayer[],
  getFixturesForPlayer: (playerId: number) => PlayerFixture[]
): TeamSelection

/**
 * Select captain and vice-captain from starting 11
 */
export function selectCaptainAndVice(
  starting11: ScoredPlayer[]
): CaptaincyRecommendation

/**
 * Determine how many transfers to make
 */
export function determineTransferCount(
  freeTransfers: number,
  starting11: ScoredPlayer[]
): number

/**
 * Evaluate if a transfer improves the team
 */
export function evaluateTransfer(
  playerOut: FPLPlayer,
  playerIn: FPLPlayer,
  currentSquad: FPLPlayer[],
  getFixturesForPlayer: (playerId: number) => PlayerFixture[]
): TransferEvaluation

/**
 * Generate transfer suggestions
 */
export function generateTransferSuggestions(
  params: TransferSuggestionParams
): Transfer[]

/**
 * Get difficulty rating string
 */
export function getDifficultyRating(
  difficulty: 1 | 2 | 3 | 4 | 5
): 'Very Easy' | 'Easy' | 'Moderate' | 'Tough' | 'Very Tough' | 'Unknown'

/**
 * Format score for display
 */
export function formatScore(score: number): number

/**
 * Get position type from element_type
 */
export function getPositionType(
  elementType: 1 | 2 | 3 | 4
): 'GKP' | 'DEF' | 'MID' | 'FWD'

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════

declare const UnifiedAlgorithm: {
  calculateBasePerformanceScore: typeof calculateBasePerformanceScore
  applyFixturePenalties: typeof applyFixturePenalties
  getPlayerPerformanceData: typeof getPlayerPerformanceData
  selectOptimalStarting11: typeof selectOptimalStarting11
  selectCaptainAndVice: typeof selectCaptainAndVice
  determineTransferCount: typeof determineTransferCount
  evaluateTransfer: typeof evaluateTransfer
  generateTransferSuggestions: typeof generateTransferSuggestions
  getDifficultyRating: typeof getDifficultyRating
  formatScore: typeof formatScore
  getPositionType: typeof getPositionType
}

export default UnifiedAlgorithm

