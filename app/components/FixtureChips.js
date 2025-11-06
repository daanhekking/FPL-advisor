'use client'

import { Space, Tag, Tooltip } from 'antd'

/**
 * Standardized component for displaying fixture chips
 * Used consistently across the application
 */
export function FixtureChips({ fixtures, maxShow = 5, showTooltip = false }) {
  const getDifficultyColor = (difficulty) => {
    if (difficulty <= 2) return 'success'
    if (difficulty <= 3) return 'warning'
    return 'error'
  }

  if (!fixtures || fixtures.length === 0) return null

  return (
    <Space size={4} wrap>
      {fixtures.slice(0, maxShow).map((fixture, idx) => {
        const tag = (
          <Tag color={getDifficultyColor(fixture.difficulty)} style={{ margin: 0 }}>
            {fixture.isHome ? '' : '@'}{fixture.opponent}
          </Tag>
        )
        
        // Only show tooltip if explicitly enabled (e.g., in transfer cards)
        return showTooltip ? (
          <Tooltip key={idx} title={`${fixture.isHome ? 'Home' : 'Away'} vs ${fixture.opponent}`}>
            {tag}
          </Tooltip>
        ) : (
          <span key={idx}>{tag}</span>
        )
      })}
    </Space>
  )
}

