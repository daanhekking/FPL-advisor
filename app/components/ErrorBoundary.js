'use client'

import React from 'react'
import { Alert, Button, Card, Typography, Space, Collapse } from 'antd'
import { ReloadOutlined, BugOutlined } from '@ant-design/icons'
import { logError } from '../utils/debug-logger'

const { Title, Paragraph, Text } = Typography

/**
 * Error Boundary - Catches React errors and displays user-friendly error messages
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to debug logger
    logError('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack
    })

    // Update state with error details
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    // Reset error boundary
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    // Reload the page
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Error Icon and Title */}
              <div style={{ textAlign: 'center' }}>
                <BugOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
                <Title level={2}>Something went wrong</Title>
                <Text type="secondary">
                  The application encountered an unexpected error. Don't worry, your data is safe.
                </Text>
              </div>

              {/* Error Message */}
              <Alert
                type="error"
                message="Error Details"
                description={this.state.error?.toString()}
                showIcon
              />

              {/* Error Stack */}
              {this.state.error?.stack && (
                <Collapse
                  items={[
                    {
                      key: '1',
                      label: 'Technical Details (for debugging)',
                      children: (
                        <div>
                          <Paragraph>
                            <Text strong>Error Stack:</Text>
                          </Paragraph>
                          <Paragraph
                            code
                            copyable
                            style={{
                              fontSize: '12px',
                              maxHeight: '300px',
                              overflowY: 'auto',
                              background: '#f5f5f5',
                              padding: '12px',
                              borderRadius: '4px'
                            }}
                          >
                            {this.state.error.stack}
                          </Paragraph>

                          {this.state.errorInfo?.componentStack && (
                            <>
                              <Paragraph>
                                <Text strong>Component Stack:</Text>
                              </Paragraph>
                              <Paragraph
                                code
                                copyable
                                style={{
                                  fontSize: '12px',
                                  maxHeight: '300px',
                                  overflowY: 'auto',
                                  background: '#f5f5f5',
                                  padding: '12px',
                                  borderRadius: '4px'
                                }}
                              >
                                {this.state.errorInfo.componentStack}
                              </Paragraph>
                            </>
                          )}
                        </div>
                      )
                    }
                  ]}
                />
              )}

              {/* Action Buttons */}
              <div style={{ textAlign: 'center' }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={this.handleReset}
                    size="large"
                  >
                    Reload Application
                  </Button>
                  <Button
                    onClick={() => {
                      localStorage.clear()
                      this.handleReset()
                    }}
                  >
                    Clear Cache & Reload
                  </Button>
                </Space>
              </div>

              {/* Helpful Tips */}
              <Alert
                type="info"
                message="Debugging Tips"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                    <li>Click the bug icon (🐛) in the bottom-right corner to view detailed logs</li>
                    <li>Check the browser console (F12) for additional errors</li>
                    <li>Try refreshing the page or clearing your cache</li>
                    <li>If the problem persists, check your network connection</li>
                  </ul>
                }
              />
            </Space>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

