'use client'

import React from 'react'
import { Spin, Skeleton } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

/**
 * LoadingSpinner Component
 * Standardized loading spinner
 */
export const LoadingSpinner = ({ 
  size = 'default', 
  tip,
  fullScreen = false,
  children 
}) => {
  const spinnerSize = {
    small: 'small',
    default: 'default',
    large: 'large'
  }[size]

  const spinner = (
    <Spin 
      size={spinnerSize} 
      tip={tip}
      indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 48 : 24 }} spin />}
    >
      {children}
    </Spin>
  )

  if (fullScreen) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 16
      }}>
        {spinner}
      </div>
    )
  }

  return spinner
}

/**
 * ContentSkeleton Component
 * Standardized skeleton loading state
 */
export const ContentSkeleton = ({ 
  rows = 4,
  avatar = false,
  title = true,
  active = true
}) => {
  return (
    <Skeleton 
      active={active}
      avatar={avatar}
      title={title}
      paragraph={{ rows }}
    />
  )
}

/**
 * TableSkeleton Component
 * Skeleton for table loading state
 */
export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div style={{ padding: '16px 0' }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton 
          key={index} 
          active 
          paragraph={{ rows: 0 }}
          style={{ marginBottom: 16 }}
        />
      ))}
    </div>
  )
}

