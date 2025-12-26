/**
 * Design System - Color Utilities
 * Returns Ant Design standard color names for consistent theming
 * Reference: https://ant.design/components/overview/
 */

/**
 * Get difficulty color for fixture display
 * Returns Ant Design color name (not hex)
 */
export const getDifficultyColor = (difficulty) => {
  if (difficulty <= 2) return 'success'
  if (difficulty === 3) return 'default' // Neutral
  if (difficulty >= 4) return 'error'
  return 'default'
}

/**
 * Get difficulty hex color (Ant Design standard colors)
 */
export const getDifficultyHexColor = (difficulty) => {
  if (difficulty <= 2) return '#52c41a'  // Ant Design success
  if (difficulty === 3) return '#595959'  // Dark grey (neutral)
  if (difficulty === 4) return '#ff7a45'  // Orange-red
  return '#ff4d4f'  // Ant Design error
}

/**
 * Get form color based on form value
 * Returns Ant Design color name
 */
export const getFormColor = (form) => {
  const formValue = parseFloat(form || 0)
  if (formValue >= 5.0) return 'success'
  if (formValue >= 4.0) return 'processing'
  if (formValue >= 3.0) return 'warning'
  return 'error'
}

/**
 * Get status color name
 */
export const getStatusColor = (status) => {
  const colors = {
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'processing',
    default: 'default'
  }
  return colors[status] || colors.default
}

