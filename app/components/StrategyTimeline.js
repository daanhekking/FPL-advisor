import React from 'react'
import { Card, Steps, Typography, Tag } from 'antd'

const { Title, Text } = Typography

export const StrategyTimeline = ({ strategy }) => {
    if (!strategy || strategy.length === 0) {
        return (
            <Card title="Long-term Chip Strategy">
                <Text type="secondary">No active chip strategy. Plan your chips for upcoming gameweeks.</Text>
            </Card>
        )
    }

    const items = strategy.map(item => ({
        title: `GW ${item.suggestedGW}`,
        status: 'process',
        description: (
            <div className="flex flex-col gap-1">
                <Tag color="purple" className="w-fit">{item.chip}</Tag>
                <Text type="secondary" className="text-xs">{item.reason}</Text>
            </div>
        )
    }))

    return (
        <Card title="Long-term Chip Strategy">
            <Steps
                current={-1}
                items={items}
                progressDot
                className="overflow-x-auto pb-4"
            />
        </Card>
    )
}
