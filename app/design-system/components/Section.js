'use client'

import React from 'react'
import { Card, Typography, Divider, Space } from 'antd'

const { Title, Text } = Typography

/**
 * Section Component
 * Standardized section with title, description, and optional actions
 * Used consistently across the app for major content sections
 */
export const Section = ({ 
  title, 
  description, 
  icon,
  extra,
  children,
  style,
  ...props 
}) => {
  return (
    <Card 
      style={{
        marginBottom: 24,
        ...style
      }}
      {...props}
    >
      {(title || description || extra) && (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: description ? 8 : 16
          }}>
            <Space>
              {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
              {title && <Title level={4} style={{ margin: 0 }}>{title}</Title>}
            </Space>
            {extra && <div>{extra}</div>}
          </div>
          {description && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {description}
            </Text>
          )}
          <Divider style={{ margin: '16px 0' }} />
        </>
      )}
      {children}
    </Card>
  )
}

/**
 * PageHeader Component
 * Standardized page header with title, description, and actions
 */
export const PageHeader = ({ 
  title, 
  description, 
  icon,
  actions,
  style 
}) => {
  return (
    <div style={{ 
      marginBottom: 24,
      ...style 
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 8
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <Space size="middle">
            {icon}
            <Title level={2} style={{ margin: 0 }}>{title}</Title>
          </Space>
          {actions && <Space>{actions}</Space>}
        </div>
        {description && (
          <Text type="secondary" style={{ fontSize: 16 }}>
            {description}
          </Text>
        )}
      </div>
    </div>
  )
}

/**
 * EmptyState Component
 * Standardized empty state for when there's no data
 */
export const EmptyState = ({ 
  title = 'No data available',
  description,
  icon,
  action
}) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 24px'
    }}>
      {icon && <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>{icon}</div>}
      <Title level={4} type="secondary">{title}</Title>
      {description && <Text type="secondary">{description}</Text>}
      {action && <div style={{ marginTop: 24 }}>{action}</div>}
    </div>
  )
}

