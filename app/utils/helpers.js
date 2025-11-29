/**
 * Utility functions - Re-exported from Design System
 * This file maintains backward compatibility while centralizing utilities in the design system
 */

// Re-export formatters from design system
export {
  getPositionName,
  formatPrice,
  formatPPG,
  calculateAvgPoints,
  formatNumber,
  formatPercentage,
  formatTeamValue,
  formatBank,
  getFullPositionName,
  formatFixtureOpponent,
  formatGameweek
} from '../design-system/utils/formatters'

// Re-export color utilities from design system
export {
  getDifficultyColor,
  getDifficultyHexColor,
  getFormColor,
  getStatusColor
} from '../design-system/utils/colors'

// Legacy constant for backward compatibility
export const POSITIONS = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD'
}

