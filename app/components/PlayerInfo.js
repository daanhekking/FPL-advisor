'use client'

import { Typography, Badge } from 'antd'

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
      <Text strong>
        {isCaptain && '(C) '}
        {isViceCaptain && '(V) '}
        {name}
      </Text>
      {isBenched && <Badge count="Bench" style={{ marginLeft: 8, backgroundColor: '#999' }} />}
      <br />
      <Text type="secondary" style={{ fontSize: 12 }}>
        {team && `${team} • `}
        {position && `${position}${showForm ? ' • ' : ''}`}
        {showForm && form && `Form ${form}`}
        {injuryStatus && ` • ${injuryStatus}% fit`}
      </Text>
    </div>
  )
}

