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
import {
  createPlayerColumn,
  createPositionColumn,
  createPriceColumn,
  createGameweekColumn,
  createAvgDifficultyColumn,
  createFormColumn,
  createPPGColumn,
  createTotalPointsColumn
} from './TableColumns'

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

  // Identify the next 5 Gameweeks
  const nextGameweeks = React.useMemo(() => {
    if (!squadWithCaptaincy) return []
    const allPlayers = [
      ...(squadWithCaptaincy.GKP || []),
      ...(squadWithCaptaincy.DEF || []),
      ...(squadWithCaptaincy.MID || []),
      ...(squadWithCaptaincy.FWD || [])
    ]
    if (allPlayers.length === 0) return []
    // Find a player with fixtures to extract GW numbers
    const playerWithFixtures = allPlayers.find(p => p.fixtures && p.fixtures.length > 0)
    if (!playerWithFixtures) return []

    return playerWithFixtures.fixtures.slice(0, 5).map(f => f.event)
  }, [squadWithCaptaincy])

  // Custom Columns for Recommended Team
  const customColumns = React.useMemo(() => {
    // Basic performance column
    const perfCol = {
      title: (
        <Tooltip title="Expected performance score based on form, fixtures, price, and attacking output. Higher score = better expected performance.">
          <Space>
            <TrophyOutlined />
            Expected Performance
          </Space>
        </Tooltip>
      ),
      key: 'performanceScore',
      width: 140, // Slightly narrower since we have more columns now
      align: 'center',
      render: (_, record) => {
        const score = record.finalScore || record.performanceScore || 0
        const rank = record.rank
        if (!score) return <Text type="secondary">-</Text>

        let color = 'default'
        if (score >= 1000) color = 'gold'
        else if (score >= 800) color = 'success'
        else if (score >= 600) color = 'processing'
        else if (score >= 400) color = 'default'
        else color = 'warning'

        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Tag color={color} style={{ fontSize: 13, padding: '2px 8px', margin: 0 }}>
              {(score || 0).toFixed(0)}
            </Tag>
            {rank && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Rank #{rank}
              </Text>
            )}
          </Space>
        )
      }
    }

    if (nextGameweeks.length === 0) {
      return [createPlayerColumn({ showCaptaincy: true, showBench: true }), perfCol]
    }

    const gwColumns = nextGameweeks.map((gw, index) => createGameweekColumn(gw, index))

    return [
      createPlayerColumn({ showPosition: false, showForm: false, showCaptaincy: true, showBench: true }),
      createPositionColumn(),
      createPriceColumn(),
      ...gwColumns,
      createAvgDifficultyColumn(),
      perfCol,
      createFormColumn(),
      createPPGColumn(),
      createTotalPointsColumn()
    ]
  }, [nextGameweeks])

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
              columns={customColumns}
            />

            {/* Defenders */}
            <SquadSection
              title="Defenders"
              players={squadWithCaptaincy.DEF}
              explanation={generateOutfieldExplanation(squadWithCaptaincy.DEF, 'Defenders')}
              rowClassName={getRowClassName}
              columns={customColumns}
            />

            {/* Midfielders */}
            <SquadSection
              title="Midfielders"
              players={squadWithCaptaincy.MID}
              explanation={generateOutfieldExplanation(squadWithCaptaincy.MID, 'Midfielders')}
              rowClassName={getRowClassName}
              columns={customColumns}
            />

            {/* Forwards */}
            <SquadSection
              title="Forwards"
              players={squadWithCaptaincy.FWD}
              explanation={generateOutfieldExplanation(squadWithCaptaincy.FWD, 'Forwards')}
              rowClassName={getRowClassName}
              columns={customColumns}
            />
          </div>
        </div>
      </Spin>
    </div>
  )
}

