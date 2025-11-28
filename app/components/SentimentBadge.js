import React from 'react'
import { Tag, Tooltip } from 'antd'
import { FireOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'

export const SentimentBadge = ({ score, showTooltip = true }) => {
    // Score is 0-10 roughly
    let color = 'default'
    let icon = null
    let text = 'Neutral'

    if (score > 8) {
        color = 'gold'
        icon = <FireOutlined />
        text = 'Scout Pick!'
    } else if (score > 6) {
        color = 'green'
        icon = <RiseOutlined />
        text = 'Trending Up'
    } else if (score < 3) {
        color = 'red'
        icon = <FallOutlined />
        text = 'Cold'
    }

    const badge = (
        <Tag color={color} icon={icon}>
            {text}
        </Tag>
    )

    if (showTooltip) {
        return (
            <Tooltip title={`Hybrid Score: ${score.toFixed(1)}`}>
                {badge}
            </Tooltip>
        )
    }

    return badge
}
