'use client'

import React from 'react'
import { Typography, Space, Divider, Tag, Card } from 'antd'
import {
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  CalendarOutlined
} from '@ant-design/icons'

const { Text, Paragraph } = Typography

/**
 * Parse and structure the explanation text
 */
const parseExplanation = (explanation) => {
  if (!explanation) return null

  // Split by main delimiters
  const sections = explanation.split(' | ')
  
  return sections.map(section => {
    // Extract section title if present
    const titleMatch = section.match(/\*\*([^*]+)\*\*:/)
    const title = titleMatch ? titleMatch[1] : null
    
    // Clean up the content
    let content = section
    if (title) {
      content = content.replace(`**${title}**:`, '').trim()
    }
    
    return { title, content }
  })
}

/**
 * Render an emoji icon based on emoji character
 */
const getIconForEmoji = (emoji) => {
  const iconMap = {
    '🔥': <FireOutlined style={{ color: '#ff4d4f' }} />,
    '⚠️': <WarningOutlined style={{ color: '#faad14' }} />,
    '✅': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    '🆕': <ThunderboltOutlined style={{ color: '#1890ff' }} />,
    '🚀': <TrophyOutlined style={{ color: '#722ed1' }} />,
    '🎯': <TrophyOutlined style={{ color: '#13c2c2' }} />,
    '🔄': <SwapOutlined style={{ color: '#faad14' }} />,
    '📅': <CalendarOutlined style={{ color: '#1890ff' }} />,
  }
  
  return iconMap[emoji] || null
}

/**
 * Extract and render key metrics
 */
const renderMetrics = (content) => {
  const metrics = []
  
  // Extract form if present
  const formMatch = content.match(/form[:\s]+([0-9.]+)/i)
  if (formMatch) {
    const formValue = parseFloat(formMatch[1])
    metrics.push({
      label: 'Form',
      value: formValue,
      color: formValue >= 5 ? 'success' : formValue >= 4 ? 'processing' : formValue >= 3 ? 'default' : 'error'
    })
  }
  
  // Extract points if present
  const pointsMatch = content.match(/([0-9]+)\s+(?:total\s+)?pts/)
  if (pointsMatch) {
    metrics.push({
      label: 'Points',
      value: pointsMatch[1],
      color: 'default'
    })
  }
  
  // Extract difficulty if present
  const diffMatch = content.match(/(?:difficulty|diff)[:\s]+([0-9.]+)/i)
  if (diffMatch) {
    const diffValue = parseFloat(diffMatch[1])
    metrics.push({
      label: 'Difficulty',
      value: diffValue,
      color: diffValue <= 2.5 ? 'success' : diffValue <= 3.5 ? 'warning' : 'error'
    })
  }
  
  return metrics
}

/**
 * Parse player information from content
 */
const parsePlayerInfo = (content) => {
  // Extract player name (between ** **)
  const playerMatch = content.match(/\*\*([^*]+)\*\*/)
  const playerName = playerMatch ? playerMatch[1] : null
  
  // Extract team/price info (in parentheses)
  const infoMatch = content.match(/\(([^)]+)\)/)
  const info = infoMatch ? infoMatch[1] : null
  
  // Extract reasons (separated by semicolons)
  const reasonsText = content.replace(/\*\*[^*]+\*\*/g, '').replace(/\([^)]+\)/g, '')
  const reasons = reasonsText
    .split(/[;.]/)
    .map(r => r.trim())
    .filter(r => r.length > 0 && r !== '-')
  
  return { playerName, info, reasons }
}

/**
 * Render a player entry with structured formatting
 */
const renderPlayerEntry = (content, index) => {
  const { playerName, info, reasons } = parsePlayerInfo(content)
  
  if (!playerName) return <Text key={index}>{content}</Text>
  
  return (
    <div key={index} style={{ marginBottom: 12 }}>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space>
          <Text strong style={{ fontSize: 14 }}>{playerName}</Text>
          {info && <Text type="secondary" style={{ fontSize: 12 }}>({info})</Text>}
          {content.includes('🆕') && <Tag color="blue" style={{ margin: 0 }}>NEW</Tag>}
          {content.includes('🔥') && <Tag color="red" style={{ margin: 0 }}>HOT</Tag>}
        </Space>
        {reasons.length > 0 && (
          <div style={{ paddingLeft: 12 }}>
            {reasons.slice(0, 4).map((reason, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>•</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{reason}</Text>
              </div>
            ))}
          </div>
        )}
      </Space>
    </div>
  )
}

/**
 * Render a section with proper formatting
 */
const renderSection = (section, index) => {
  const { title, content } = section
  
  // Determine section type and styling
  let icon = null
  let sectionColor = undefined
  
  if (title) {
    const emoji = title.match(/^[🔥⚠️✅🆕🚀🎯🔄📅🪑📊💡💪]/)?.[0]
    icon = getIconForEmoji(emoji)
    
    if (title.includes('Starting')) sectionColor = 'processing'
    if (title.includes('Bench')) sectionColor = 'default'
    if (title.includes('Transfer')) sectionColor = 'warning'
    if (title.includes('Verdict')) sectionColor = 'success'
  }
  
  // Check if this section contains multiple player entries (contains " | ")
  const hasMultiplePlayers = content.includes(' | ') && !title?.includes('Group')
  
  return (
    <div key={index} style={{ marginBottom: index < 2 ? 16 : 8 }}>
      {title && (
        <Space style={{ marginBottom: 8 }}>
          {icon}
          <Text strong style={{ fontSize: 13 }}>
            {title.replace(/^[🔥⚠️✅🆕🚀🎯🔄📅🪑📊💡💪]\s*/, '')}
          </Text>
        </Space>
      )}
      
      <div style={{ paddingLeft: title && icon ? 24 : 0 }}>
        {hasMultiplePlayers ? (
          // Multiple players - render each separately
          content.split(' | ').map((playerContent, idx) => renderPlayerEntry(playerContent, idx))
        ) : (
          // Single content block
          <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            {content}
          </Text>
        )}
      </div>
      
      {/* Extract and display metrics if available */}
      {!hasMultiplePlayers && renderMetrics(content).length > 0 && (
        <Space size={4} style={{ marginTop: 8, paddingLeft: title && icon ? 24 : 0 }}>
          {renderMetrics(content).map((metric, idx) => (
            <Tag key={idx} color={metric.color}>
              {metric.label}: {metric.value}
            </Tag>
          ))}
        </Space>
      )}
    </div>
  )
}

/**
 * SquadExplanation Component
 * Renders structured, well-formatted explanations for squad selections
 */
export const SquadExplanation = ({ explanation }) => {
  if (!explanation) return null
  
  const sections = parseExplanation(explanation)
  
  if (!sections || sections.length === 0) {
    return (
      <Card size="small" style={{ marginTop: 12 }}>
        <Text type="secondary">{explanation}</Text>
      </Card>
    )
  }
  
  return (
    <Card 
      size="small" 
      style={{ marginTop: 12 }}
      styles={{ body: { padding: 16 } }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {sections.map((section, index) => (
          <React.Fragment key={index}>
            {renderSection(section, index)}
            {index < sections.length - 1 && index < 3 && (
              <Divider style={{ margin: '12px 0' }} />
            )}
          </React.Fragment>
        ))}
      </Space>
    </Card>
  )
}

