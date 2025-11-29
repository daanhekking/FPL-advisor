/**
 * Design System - Formatting Utilities
 * Standardized formatters for consistent data display
 */

/**
 * Format price in millions (e.g., 8.5m)
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined) return 'N/A'
  return `£${(price / 10).toFixed(1)}m`
}

/**
 * Format points per game
 */
export const formatPPG = (ppg) => {
  if (ppg === null || ppg === undefined) return '0.0'
  return parseFloat(ppg).toFixed(1)
}

/**
 * Format average points per 90 minutes
 */
export const calculateAvgPoints = (totalPoints, minutes) => {
  if (!minutes || minutes === 0) return '0.0'
  const avgPoints = (totalPoints / (minutes / 90))
  return avgPoints.toFixed(1)
}

/**
 * Format large numbers with commas
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return 'N/A'
  return num.toLocaleString()
}

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%'
  return `${parseFloat(value).toFixed(decimals)}%`
}

/**
 * Format team value
 */
export const formatTeamValue = (value) => {
  if (value === null || value === undefined) return 'N/A'
  return `£${(value / 10).toFixed(1)}m`
}

/**
 * Format bank amount
 */
export const formatBank = (bank) => {
  if (bank === null || bank === undefined) return '£0.0m'
  return `£${(bank / 10).toFixed(1)}m`
}

/**
 * Get position name from element type
 */
export const getPositionName = (elementType) => {
  const positions = {
    1: 'GKP',
    2: 'DEF',
    3: 'MID',
    4: 'FWD'
  }
  return positions[elementType] || 'Unknown'
}

/**
 * Get full position name
 */
export const getFullPositionName = (elementType) => {
  const positions = {
    1: 'Goalkeeper',
    2: 'Defender',
    3: 'Midfielder',
    4: 'Forward'
  }
  return positions[elementType] || 'Unknown'
}

/**
 * Format fixture opponent (with home/away indicator)
 */
export const formatFixtureOpponent = (opponent, isHome) => {
  return `${isHome ? 'vs' : '@'} ${opponent}`
}

/**
 * Format gameweek
 */
export const formatGameweek = (gw) => {
  if (gw === null || gw === undefined) return 'TBD'
  return `GW${gw}`
}

