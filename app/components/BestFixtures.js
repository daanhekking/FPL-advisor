'use client'

import React, { useState } from 'react'
import { Card, Typography, Space, Tag, Button, Tooltip } from 'antd'
import { TrophyOutlined, CalendarOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { formatPrice, getDifficultyColor } from '../utils/helpers'
import { FixtureChips } from './FixtureChips'
import { StandardTable } from './StandardTable'
import {
  createPlayerColumn,
  createPositionColumn,
  createPriceColumn,
  createFormColumn,
  createTotalPointsColumn,
  createPPGColumn
} from './TableColumns'

const { Text } = Typography

/**
 * BestFixtures Component
 * Shows teams grouped by fixture difficulty with detailed player analysis
 */
export const BestFixtures = ({ bestFixturesData, loading }) => {
  const [expandedTeams, setExpandedTeams] = useState(new Set())

  if (!bestFixturesData || bestFixturesData.length === 0) {
    return (
      <Card>
        <Text type="secondary">No fixture data available</Text>
      </Card>
    )
  }

  // Define table columns
  const columns = [
    createPlayerColumn({ showPosition: false, showForm: false }),
    createPositionColumn(),
    createPriceColumn(),
    createFormColumn(),
    createPPGColumn(),
    createTotalPointsColumn(),
    {
      title: (
        <Tooltip title="Expected performance score based on AI analysis. Higher = Better.">
          <Space>
            <TrophyOutlined />
            AI Score
          </Space>
        </Tooltip>
      ),
      key: 'performanceScore',
      width: 140,
      align: 'center',
      sorter: (a, b) => (b.finalScore || 0) - (a.finalScore || 0),
      render: (_, record) => {
        const score = record.finalScore || 0
        if (!score) return <Text type="secondary">-</Text>

        let color = 'default'
        let label = 'Average'
        if (score >= 1000) { color = 'gold'; label = 'Elite' }
        else if (score >= 800) { color = 'success'; label = 'Excellent' }
        else if (score >= 600) { color = 'processing'; label = 'Good' }
        else if (score < 400) { color = 'warning'; label = 'Below Average' }

        return (
          <Tooltip title={`${label} performance expected`}>
            <Tag color={color} style={{ fontSize: 13, padding: '2px 8px', margin: 0 }}>
              {score.toFixed(0)}
            </Tag>
          </Tooltip>
        )
      }
    }
  ]

  // Group players by team
  const teamGroups = bestFixturesData.reduce((acc, player) => {
    const teamId = player.team?.id
    if (!teamId) return acc

    if (!acc[teamId]) {
      acc[teamId] = {
        team: player.team,
        avgDifficulty: player.avgDifficulty,
        fixtures: player.fixtures || [],
        players: []
      }
    }

    acc[teamId].players.push(player)
    return acc
  }, {})

  // Convert to array and sort by difficulty
  const teams = Object.values(teamGroups)
    .sort((a, b) => a.avgDifficulty - b.avgDifficulty)

  // Sort players within each team by performance score
  teams.forEach(team => {
    team.players.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
  })

  const toggleExpand = (teamId) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
    }
    setExpandedTeams(newExpanded)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {teams.map((team) => {
        const isExpanded = expandedTeams.has(team.team.id)
        const playersToShow = isExpanded ? team.players : team.players.slice(0, 3)

        return (
          <Card
            key={team.team.id}
            title={
              <Space size="middle" wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <CalendarOutlined style={{ color: '#1890ff' }} />
                  <Text strong style={{ fontSize: 16 }}>{team.team.name}</Text>
                  <Tag color={getDifficultyColor(team.avgDifficulty)} style={{ marginLeft: 8 }}>
                    {team.avgDifficulty.toFixed(1)} Diff
                  </Tag>
                </Space>
                <FixtureChips fixtures={team.fixtures} maxShow={5} />
              </Space>
            }
          >
            <StandardTable
              dataSource={playersToShow}
              columns={columns}
              pagination={false}
              size="small"
              scroll={{ x: 700 }}
            />

            {team.players.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Button
                  type="link"
                  onClick={() => toggleExpand(team.team.id)}
                  icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                  style={{ height: 'auto', padding: '4px 0' }}
                >
                  {isExpanded ? 'Show less' : `Show ${team.players.length - 3} more players`}
                </Button>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}










