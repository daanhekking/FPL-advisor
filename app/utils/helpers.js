/**
 * Centralized utility functions used across the application
 */

export const POSITIONS = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD'
}

export const getPositionName = (elementType) => {
  return POSITIONS[elementType] || 'Unknown'
}

export const formatPrice = (price) => {
  return `£${(price / 10).toFixed(1)}m`
}

export const getDifficultyColor = (difficulty) => {
  if (difficulty <= 2) return 'success'
  if (difficulty <= 3) return 'warning'
  return 'error'
}

export const calculateAvgPoints = (totalPoints, minutes) => {
  return minutes > 0 ? (totalPoints / (minutes / 90)).toFixed(1) : '0.0'
}

export const formatPPG = (ppg) => {
  return parseFloat(ppg || 0).toFixed(1)
}

