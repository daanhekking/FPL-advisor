'use client'

import React from 'react'
import { Typography } from 'antd'
import { StandardTable } from './StandardTable'
import { getSquadTableColumns } from './TableColumns'
import { SquadExplanation } from './SquadExplanation'

const { Title } = Typography

/**
 * SquadSection Component
 * Displays a position group (GKP, DEF, MID, FWD) with table and explanation
 * 
 * @param {string} title - Section title (e.g., "Goalkeepers")
 * @param {Array} players - Players in this position
 * @param {string} explanation - Text explanation for this position group
 * @param {Function} rowClassName - Optional function to determine row className
 */
export const SquadSection = ({ title, players, explanation, rowClassName }) => {
  if (players.length === 0) return null

  // Count non-sold players
  const activePlayers = players.filter(p => !p.isBeingSold).length

  return (
    <div className="mb-6">
      <Title level={5} className="mb-3">
        {title} ({activePlayers})
      </Title>
      <StandardTable
        dataSource={players}
        columns={getSquadTableColumns()}
        rowKey="id"
        pagination={false}
        rowClassName={rowClassName}
      />
      <SquadExplanation explanation={explanation} />
    </div>
  )
}

