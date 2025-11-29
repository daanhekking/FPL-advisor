/**
 * FPL Advisor Design System - Theme Configuration
 * Aligned with Ant Design's default theme and dark mode
 * Reference: https://ant.design/components/overview/
 */

export const FPL_COLORS = {
  // Ant Design Standard Colors - for reference only
  // Use Ant Design's default theming instead of overriding
  
  // Status Colors (Ant Design defaults)
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  primary: '#1890ff',
  
  // Fixture Difficulty Colors (aligned with Ant Design status colors)
  fixture: {
    veryEasy: '#52c41a',    // Success green
    easy: '#52c41a',        // Success green
    moderate: '#faad14',    // Warning orange
    hard: '#ff7a45',        // Orange-red
    veryHard: '#ff4d4f',    // Error red
  }
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const BORDER_RADIUS = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
}

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
}

/**
 * Ant Design Theme Token Configuration
 * Minimal overrides - let Ant Design handle most styling
 */
export const getThemeConfig = () => ({
  token: {
    // Only override font family - everything else uses Ant Design defaults
    fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  // No component overrides - use Ant Design's beautiful defaults
})

