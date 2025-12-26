'use client'

import React from 'react'
import { Spin, Alert, Space, Typography, Tag, Badge, Select, Button, Card, Tooltip, TrophyOutlined, CheckOutlined } from '../design-system'
import { SquadSection } from './SquadSection'
import { TransferExplanation } from './TransferExplanation'
import {
  generateGKPExplanation,
  generateOutfieldExplanation,
  generateTransferExplanations
} from '../utils/squad-explanations'

const { Text, Title } = Typography
const { Option } = Select

/**
 * RecommendedTeamTab Component
 * Displays recommended team after transfers with detailed explanations
 * 
 * @param {Object} recommendations - Recommendations data
 * @param {Object} recommendedSquadGrouped - Recommended squad grouped by position
 * @param {Object} captaincyRecommendation - Captain and vice-captain recommendation
 * @param {boolean} loading - Loading state
 * @param {Function} onTransfersChange - Handler for transfer count change
 * @param {number} currentTransfersToUse - Currently selected transfer count
 */
export const RecommendedTeamTab = ({
  recommendations,
  recommendedSquadGrouped,
  captaincyRecommendation,
  loading,
  onTransfersChange,
  currentTransfersToUse
}) => {
  const [selectedTransfers, setSelectedTransfers] = React.useState(currentTransfersToUse || 1)

  // Sync with prop if it changes externally
  React.useEffect(() => {
    if (currentTransfersToUse !== null) {
      setSelectedTransfers(currentTransfersToUse)
    }
  }, [currentTransfersToUse])

  const handleApply = () => {
    onTransfersChange(selectedTransfers)
  }
  // Mark captain and vice-captain in squad data
  const squadWithCaptaincy = React.useMemo(() => {
    if (!captaincyRecommendation || !recommendedSquadGrouped) return recommendedSquadGrouped

    const captainId = captaincyRecommendation.captain?.id
    const viceId = captaincyRecommendation.vice?.id

    const updatePlayers = (players) => {
      return players.map(player => ({
        ...player,
        pick: {
          ...player.pick,
          is_captain: player.id === captainId,
          is_vice_captain: player.id === viceId
        }
        // performanceScore already exists from useSquadData
      }))
    }

    return {
      GKP: updatePlayers(recommendedSquadGrouped.GKP || []),
      DEF: updatePlayers(recommendedSquadGrouped.DEF || []),
      MID: updatePlayers(recommendedSquadGrouped.MID || []),
      FWD: updatePlayers(recommendedSquadGrouped.FWD || [])
    }
  }, [recommendedSquadGrouped, captaincyRecommendation])

  // Row className for styling transfers
  const getRowClassName = (record) => {
    if (record.isBeingSold) return 'transfer-out-row'
    if (record.isNew) return 'ant-table-row-selected'
    return ''
  }

  // Performance score column
  const performanceScoreColumn = [
    {
      title: (
        <Tooltip title="Expected performance score based on form, fixtures, price, and attacking output. Higher score = better expected performance.">
          <Space>
            <TrophyOutlined />
            Expected Performance
          </Space>
        </Tooltip>
      ),
      key: 'performanceScore',
      width: 180,
      align: 'center',
      sorter: (a, b) => {
        const scoreA = a.finalScore || a.performanceScore || 0
        const scoreB = b.finalScore || b.performanceScore || 0
        return scoreB - scoreA
      },
      render: (_, record) => {
        const score = record.finalScore || record.performanceScore || 0
        const rank = record.rank
        const penalty = record.penaltyApplied

        if (!score) return <Text type="secondary">-</Text>

        // Determine color based on score range
        let color = 'default'
        let label = 'Below Average'

        if (score >= 1000) {
          color = 'gold'
          label = 'Elite'
        } else if (score >= 800) {
          color = 'success'
          label = 'Excellent'
        } else if (score >= 600) {
          color = 'processing'
          label = 'Good'
        } else if (score >= 400) {
          color = 'default'
          label = 'Average'
        } else {
          color = 'warning'
          label = 'Below Average'
        }

        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Tooltip title={`${label} performance expected`}>
              <Tag color={color} style={{ fontSize: 13, padding: '2px 8px', margin: 0 }}>
                {(score || 0).toFixed(0)}
              </Tag>
            </Tooltip>
            {rank && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Rank #{rank}
              </Text>
            )}
            {penalty && penalty !== 'NONE' && !penalty.includes('Top') && (
              <Tag
                color={penalty.includes('60%') ? 'red' : 'orange'}
                style={{ fontSize: 10, margin: '2px 0 0 0', padding: '0 4px' }}
              >
                {penalty.includes('60%') ? '-60%' : '-30%'}
              </Tag>
            )}
          </Space>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Spin spinning={loading}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Strategy & Transfers Card */}
          <Card
            className="shadow-sm"
            title={
              <Space size="middle" wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space size="middle">
                  <CheckOutlined style={{ color: '#52c41a' }} />
                  <Text strong style={{ fontSize: 16 }}>Recommended Strategy & Transfers</Text>
                </Space>

                <Space size="large" wrap>
                  <Space>
                    <Text type="secondary" style={{ fontSize: 13 }}>Transfers: </Text>
                    <Select
                      value={selectedTransfers}
                      onChange={setSelectedTransfers}
                      style={{ width: 70 }}
                      size="small"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <Option key={num} value={num}>{num}</Option>
                      ))}
                    </Select>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={handleApply}
                      disabled={selectedTransfers === currentTransfersToUse}
                      size="small"
                    >
                      Apply
                    </Button>
                  </Space>

                  {recommendations?.suggestedTransfers && recommendations.suggestedTransfers.length > 0 && (
                    <Space size={4}>
                      <Text type="secondary" style={{ fontSize: 13 }}>Cost/Gain: </Text>
                      <Text strong style={{
                        fontSize: 13,
                        color: (() => {
                          const costGain = recommendations.suggestedTransfers.reduce((sum, transfer) => {
                            const soldPrice = transfer.out.now_cost / 10
                            const boughtPrice = transfer.in.now_cost / 10
                            return sum + (soldPrice - boughtPrice)
                          }, 0)
                          return costGain >= 0 ? '#52c41a' : '#ff4d4f'
                        })()
                      }}>
                        {(() => {
                          const costGain = recommendations.suggestedTransfers.reduce((sum, transfer) => {
                            const soldPrice = transfer.out.now_cost / 10
                            const boughtPrice = transfer.in.now_cost / 10
                            return sum + (soldPrice - boughtPrice)
                          }, 0)
                          return `£${(costGain || 0).toFixed(1)}m`
                        })()}
                      </Text>
                    </Space>
                  )}

                  {recommendations?.formation && (
                    <Space size={4}>
                      <Text type="secondary" style={{ fontSize: 13 }}>Formation: </Text>
                      <Tag style={{ margin: 0 }}>
                        {recommendations.formation.DEF}-{recommendations.formation.MID}-{recommendations.formation.FWD}
                      </Tag>
                    </Space>
                  )}
                </Space>
              </Space>
            }
          >
            {/* Status Badges */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
              <Badge status="success" text={<Text type="secondary" style={{ fontSize: 12 }}>Transfer In</Text>} />
              <Badge status="default" text={<Text type="secondary" style={{ fontSize: 12, opacity: 0.6 }}>Transfer Out</Text>} />
            </div>

            {/* Explanations Section */}
            {recommendations?.suggestedTransfers && recommendations.suggestedTransfers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {generateTransferExplanations(recommendations.suggestedTransfers).map(({ index, reason }) => (
                  <TransferExplanation
                    key={index}
                    explanation={reason}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <Alert
                message="No immediate transfers recommended based on current strategy."
                type="info"
                showIcon
              />
            )}
          </Card>

          {/* Squad Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Goalkeepers */}
            <SquadSection
              title="Goalkeepers"
              players={squadWithCaptaincy.GKP}
              explanation={generateGKPExplanation(squadWithCaptaincy.GKP)}
              rowClassName={getRowClassName}
              extraColumns={performanceScoreColumn}
            />

            {/* Defenders */}
            <SquadSection
              title="Defenders"
              players={squadWithCaptaincy.DEF}
              explanation={generateOutfieldExplanation(squadWithCaptaincy.DEF, 'Defenders')}
              rowClassName={getRowClassName}
              extraColumns={performanceScoreColumn}
            />

            {/* Midfielders */}
            <SquadSection
              title="Midfielders"
              players={squadWithCaptaincy.MID}
              explanation={generateOutfieldExplanation(squadWithCaptaincy.MID, 'Midfielders')}
              rowClassName={getRowClassName}
              extraColumns={performanceScoreColumn}
            />

            {/* Forwards */}
            <SquadSection
              title="Forwards"
              players={squadWithCaptaincy.FWD}
              explanation={generateOutfieldExplanation(squadWithCaptaincy.FWD, 'Forwards')}
              rowClassName={getRowClassName}
              extraColumns={performanceScoreColumn}
            />
          </div>
        </div>
      </Spin>
    </div>
  )
}

