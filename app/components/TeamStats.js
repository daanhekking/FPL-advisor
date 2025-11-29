'use client'

import React from 'react'
import { Card, Statistic, Row, Col } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'

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
            value={data?.myTeam?.summary_overall_rank?.toLocaleString() || 'N/A'}
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
            value={`£${(data?.myPicks?.entry_history?.value || 0) / 10}m`} 
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Statistic 
            title="Bank" 
            value={`£${(data?.myPicks?.entry_history?.bank || 0) / 10}m`} 
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Statistic 
            title="Free Transfers" 
            value={data?.myPicks?.transfers?.limit || 0} 
          />
        </Col>
      </Row>
    </Card>
  )
}

