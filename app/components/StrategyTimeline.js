import React from 'react'
import { Card, Steps, Typography, Tag, Alert, Space, Divider } from 'antd'
import { ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export const StrategyTimeline = ({ strategy }) => {
    if (!strategy || strategy.length === 0) {
        return (
            <Card title="Chip Strategy (Up to GW19)">
                <Text type="secondary">No active chip strategy. Plan your chips for upcoming gameweeks.</Text>
            </Card>
        )
    }

    // Filter to only show current phase (up to GW19 or post GW19)
    const currentPhase = strategy[0]?.phase || 1
    const phaseStrategy = strategy.filter(s => !s.phase || s.phase === currentPhase)

    const items = phaseStrategy.map(item => {
        // Handle info items (reset notification)
        if (item.isInfo) {
            return {
                title: `GW ${item.suggestedGW}`,
                status: 'finish',
                icon: <ReloadOutlined style={{ color: '#1890ff' }} />,
                description: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Tag color="blue" style={{ width: 'fit-content' }}>
                            {item.chip}
                        </Tag>
                        <Text style={{ fontSize: 13, fontWeight: 500, color: '#1890ff' }}>
                            {item.reason}
                        </Text>
                    </div>
                )
            }
        }
        
        // Regular chip recommendations
        const chipColor = 
            item.chip.includes('Wildcard') ? 'purple' :
            item.chip.includes('Triple') ? 'gold' :
            item.chip.includes('Bench') ? 'green' :
            item.chip.includes('Free') ? 'blue' :
            'default'
        
        return {
            title: `GW ${item.suggestedGW}`,
            status: item.urgent ? 'error' : 'process',
            icon: item.urgent ? <ThunderboltOutlined style={{ color: '#ff4d4f' }} /> : undefined,
            description: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Space>
                        <Tag color={chipColor} style={{ width: 'fit-content' }}>
                            {item.chip}
                        </Tag>
                        {item.urgent && (
                            <Tag color="red" style={{ width: 'fit-content' }}>
                                URGENT
                            </Tag>
                        )}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.reason}
                    </Text>
                </div>
            )
        }
    })

    return (
        <div>
            <Alert
                type="info"
                message={currentPhase === 1 ? "First Half Strategy (GW1-19)" : "Second Half Strategy (GW20-38)"}
                description={
                    currentPhase === 1 
                        ? "Plan your chip usage for the first half of the season. All chips reset at GW19, giving you a fresh set for the second half."
                        : "Your chips have reset! Plan your second set of chips for the season run-in."
                }
                showIcon
                style={{ marginBottom: 16 }}
            />
            
            <Card 
                title={
                    <Space>
                        <ThunderboltOutlined />
                        <Text>Chip Strategy Timeline</Text>
                        <Tag color={currentPhase === 1 ? 'blue' : 'green'}>
                            Phase {currentPhase}
                        </Tag>
                    </Space>
                }
            >
                <Steps
                    current={-1}
                    items={items}
                    progressDot
                    direction="vertical"
                />
            </Card>
            
            {currentPhase === 1 && (
                <Alert
                    type="warning"
                    message="Don't Forget!"
                    description="Any unused chips from the first half will be lost at GW19. Make sure to use your Wildcard, Triple Captain, Bench Boost, and Free Hit before then!"
                    showIcon
                    style={{ marginTop: 16 }}
                />
            )}
        </div>
    )
}
