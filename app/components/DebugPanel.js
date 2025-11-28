'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Drawer, Badge, Button, Space, Typography, Timeline, Tag, Collapse,
  Segmented, Input, Empty, Tooltip
} from 'antd'
import {
  BugOutlined, DeleteOutlined, DownloadOutlined,
  CloseOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  InfoCircleOutlined, WarningOutlined, ApiOutlined
} from '@ant-design/icons'
import { debugLogger } from '../utils/debug-logger'

const { Text, Paragraph } = Typography
const { Panel } = Collapse
const { Search } = Input

/**
 * Debug Panel - Floating debug tool showing all API calls and errors
 */
export function DebugPanel() {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('all') // 'all', 'error', 'api', 'info'
  const [searchTerm, setSearchTerm] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef(null)

  // Subscribe to debug logger
  useEffect(() => {
    setLogs(debugLogger.getLogs())
    const unsubscribe = debugLogger.subscribe((newLogs) => {
      setLogs(newLogs)
    })
    return unsubscribe
  }, [])

  // Auto scroll to top when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  // Filter logs
  const filteredLogs = logs.filter(log => {
    // Filter by type
    if (filter !== 'all' && log.type !== filter) {
      return false
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        log.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.data || {}).toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })

  // Count by type
  const errorCount = logs.filter(l => l.type === 'error').length
  const apiCount = logs.filter(l => l.type === 'api' || l.type === 'success').length

  // Export logs
  const handleExport = () => {
    const data = debugLogger.export()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fpl-debug-logs-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Get icon and color for log type
  const getLogTypeIcon = (type) => {
    switch (type) {
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'warn':
        return <WarningOutlined style={{ color: '#faad14' }} />
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'api':
        return <ApiOutlined style={{ color: '#1890ff' }} />
      default:
        return <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
    }
  }

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'error': return 'red'
      case 'warn': return 'orange'
      case 'success': return 'green'
      case 'api': return 'blue'
      default: return 'default'
    }
  }

  return (
    <>
      {/* Floating Button */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000
      }}>
        <Badge count={errorCount} offset={[-5, 5]}>
          <Tooltip title="Open Debug Panel">
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<BugOutlined />}
              onClick={() => setOpen(true)}
              danger={errorCount > 0}
            />
          </Tooltip>
        </Badge>
      </div>

      {/* Debug Drawer */}
      <Drawer
        title={
          <Space>
            <BugOutlined />
            <span>Debug Panel</span>
            <Badge count={errorCount} />
          </Space>
        }
        placement="right"
        width={600}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          <Space>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => debugLogger.clear()}
            >
              Clear
            </Button>
          </Space>
        }
      >
        {/* Stats */}
        <div style={{
          background: '#fafafa',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <Space size="large">
            <div>
              <Text type="secondary">Total Logs</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {logs.length}
              </div>
            </div>
            <div>
              <Text type="secondary">API Calls</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                {apiCount}
              </div>
            </div>
            <div>
              <Text type="secondary">Errors</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {errorCount}
              </div>
            </div>
          </Space>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '16px' }}>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Errors', value: 'error' },
              { label: 'API', value: 'api' },
              { label: 'Info', value: 'info' }
            ]}
            block
          />
        </div>

        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <Search
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </div>

        {/* Auto-scroll toggle */}
        <div style={{ marginBottom: '16px' }}>
          <Button
            size="small"
            type={autoScroll ? 'primary' : 'default'}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
          </Button>
        </div>

        {/* Logs */}
        <div
          ref={scrollRef}
          style={{
            maxHeight: 'calc(100vh - 400px)',
            overflowY: 'auto',
            paddingRight: '8px'
          }}
        >
          {filteredLogs.length === 0 ? (
            <Empty description="No logs to display" />
          ) : (
            <Timeline mode="left">
              {filteredLogs.map((log) => (
                <Timeline.Item
                  key={log.id}
                  dot={getLogTypeIcon(log.type)}
                  color={getLogTypeColor(log.type)}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {/* Header */}
                      <div>
                        <Tag color={getLogTypeColor(log.type)}>
                          {log.type.toUpperCase()}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </Text>
                      </div>

                      {/* Message */}
                      <Text strong>{log.message}</Text>

                      {/* Data */}
                      {log.data && (
                        <Collapse
                          size="small"
                          ghost
                          items={[
                            {
                              key: '1',
                              label: 'Details',
                              children: (
                                <Paragraph
                                  code
                                  copyable
                                  style={{
                                    fontSize: '11px',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    background: '#f5f5f5',
                                    padding: '8px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  {JSON.stringify(log.data, null, 2)}
                                </Paragraph>
                              )
                            }
                          ]}
                        />
                      )}

                      {/* Error Details */}
                      {log.error && (
                        <div style={{
                          background: '#fff1f0',
                          border: '1px solid #ffccc7',
                          padding: '8px',
                          borderRadius: '4px'
                        }}>
                          <Text type="danger" strong>
                            {log.error.name}: {log.error.message}
                          </Text>
                          {log.error.stack && (
                            <Collapse
                              size="small"
                              ghost
                              items={[
                                {
                                  key: '1',
                                  label: 'Stack Trace',
                                  children: (
                                    <Paragraph
                                      code
                                      copyable
                                      style={{
                                        fontSize: '10px',
                                        maxHeight: '150px',
                                        overflowY: 'auto'
                                      }}
                                    >
                                      {log.error.stack}
                                    </Paragraph>
                                  )
                                }
                              ]}
                            />
                          )}
                        </div>
                      )}
                    </Space>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          )}
        </div>
      </Drawer>
    </>
  )
}
