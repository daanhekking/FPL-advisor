'use client'

import React from 'react'
import { Spin, Alert, Space, Typography, Tag, Badge } from 'antd'
import { SquadSection } from './SquadSection'
import { TransferExplanation } from './TransferExplanation'
import { 
  generateGKPExplanation, 
  generateOutfieldExplanation,
  generateTransferExplanations 
} from '../utils/squad-explanations'

const { Text, Title } = Typography

/**
 * RecommendedTeamTab Component
 * Displays recommended team after transfers with detailed explanations
 * 
 * @param {Object} recommendations - Recommendations data
 * @param {Object} recommendedSquadGrouped - Recommended squad grouped by position
 * @param {boolean} loading - Loading state
 */
export const RecommendedTeamTab = ({ 
  recommendations, 
  recommendedSquadGrouped, 
  loading 
}) => {
  // Row className for styling transfers
  const getRowClassName = (record) => {
    if (record.isBeingSold) return 'transfer-out-row'
    if (record.isNew) return 'ant-table-row-selected'
    return ''
  }

  return (
    <div>
      <Spin spinning={loading}>
        {/* Header with info */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 12 
          }}>
            <Title level={5} className="mb-0">Recommended Team for This Gameweek</Title>
            <Space size="large">
              {recommendations?.suggestedTransfers && (
                <div>
                  <Text type="secondary">Recommended amount of transfers: </Text>
                  <Tag color="blue">{recommendations.suggestedTransfers.length}</Tag>
                </div>
              )}
              {recommendations?.suggestedTransfers && recommendations.suggestedTransfers.length > 0 && (
                <div>
                  <Text type="secondary">Cost/Gain: </Text>
                  <Text strong style={{ 
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
                      return `£${costGain.toFixed(1)}m`
                    })()}
                  </Text>
                </div>
              )}
            </Space>
          </div>
          
          {/* Legend and Formation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size="middle">
              <Badge status="success" text="Transfer In" />
              <Badge status="default" text="Transfer Out" style={{ opacity: 0.6 }} />
            </Space>
            
            {recommendations?.formation && (
              <Space>
                <Text type="secondary">Formation:</Text>
                <Tag>
                  {recommendations.formation.DEF}-{recommendations.formation.MID}-{recommendations.formation.FWD}
                </Tag>
              </Space>
            )}
          </div>
        </div>

        {/* Explanations Section */}
        {recommendations && (
          <div style={{ marginBottom: 24 }}>
            {/* Transfer Recommendations Explanation */}
            {recommendations.suggestedTransfers && recommendations.suggestedTransfers.length > 0 && (
              <div>
                {generateTransferExplanations(recommendations.suggestedTransfers).map(({ index, reason }) => (
                  <TransferExplanation
                    key={index}
                    explanation={reason}
                    index={index}
                  />
                ))}
              </div>
            )}

            {/* Starting 11 Explanation */}
            {recommendations.starting11 && recommendations.starting11.length > 0 && (
              <Alert
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
                message={`Starting 11 Formation: ${recommendations.formation.DEF}-${recommendations.formation.MID}-${recommendations.formation.FWD}`}
                description={
                  <div>
                    <Text>
                      This formation was selected because it maximizes your team&apos;s overall score. 
                      The starting 11 includes your best {11} players based on form, fixtures, and availability. 
                      {recommendations.starting11.some(p => {
                        const chanceOfPlaying = p.chance_of_playing_next_round
                        return chanceOfPlaying !== null && chanceOfPlaying >= 75 && chanceOfPlaying < 100
                      }) && ' Note: Some players have uncertain availability but are still selected as your best options.'}
                    </Text>
                  </div>
                }
              />
            )}

              {/* Bench Explanation */}
              {recommendations.bench && recommendations.bench.length > 0 && (
                <Alert
                  type="info"
                  message="Bench Players"
                description={
                  <div>
                    <Text>
                      Players on the bench: {recommendations.bench.map(p => p.web_name).join(', ')}. 
                      {' '}
                      {(() => {
                        const benchReasons = []
                        const hasInjured = recommendations.bench.some(p => 
                          p.chance_of_playing_next_round !== null && p.chance_of_playing_next_round < 75
                        )
                        const hasPoorForm = recommendations.bench.some(p => parseFloat(p.form || 0) < 3.0)
                        const hasBadFixtures = recommendations.bench.some(p => {
                          const fixtures = p.fixtures || []
                          return fixtures[0]?.difficulty >= 4
                        })
                        
                        if (hasInjured) benchReasons.push('injury concerns')
                        if (hasPoorForm) benchReasons.push('poor form')
                        if (hasBadFixtures) benchReasons.push('difficult fixtures')
                        
                        if (benchReasons.length > 0) {
                          return `Benched due to: ${benchReasons.join(', ')}.`
                        }
                        return 'Benched as starting 11 provides better overall score.'
                      })()}
                    </Text>
                  </div>
                }
              />
            )}
          </div>
        )}

        {/* Squad Sections */}
        <div>
          {/* Goalkeepers */}
          <SquadSection
            title="Goalkeepers"
            players={recommendedSquadGrouped.GKP}
            explanation={generateGKPExplanation(recommendedSquadGrouped.GKP)}
            rowClassName={getRowClassName}
          />

          {/* Defenders */}
          <SquadSection
            title="Defenders"
            players={recommendedSquadGrouped.DEF}
            explanation={generateOutfieldExplanation(recommendedSquadGrouped.DEF, 'Defenders')}
            rowClassName={getRowClassName}
          />

          {/* Midfielders */}
          <SquadSection
            title="Midfielders"
            players={recommendedSquadGrouped.MID}
            explanation={generateOutfieldExplanation(recommendedSquadGrouped.MID, 'Midfielders')}
            rowClassName={getRowClassName}
          />

          {/* Forwards */}
          <SquadSection
            title="Forwards"
            players={recommendedSquadGrouped.FWD}
            explanation={generateOutfieldExplanation(recommendedSquadGrouped.FWD, 'Forwards')}
            rowClassName={getRowClassName}
          />
        </div>
      </Spin>
    </div>
  )
}

