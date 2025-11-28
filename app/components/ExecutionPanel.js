import React, { useState } from 'react'
import { Card, Button, Alert, Typography, Space, Modal } from 'antd'
import { ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export const ExecutionPanel = ({ pendingTransfers, captaincy }) => {
    const [executing, setExecuting] = useState(false)
    const [executed, setExecuted] = useState(false)

    const handleExecute = async () => {
        setExecuting(true)
        // Simulate API call for now
        setTimeout(() => {
            setExecuting(false)
            setExecuted(true)
            Modal.success({
                title: 'Transfers Executed!',
                content: 'Your team has been updated for the upcoming Gameweek.',
            })
        }, 2000)
    }

    if (!pendingTransfers || pendingTransfers.length === 0) {
        return null
    }

    return (
        <Card
            className="mb-6 border-green-500 border-2 shadow-lg"
            title={<Space><ThunderboltOutlined className="text-green-500" /> Execution Center</Space>}
        >
            <div className="flex flex-col gap-4">
                <Alert
                    message="Pending Actions"
                    description="Review the planned moves before executing."
                    type="info"
                    showIcon
                />

                <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-800">
                    <Title level={5}>Transfers</Title>
                    {pendingTransfers.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center mb-2">
                            <Text type="danger">OUT: {t.out.web_name}</Text>
                            <Text type="secondary">→</Text>
                            <Text type="success">IN: {t.in.web_name}</Text>
                        </div>
                    ))}

                    {captaincy && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Title level={5}>Captaincy</Title>
                            <div className="flex gap-4">
                                <Text>👑 Captain: <Text strong>{captaincy.captain?.web_name}</Text></Text>
                                <Text>🛡️ Vice: <Text type="secondary">{captaincy.vice?.web_name}</Text></Text>
                            </div>
                        </div>
                    )}
                </div>

                <Button
                    type="primary"
                    size="large"
                    icon={executed ? <CheckCircleOutlined /> : <ThunderboltOutlined />}
                    loading={executing}
                    disabled={executed}
                    onClick={handleExecute}
                    className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-500"
                >
                    {executed ? 'Moves Finalized' : 'EXECUTE MOVES'}
                </Button>
                <Text type="secondary" className="text-xs text-center">
                    This will apply transfers and set your captain on the official FPL site.
                </Text>
            </div>
        </Card>
    )
}
