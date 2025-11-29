'use client'

import React from 'react'
import { Tag, Tooltip, Badge } from 'antd'
import { 
  CheckCircleFilled, 
  ExclamationCircleFilled, 
  CloseCircleFilled,
  InfoCircleFilled,
  QuestionCircleFilled
} from '@ant-design/icons'

/**
 * FixtureDifficultyTag Component
 * Standardized fixture difficulty display
 */
export const FixtureDifficultyTag = ({ difficulty, showLabel = false }) => {
  const getColor = (diff) => {
    // Use Ant Design standard color names
    if (diff <= 2) return 'success'
    if (diff === 3) return 'warning'
    if (diff >= 4) return 'error'
    return 'default'
  }

  const getLabel = (diff) => {
    if (diff <= 2) return 'Easy'
    if (diff === 3) return 'Moderate'
    if (diff === 4) return 'Hard'
    return 'Very Hard'
  }

  return (
    <Tooltip title={`Difficulty: ${getLabel(difficulty)}`}>
      <Tag 
        color={getColor(difficulty)}
        style={{ 
          border: 'none',
          fontWeight: 600,
          minWidth: 32,
          textAlign: 'center'
        }}
      >
        {showLabel ? getLabel(difficulty) : difficulty.toFixed(1)}
      </Tag>
    </Tooltip>
  )
}

/**
 * StatusBadge Component
 * Standardized status badge with icon
 */
export const StatusBadge = ({ 
  status, 
  text, 
  icon,
  showIcon = true 
}) => {
  const config = {
    success: { color: 'success', icon: <CheckCircleFilled /> },
    warning: { color: 'warning', icon: <ExclamationCircleFilled /> },
    error: { color: 'error', icon: <CloseCircleFilled /> },
    info: { color: 'processing', icon: <InfoCircleFilled /> },
    default: { color: 'default', icon: <QuestionCircleFilled /> }
  }

  const { color, icon: defaultIcon } = config[status] || config.default

  return (
    <Tag 
      color={color}
      icon={showIcon && (icon || defaultIcon)}
      style={{ fontWeight: 500 }}
    >
      {text}
    </Tag>
  )
}

/**
 * AvailabilityIndicator Component
 * Shows player availability status
 */
export const AvailabilityIndicator = ({ chanceOfPlaying }) => {
  if (chanceOfPlaying === null || chanceOfPlaying === 100) {
    return <StatusBadge status="success" text="Available" />
  }

  if (chanceOfPlaying >= 75) {
    return (
      <Tooltip title={`${chanceOfPlaying}% chance of playing`}>
        <StatusBadge status="warning" text={`${chanceOfPlaying}%`} />
      </Tooltip>
    )
  }

  if (chanceOfPlaying >= 50) {
    return (
      <Tooltip title={`${chanceOfPlaying}% chance of playing`}>
        <StatusBadge status="error" text={`${chanceOfPlaying}% Doubtful`} />
      </Tooltip>
    )
  }

  return (
    <Tooltip title="Unlikely to play">
      <StatusBadge status="error" text="Injured" />
    </Tooltip>
  )
}

/**
 * FormRating Component
 * Visual form rating with color coding
 */
export const FormRating = ({ form, size = 'default' }) => {
  const formValue = parseFloat(form || 0)
  
  const getColor = () => {
    // Use Ant Design standard color names
    if (formValue >= 5.0) return 'success'
    if (formValue >= 4.0) return 'processing'
    if (formValue >= 3.0) return 'warning'
    return 'error'
  }

  const getLabel = () => {
    if (formValue >= 5.0) return 'Excellent'
    if (formValue >= 4.0) return 'Good'
    if (formValue >= 3.0) return 'Average'
    return 'Poor'
  }

  return (
    <Tooltip title={`Form: ${getLabel()}`}>
      <Tag 
        color={getColor()}
        style={{ 
          border: 'none',
          fontWeight: 600,
          fontSize: size === 'small' ? 12 : 14
        }}
      >
        {formValue.toFixed(1)}
      </Tag>
    </Tooltip>
  )
}

/**
 * TransferBadge Component  
 * Shows transfer in/out status
 */
export const TransferBadge = ({ type }) => {
  if (type === 'in') {
    return (
      <Badge 
        status="success" 
        text="Transfer In"
      />
    )
  }

  if (type === 'out') {
    return (
      <Badge 
        status="error" 
        text="Transfer Out"
        style={{ opacity: 0.6 }}
      />
    )
  }

  return null
}

