'use client'

import React from 'react'
import { Typography, Card, Space } from 'antd'
import {
  UserOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  AimOutlined
} from '@ant-design/icons'
import { StandardTable } from './StandardTable'
import { getSquadTableColumns } from './TableColumns'
import { SquadExplanation } from './SquadExplanation'

const { Title, Text } = Typography

/**
 * SquadSection Component
 * Displays a position group (GKP, DEF, MID, FWD) with table and explanation
 * 
 * @param {string} title - Section title (e.g., "Goalkeepers")
 * @param {Array} players - Players in this position
 * @param {string} explanation - Text explanation for this position group
 * @param {Function} rowClassName - Optional function to determine row className
 * @param {Array} extraColumns - Optional extra columns to add to the table
 */
export const SquadSection = ({ title, players, explanation, rowClassName, extraColumns = [], columns: customColumns }) => {
  if (players.length === 0) return null

  // Count non-sold players
  const activePlayers = players.filter(p => !p.isBeingSold).length

  // Use custom columns if provided, otherwise combine standard columns with extra columns
  const columns = customColumns || [...getSquadTableColumns(), ...extraColumns]

  // Get icon based on title
  const getIcon = () => {
    if (title.includes('Goalkeeper')) return <UserOutlined style={{ color: '#faad14' }} />
    if (title.includes('Defender')) return <SafetyOutlined style={{ color: '#1890ff' }} />
    if (title.includes('Midfielder')) return <ThunderboltOutlined style={{ color: '#722ed1' }} />
    if (title.includes('Forward')) return <AimOutlined style={{ color: '#f5222d' }} />
    return null
  }

  return (
    <Card
      className="shadow-sm"
      title={
        <Space>
          {getIcon()}
          <Text strong style={{ fontSize: 16 }}>
            {title} <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>({activePlayers})</Text>
          </Text>
        </Space>
      }
    >
      <StandardTable
        dataSource={players}
        columns={columns}
        rowKey="id"
        pagination={false}
        rowClassName={rowClassName}
      />
      {explanation && <SquadExplanation explanation={explanation} />}
    </Card>
  )
}
