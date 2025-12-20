'use client'

import React, { useState, useMemo } from 'react'
import { Card, Space, Typography, Select, Slider, Button, Spin, Row, Col, Statistic, Alert } from 'antd'
import { ThunderboltOutlined, RocketOutlined } from '@ant-design/icons'
import { useRecommendations } from '../hooks/useRecommendations'
import { SquadSection } from './SquadSection'
import { getSquadTableColumns } from './TableColumns'

const { Title, Text } = Typography
const { Option } = Select

/**
 * BenchBoostPlanner Component
 * Allows users to optimize their squad for a Bench Boost chip in a future gameweek.
 */
export const BenchBoostPlanner = ({ data }) => {
    const [targetGW, setTargetGW] = useState(null)
    const [transfers, setTransfers] = useState(2)
    const [analyzing, setAnalyzing] = useState(false)
    const [result, setResult] = useState(null)

    // Determine current and next gameweeks
    const currentGW = useMemo(() => {
        if (!data?.fixtures) return 1
        const nextFix = data.fixtures.find(f => !f.finished_provisional)
        return nextFix ? nextFix.event : 1
    }, [data])

    // Generate options for the next 8 GWs
    const gwOptions = useMemo(() => {
        return Array.from({ length: 8 }, (_, i) => currentGW + i)
    }, [currentGW])

    // Initialize targetGW
    React.useEffect(() => {
        if (currentGW && !targetGW) {
            setTargetGW(currentGW)
        }
    }, [currentGW])

    // Mock function to trigger analysis - in a real app, this would call proper state management
    // or a specialized hook. For now, we will use a local implementation of the generation logic
    // by importing it directly if possible, or we wrap useRecommendations to allow on-demand fetching.

    // Actually, we can just use the algorithm service directly here since it's client-side calculation.
    // We need to import generateRecommendations from algorithm-service. But wait, `useRecommendations`
    // already wraps it. We should probably reuse that if possible, or import the service.
    // Since useRecommendations is a hook associated with data fetching, we might need to manually call the service.

    const handleAnalyze = async () => {
        if (!data) return
        setAnalyzing(true)

        // Small delay to allow UI to render Spinner
        setTimeout(async () => {
            try {
                const { generateRecommendations } = await import('../services/algorithm-service')

                // Use 1-week window for the specific target GW to sharpen focus
                const recs = generateRecommendations(
                    data.myPicks,
                    data.allPlayers,
                    data.allTeams,
                    data.fixtures,
                    0,
                    1, // Window of 1 for precise GW targeting
                    {},
                    transfers,
                    targetGW,
                    true // useBenchBoost = true
                )
                setResult(recs)
            } catch (error) {
                console.error("Optimization failed", error)
            } finally {
                setAnalyzing(false)
            }
        }, 100)
    }

    // Group result players for display
    const groupedPlayers = useMemo(() => {
        if (!result || !result.starting11) return null
        return {
            GKP: result.starting11.filter(p => p.element_type === 1),
            DEF: result.starting11.filter(p => p.element_type === 2),
            MID: result.starting11.filter(p => p.element_type === 3),
            FWD: result.starting11.filter(p => p.element_type === 4),
        }
    }, [result])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Configuration Card */}
            <Card
                className="shadow-sm"
                title={
                    <Space>
                        <RocketOutlined style={{ color: '#eb2f96' }} />
                        <Text strong style={{ fontSize: 16 }}>Bench Boost Planner</Text>
                    </Space>
                }
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, paddingBottom: 16, alignItems: 'center' }}>
                    <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Target Gameweek</Text>
                        <Select
                            value={targetGW}
                            onChange={setTargetGW}
                            style={{ width: 120 }}
                        >
                            {gwOptions.map(gw => (
                                <Option key={gw} value={gw}>GW {gw}</Option>
                            ))}
                        </Select>
                    </div>

                    <div style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                            Planned Transfers: <Text strong>{transfers}</Text>
                        </Text>
                        <Slider
                            min={0}
                            max={5}
                            value={transfers}
                            onChange={setTransfers}
                        />
                    </div>

                    <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        onClick={handleAnalyze}
                        loading={analyzing}
                        style={{ background: '#eb2f96', borderColor: '#eb2f96' }}
                        size="large"
                    >
                        Optimize Squad
                    </Button>
                </div>

                <Alert
                    message="Optimizes your squad to maximize total points from ALL 15 players for the selected Gameweek."
                    type="info"
                    showIcon
                />
            </Card>

            {/* Results Section */}
            {result && groupedPlayers && (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    {/* Summary Stats */}
                    <Card className="shadow-sm" bodyStyle={{ padding: '16px 24px' }}>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Statistic
                                    title="Projected Bench Boost Score"
                                    value={result.formationScore}
                                    precision={0}
                                    valueStyle={{ color: '#3f8600' }}
                                    prefix={<RocketOutlined />}
                                />
                            </Col>
                            <Col span={16}>
                                <Text strong>Suggested Moves:</Text>
                                {result.suggestedTransfers.length > 0 ? (
                                    <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                                        {result.suggestedTransfers.map((t, idx) => (
                                            <li key={idx}>
                                                <Text type="secondary">Out:</Text> {t.out.web_name} <Text type="secondary">In:</Text> <Text strong>{t.in.web_name}</Text>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <div style={{ marginTop: 8 }}><Text type="secondary">No transfers suggested.</Text></div>}
                            </Col>
                        </Row>
                    </Card>

                    {/* Squad Display */}
                    <SquadSection title="Goalkeepers" players={groupedPlayers.GKP} />
                    <SquadSection title="Defenders" players={groupedPlayers.DEF} />
                    <SquadSection title="Midfielders" players={groupedPlayers.MID} />
                    <SquadSection title="Forwards" players={groupedPlayers.FWD} />
                </Space>
            )}
        </div>
    )
}
