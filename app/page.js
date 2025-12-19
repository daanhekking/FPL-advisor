'use client'

import React, { useState, useEffect } from 'react'
import {
  Layout, Tabs, Card, Button, Typography,
  Space, Dropdown, Spin, Alert, Badge
} from 'antd'
import {
  SwapOutlined, ReloadOutlined, DownOutlined,
  RobotOutlined, SettingOutlined, TrophyOutlined
} from '@ant-design/icons'
import Link from 'next/link'

// Custom Hooks
import { useTeamData } from './hooks/useTeamData'
import { useRecommendations } from './hooks/useRecommendations'
import { useSquadData } from './hooks/useSquadData'

// Components
import { StandardTable } from './components/StandardTable'
import { StrategyTimeline } from './components/StrategyTimeline'
import { SentimentBadge } from './components/SentimentBadge'
import { DebugPanel } from './components/DebugPanel'
import { TeamStats } from './components/TeamStats'
import { RecommendedTeamTab } from './components/RecommendedTeamTab'
import { CurrentSquadTab } from './components/CurrentSquadTab'
import { CaptaincyAnalysis } from './components/CaptaincyAnalysis'
import { BestFixtures } from './components/BestFixtures'
import {
  getTargetsTableColumns,
  getWeakPlayersTableColumns
} from './components/TableColumns'

const { Content } = Layout
const { Title, Text } = Typography

const DEFAULT_TEAM_ID = '7535279'

const MY_TEAMS = [
  { id: '7535279', name: 'DH-to-the-moon', manager: 'Your Team' },
  { id: '5385777', name: 'Caribbean Chaos', manager: 'Doried Marin' },
  { id: '12480987', name: 'AI-DH-To-The-Moon', manager: 'AI Team' }
]

export default function MyTeamAdvisor() {
  // State
  const [teamId, setTeamId] = useState(null)
  const [randomSeed, setRandomSeed] = useState(0)
  const [activeTab, setActiveTab] = useState('0')
  const [fixturesToShow] = useState(5)
  const [transfersToUse, setTransfersToUse] = useState(null) // null means auto-calculate

  // Initialize team ID from localStorage
  useEffect(() => {
    const savedTeamId = localStorage.getItem('fplTeamId')

    // Validate team ID is a number
    const validTeamId = savedTeamId && !isNaN(savedTeamId) && savedTeamId !== 'null' && savedTeamId !== 'undefined'
      ? savedTeamId
      : DEFAULT_TEAM_ID

    setTeamId(validTeamId)

    // Clean up invalid localStorage value
    if (!validTeamId || savedTeamId !== validTeamId) {
      localStorage.setItem('fplTeamId', validTeamId)
    }
  }, [])

  // Fetch team data using custom hook
  const {
    data,
    loading,
    error,
    chipStrategy,
    last3PointsData,
    refetch
  } = useTeamData(teamId)

  // Generate recommendations using custom hook
  const {
    recommendations,
    loading: recommendationsLoading
  } = useRecommendations(data, randomSeed, fixturesToShow, last3PointsData, transfersToUse)

  // Get squad data using custom hook
  const {
    mySquadDataGrouped,
    recommendedSquadGrouped,
    bestFixturesData,
    captaincyRecommendation
  } = useSquadData(data, recommendations)

  // Handlers
  const handleTeamChange = (newId) => {
    setTeamId(newId)
    localStorage.setItem('fplTeamId', newId)
  }

  const handleRefresh = () => {
    refetch()
  }

  // Render team selector dropdown
  const renderTeamSelector = () => (
    <Dropdown
      menu={{
        items: MY_TEAMS.map(t => ({
          key: t.id,
          label: `${t.name} (${t.manager})`,
          onClick: () => handleTeamChange(t.id)
        }))
      }}
    >
      <Button>
        {MY_TEAMS.find(t => t.id === teamId)?.name || 'Select Team'} <DownOutlined />
      </Button>
    </Dropdown>
  )

  // Loading state
  if (loading && !data) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 16
          }}>
            <Spin size="large" />
            <Text type="secondary">Consulting the AI Coach...</Text>
          </div>
        </Content>
      </Layout>
    )
  }

  // Error state (without data)
  if (error && !data) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div style={{ maxWidth: 600, margin: '60px auto' }}>
            <Alert
              type="error"
              message="Failed to Load Team Data"
              description={
                <div>
                  <p>{error}</p>
                  {error.includes('Invalid team ID') && (
                    <p style={{ marginTop: 12 }}>
                      Your team ID appears to be invalid. Current ID: <strong>{teamId}</strong>
                      <br />
                      Please select a valid team from the dropdown above.
                    </p>
                  )}
                </div>
              }
              style={{ marginBottom: 16 }}
            />
            <Space>
              <Button onClick={handleRefresh}>Retry</Button>
              <Button
                type="primary"
                onClick={() => {
                  localStorage.removeItem('fplTeamId')
                  window.location.reload()
                }}
              >
                Reset to Default Team
              </Button>
            </Space>
          </div>
        </Content>
      </Layout>
    )
  }

  return (
    <>
      <DebugPanel />
      <style jsx global>{`
        .transfer-out-row {
          opacity: 0.4;
          text-decoration: line-through;
        }
        .transfer-out-row:hover {
          opacity: 0.5;
        }
      `}</style>

      <Layout style={{ minHeight: '100vh' }}>
        <Content className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {/* Error Alert (partial data loaded) */}
          {error && (
            <Alert
              type="warning"
              message="Partial Data Loaded"
              description={error}
              closable
              className="mb-6"
            />
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <Title level={2} className="!mb-0 flex items-center gap-2">
                <RobotOutlined className="text-blue-500" /> FPL Assistant Coach
              </Title>
              <Text type="secondary">
                AI-powered insights for {data?.myTeam?.name}
              </Text>
            </div>
            <Space>
              {renderTeamSelector()}
              <Button
                icon={<SwapOutlined />}
                onClick={() => setRandomSeed(s => s + 1)}
                title="Shuffle transfer suggestions"
              >
                Shuffle
              </Button>
              <Link href="/settings">
                <Button icon={<SettingOutlined />}>
                  Algorithm Setup
                </Button>
              </Link>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                Refresh
              </Button>
            </Space>
          </div>

          {/* Team Stats */}
          <TeamStats data={data} />

          {/* Main Dashboard */}
          <Card className="mb-6">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: '0',
                  label: (
                    <span>
                      Recommended Team
                      {recommendations?.suggestedTransfers?.length > 0 && (
                        <Badge
                          count={recommendations.suggestedTransfers.length}
                          style={{ marginLeft: 8, backgroundColor: '#52c41a' }}
                        />
                      )}
                    </span>
                  ),
                  children: (
                    <RecommendedTeamTab
                      recommendations={recommendations}
                      recommendedSquadGrouped={recommendedSquadGrouped}
                      captaincyRecommendation={captaincyRecommendation}
                      loading={recommendationsLoading}
                      onTransfersChange={setTransfersToUse}
                      currentTransfersToUse={transfersToUse}
                    />
                  )
                },
                {
                  key: '1',
                  label: 'Current Squad',
                  children: (
                    <CurrentSquadTab
                      mySquadDataGrouped={mySquadDataGrouped}
                      loading={loading}
                    />
                  )
                },
                {
                  key: '2',
                  label: 'All Transfer Targets',
                  children: (
                    <StandardTable
                      loading={recommendationsLoading}
                      dataSource={recommendations?.transferTargets || []}
                      columns={[
                        ...getTargetsTableColumns(),
                        {
                          title: 'AI Verdict',
                          key: 'sentiment',
                          render: (_, record) => (
                            <SentimentBadge score={record.transferScore || 0} />
                          )
                        }
                      ]}
                      rowKey="id"
                    />
                  )
                },
                {
                  key: '3',
                  label: 'Weak Links',
                  children: (
                    <StandardTable
                      loading={recommendationsLoading}
                      dataSource={recommendations?.weakPlayers || []}
                      columns={getWeakPlayersTableColumns()}
                      rowKey="id"
                    />
                  )
                },
                {
                  key: '4',
                  label: 'Best Fixtures',
                  children: (
                    <BestFixtures
                      bestFixturesData={bestFixturesData}
                      loading={loading}
                    />
                  )
                },
                {
                  key: '5',
                  label: 'Chip Strategy',
                  children: (
                    <StrategyTimeline strategy={chipStrategy} />
                  )
                },
                {
                  key: '6',
                  label: (
                    <span>
                      <TrophyOutlined /> Captaincy Analysis
                    </span>
                  ),
                  children: (
                    <CaptaincyAnalysis
                      captaincyRecommendation={captaincyRecommendation}
                      loading={recommendationsLoading}
                    />
                  )
                }
              ]}
            />
          </Card>
        </Content>
      </Layout>
    </>
  )
}
