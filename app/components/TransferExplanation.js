'use client'

import React from 'react'
import { Card, Space, Typography, Tag, Divider, Row, Col } from 'antd'
import {
  SwapOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  RiseOutlined
} from '@ant-design/icons'

const { Text, Paragraph } = Typography

/**
 * Parse transfer explanation into structured sections
 */
const parseTransferExplanation = (explanation) => {
  const sections = {
    selling: null,
    buying: null,
    impact: null
  }
  
  // Extract selling section
  const sellingMatch = explanation.match(/📤\s*\*\*Selling\s+([^*]+)\*\*[^:]*:\s*([^📥📈]+)/)
  if (sellingMatch) {
    const playerInfo = sellingMatch[1].match(/([^(]+)\s*\(([^)]+)\)/)
    sections.selling = {
      player: playerInfo ? playerInfo[1].trim() : sellingMatch[1],
      info: playerInfo ? playerInfo[2] : '',
      reasons: sellingMatch[2].split(/[;.]/).map(r => r.trim()).filter(r => r.length > 10)
    }
  }
  
  // Extract buying section
  const buyingMatch = explanation.match(/📥\s*\*\*Buying\s+([^*]+)\*\*[^:]*:\s*([^📈]+)/)
  if (buyingMatch) {
    const playerInfo = buyingMatch[1].match(/([^(]+)\s*\(([^)]+)\)/)
    sections.buying = {
      player: playerInfo ? playerInfo[1].trim() : buyingMatch[1],
      info: playerInfo ? playerInfo[2] : '',
      reasons: buyingMatch[2].split(/[;.]/).map(r => r.trim()).filter(r => r.length > 10)
    }
  }
  
  // Extract impact section
  const impactMatch = explanation.match(/📈\s*\*\*Expected Impact[^:]*:\*\*\s*([^.]+\.)/)
  if (impactMatch) {
    sections.impact = impactMatch[1].trim()
  }
  
  return sections
}

/**
 * Extract metrics from reason text
 */
const extractMetrics = (text) => {
  const metrics = []
  
  // Form
  const formMatch = text.match(/form[:\s]+([0-9.]+)/i)
  if (formMatch) {
    const value = parseFloat(formMatch[1])
    metrics.push({
      label: 'Form',
      value: value.toFixed(1),
      color: value >= 5 ? 'success' : value >= 4 ? 'processing' : 'warning'
    })
  }
  
  // Points
  const pointsMatch = text.match(/([0-9]+)\s+pts/)
  if (pointsMatch) {
    metrics.push({ label: 'Points', value: pointsMatch[1], color: 'default' })
  }
  
  // Price
  const priceMatch = text.match(/£([0-9.]+)m/)
  if (priceMatch) {
    metrics.push({ label: 'Price', value: `£${priceMatch[1]}m`, color: 'default' })
  }
  
  // Difficulty
  const diffMatch = text.match(/(?:difficulty|diff)[:\s]+([0-9.]+)/i)
  if (diffMatch) {
    const value = parseFloat(diffMatch[1])
    metrics.push({
      label: 'Fixtures',
      value: value.toFixed(1),
      color: value <= 2.5 ? 'success' : value <= 3.5 ? 'warning' : 'error'
    })
  }
  
  return metrics
}

/**
 * Render a player card (selling or buying)
 */
const renderPlayerCard = (playerData, type) => {
  if (!playerData) return null
  
  const isSelling = type === 'selling'
  const icon = isSelling ? <SwapOutlined /> : <ThunderboltOutlined />
  const titleColor = isSelling ? '#ff4d4f' : '#52c41a'
  
  return (
    <Card
      size="small"
      style={{ height: '100%' }}
      styles={{ body: { padding: 16 } }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {/* Header */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            {icon}
            <Text strong style={{ color: titleColor }}>
              {isSelling ? 'OUT' : 'IN'}
            </Text>
          </Space>
          {playerData.info && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {playerData.info}
            </Text>
          )}
        </Space>
        
        {/* Player name */}
        <Text strong style={{ fontSize: 16 }}>
          {playerData.player}
        </Text>
        
        {/* Metrics */}
        {playerData.reasons.length > 0 && (
          <Space size={4} wrap>
            {extractMetrics(playerData.reasons.join(' ')).map((metric, idx) => (
              <Tag key={idx} color={metric.color}>
                {metric.label}: {metric.value}
              </Tag>
            ))}
          </Space>
        )}
        
        <Divider style={{ margin: '8px 0' }} />
        
        {/* Reasons */}
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text type="secondary" strong style={{ fontSize: 12 }}>
            {isSelling ? 'WHY SELL:' : 'WHY BUY:'}
          </Text>
          {playerData.reasons.slice(0, 4).map((reason, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>•</Text>
              <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>
                {reason}
              </Text>
            </div>
          ))}
        </Space>
      </Space>
    </Card>
  )
}

/**
 * TransferExplanation Component
 * Renders a well-structured transfer recommendation with selling and buying analysis
 */
export const TransferExplanation = ({ explanation, index }) => {
  if (!explanation) return null
  
  const sections = parseTransferExplanation(explanation)
  
  // Fallback to simple rendering if parsing fails
  if (!sections.selling && !sections.buying) {
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Text type="secondary">{explanation}</Text>
      </Card>
    )
  }
  
  return (
    <Card 
      size="small"
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <SwapOutlined style={{ color: '#1890ff' }} />
          <Text strong>Transfer {index}</Text>
        </Space>
      }
      styles={{ body: { padding: 16 } }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* Player comparison */}
        <Row gutter={16}>
          <Col xs={24} md={12}>
            {renderPlayerCard(sections.selling, 'selling')}
          </Col>
          <Col xs={24} md={12}>
            {renderPlayerCard(sections.buying, 'buying')}
          </Col>
        </Row>
        
        {/* Arrow indicator for mobile */}
        <div style={{ textAlign: 'center', display: 'block' }}>
          <ArrowRightOutlined 
            style={{ 
              fontSize: 24, 
              color: '#1890ff',
              transform: 'rotate(90deg)'
            }} 
            className="md:rotate-0"
          />
        </div>
        
        {/* Expected Impact */}
        {sections.impact && (
          <Card
            size="small"
            style={{ 
              background: 'rgba(24, 144, 255, 0.05)',
              borderColor: '#1890ff'
            }}
          >
            <Space>
              <RiseOutlined style={{ color: '#1890ff', fontSize: 16 }} />
              <div>
                <Text type="secondary" strong style={{ fontSize: 12, display: 'block' }}>
                  EXPECTED IMPACT
                </Text>
                <Text style={{ fontSize: 13 }}>
                  {sections.impact}
                </Text>
              </div>
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  )
}

