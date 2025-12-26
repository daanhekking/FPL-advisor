'use client'

import React from 'react'
import { Card, Typography, Space, Tag, Alert, Divider, TrophyOutlined, StarOutlined, FireOutlined } from '../design-system'
import { StandardTable } from './StandardTable'

const { Title, Text } = Typography

/**
 * CaptaincyAnalysis Component
 * Shows all players ranked by their captaincy score with detailed breakdown
 */
export const CaptaincyAnalysis = ({ captaincyRecommendation, loading }) => {
  if (!captaincyRecommendation) {
    return (
      <Alert
        type="info"
        message="No captaincy data available"
        description="Captaincy recommendations will appear once you have a recommended team."
      />
    )
  }

  const { captain, allPlayersScored } = captaincyRecommendation

  // Define columns for the captaincy table
  const columns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 60,
      render: (_, record, index) => {
        if (index === 0) {
          return <Tag icon={<TrophyOutlined />} color="gold">1st</Tag>
        } else if (index === 1) {
          return <Tag icon={<StarOutlined />} color="blue">2nd</Tag>
        } else {
          return <Text type="secondary">{index + 1}</Text>
        }
      }
    },
    {
      title: 'Player',
      key: 'player',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.web_name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.team?.name || 'Unknown Team'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      width: 80,
      render: (position) => <Tag>{position}</Tag>
    },
    {
      title: 'Performance Score',
      key: 'performanceScore',
      width: 160,
      sorter: (a, b) => {
        const scoreA = a.finalScore || a.captaincyScore || 0
        const scoreB = b.finalScore || b.captaincyScore || 0
        return scoreB - scoreA
      },
      render: (_, record, index) => {
        const score = record.finalScore || record.captaincyScore || 0
        const rank = record.rank || (index + 1)

        let color = 'default'
        if (index === 0) color = 'success'
        else if (index < 3) color = 'processing'
        else if (index < 5) color = 'warning'

        return (
          <Space direction="vertical" size={0}>
            <Tag color={color} style={{ fontSize: 14, padding: '4px 8px' }}>
              {(score || 0).toFixed(0)}
            </Tag>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Rank #{rank}
            </Text>
          </Space>
        )
      }
    },
    {
      title: 'Penalty',
      key: 'penalty',
      width: 120,
      render: (_, record) => {
        const penalty = record.penaltyApplied
        if (!penalty || penalty === 'NONE' || penalty.includes('Top')) {
          return <Tag color="green">None</Tag>
        } else if (penalty.includes('30%')) {
          return <Tag color="orange">-30%</Tag>
        } else if (penalty.includes('60%')) {
          return <Tag color="red">-60%</Tag>
        }
        return <Text type="secondary">-</Text>
      }
    },
    {
      title: 'Form',
      dataIndex: 'form',
      key: 'form',
      width: 70,
      render: (form) => {
        const formValue = parseFloat(form || 0)
        const color = formValue >= 5 ? 'success' : formValue >= 4 ? 'processing' : 'default'
        return <Tag color={color}>{formValue.toFixed(1)}</Tag>
      }
    },
    {
      title: 'Total Points',
      dataIndex: 'total_points',
      key: 'total_points',
      width: 100,
      sorter: (a, b) => b.total_points - a.total_points,
      render: (points) => <Text>{points || 0}</Text>
    },
    {
      title: 'Price',
      dataIndex: 'now_cost',
      key: 'price',
      width: 80,
      render: (cost) => <Text>£{((cost || 0) / 10).toFixed(1)}m</Text>
    },
    {
      title: 'Next Fixture',
      key: 'fixture',
      width: 150,
      render: (_, record) => {
        if (!record.nextFixture) return <Text type="secondary">TBD</Text>

        const { opponent, difficulty, isHome } = record.nextFixture
        const difficultyColor =
          difficulty <= 2 ? 'success' :
            difficulty === 3 ? 'warning' :
              'error'

        return (
          <Space size={4}>
            <Text style={{ fontSize: 12 }}>
              {isHome ? 'vs' : '@'} {opponent}
            </Text>
            <Tag color={difficultyColor} style={{ margin: 0 }}>
              {difficulty}
            </Tag>
          </Space>
        )
      }
    },
    {
      title: 'Fixture Rating',
      dataIndex: 'fixtureRating',
      key: 'fixtureRating',
      width: 120,
      render: (rating) => {
        const color =
          rating === 'Excellent' ? 'success' :
            rating === 'Good' ? 'processing' :
              rating === 'Tough' ? 'warning' :
                rating === 'Very Tough' ? 'error' :
                  'default'

        return <Tag color={color}>{rating || 'Unknown'}</Tag>
      }
    }
  ]

  return (
    <div>
      {/* Captain Recommendation Card */}
      <Card
        style={{ marginBottom: 24 }}
        styles={{ body: { padding: 24 } }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <TrophyOutlined style={{ fontSize: 32, color: '#faad14' }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Recommended Captain
              </Title>
              <Text type="secondary">Based on comprehensive analysis</Text>
            </div>
          </div>

          <Divider style={{ margin: 0 }} />

          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size={12}>
                <FireOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                <div>
                  <Text strong style={{ fontSize: 18 }}>{captain.web_name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {captain.team?.name} • {captain.position}
                  </Text>
                </div>
              </Space>
              <Tag color="gold" style={{ fontSize: 16, padding: '6px 12px' }}>
                Score: {(captain.captaincyScore || 0).toFixed(0)}
              </Tag>
            </div>

            {/* Key Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 12,
              marginTop: 12
            }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Form</Text>
                <br />
                <Text strong>{parseFloat(captain.form || 0).toFixed(1)}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Total Points</Text>
                <br />
                <Text strong>{captain.total_points || 0}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Price</Text>
                <br />
                <Text strong>£{((captain.now_cost || 0) / 10).toFixed(1)}m</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Next Fixture</Text>
                <br />
                <Space size={4}>
                  <Text strong>
                    {captain.nextFixture ?
                      `${captain.nextFixture.isHome ? 'vs' : '@'} ${captain.nextFixture.opponent}` :
                      'TBD'
                    }
                  </Text>
                  {captain.nextFixture && (
                    <Tag color={
                      captain.nextFixture.difficulty <= 2 ? 'success' :
                        captain.nextFixture.difficulty === 3 ? 'warning' :
                          'error'
                    }>
                      {captain.nextFixture.difficulty}
                    </Tag>
                  )}
                </Space>
              </div>
            </div>

            {/* Reasoning */}
            {captaincyRecommendation.reasoning && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <Alert
                  type="info"
                  message="Why this choice?"
                  description={captaincyRecommendation.reasoning}
                  showIcon
                />
              </>
            )}
          </Space>
        </Space>
      </Card>

      {/* All Players Ranked Table */}
      <Card
        title={
          <Space>
            <StarOutlined />
            <Text strong>All Players Ranked by Captaincy Score</Text>
          </Space>
        }
      >
        <StandardTable
          loading={loading}
          dataSource={allPlayersScored || []}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `${total} players`
          }}
          rowClassName={(record, index) => {
            if (index === 0) return 'ant-table-row-selected'
            return ''
          }}
        />
      </Card>

      {/* Explanation */}
      <Alert
        type="info"
        style={{ marginTop: 16 }}
        message="How is the captaincy score calculated?"
        description={
          <div>
            <Text>
              The captaincy score is calculated based on multiple factors:
            </Text>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li><strong>Total Points (×3)</strong> - Season-long quality and consistency</li>
              <li><strong>Form (×20)</strong> - Recent performance over last few gameweeks</li>
              <li><strong>Price (×15)</strong> - Reflects manager assessment of quality</li>
              <li><strong>Points Per Game (×10)</strong> - Consistency when playing</li>
              <li><strong>Goals (×8) & Assists (×5)</strong> - Direct attacking output</li>
              <li><strong>Fixture Difficulty</strong> - Bonus for easy fixtures, penalty for tough ones</li>
              <li><strong>Home Advantage (+8)</strong> - Playing at home</li>
              <li><strong>Ownership</strong> - Template captain indicator</li>
            </ul>
          </div>
        }
        showIcon
      />
    </div>
  )
}

