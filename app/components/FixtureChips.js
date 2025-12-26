'use client'

import { Space, FixtureDifficultyTag } from '../design-system'

/**
 * Standardized component for displaying fixture chips
 * Used consistently across the application
 */
export function FixtureChips({ fixtures, maxShow = 5, showTooltip = false }) {
  if (!fixtures || fixtures.length === 0) return null

  return (
    <Space size={4} wrap>
      {fixtures.slice(0, maxShow).map((fixture, idx) => (
        <FixtureDifficultyTag
          key={idx}
          difficulty={fixture.difficulty}
          showLabel={false}
          content={`${fixture.isHome ? '' : '@'}${fixture.opponent}`}
        />
      ))}
    </Space>
  )
}

