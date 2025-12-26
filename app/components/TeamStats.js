'use client'

import React from 'react'
import { Card, Statistic, Row, Col, TrophyOutlined, formatNumber, formatPrice, formatBank } from '../design-system'

/**
 * TeamStats Component
 * Displays key team statistics in a grid layout
 * 
 * @param {Object} data - FPL data containing team and picks information
 */
export const TeamStats = ({ data }) => {
  if (!data) return null

  return (
    <Card className="mb-6">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title="Overall Rank"
            value={formatNumber(data?.myTeam?.summary_overall_rank)}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title="Total Points"
            value={data?.myTeam?.summary_overall_points || 0}
            prefix={<TrophyOutlined />}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title="Team Value"
            value={formatPrice(data?.myPicks?.entry_history?.value)}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title="Bank"
            value={formatBank(data?.myPicks?.entry_history?.bank)}
          />
        </Col>
      </Row>
    </Card>
  )
}
