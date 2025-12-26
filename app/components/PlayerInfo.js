'use client'

import { Typography, Badge, AvailabilityIndicator, Space } from '../design-system'

const { Text } = Typography

/**
 * Standardized component for displaying player information
 * Used in tables and cards across the application
 */
export function PlayerInfo({
  name,
  team,
  position,
  form,
  isCaptain,
  isViceCaptain,
  isBenched,
  injuryStatus,
  showForm = true
}) {
  return (
    <div>
      <Space size={4} wrap>
        <Text strong>
          {isCaptain && '(C) '}
          {isViceCaptain && '(V) '}
          {name}
        </Text>
        {isBenched && <Badge count="Bench" style={{ backgroundColor: '#999' }} />}
        {injuryStatus !== null && <AvailabilityIndicator chanceOfPlaying={injuryStatus} />}
      </Space>
      <br />
      <Text type="secondary" style={{ fontSize: 12 }}>
        {team && `${team} • `}
        {position && `${position}${showForm ? ' • ' : ''}`}
        {showForm && form && `Form ${form}`}
      </Text>
    </div>
  )
}

