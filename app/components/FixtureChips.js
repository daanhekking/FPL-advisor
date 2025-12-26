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
        <span key={idx}>
          <FixtureDifficultyTag
            difficulty={fixture.difficulty}
            showLabel={false}
          />
          <span style={{ marginLeft: 4, marginRight: 8 }}>
            {fixture.isHome ? '' : '@'}{fixture.opponent}
          </span>
        </span>
      ))}
    </Space>
  )
}

