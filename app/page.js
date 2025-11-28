'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Layout, Tabs, Card, Button, Typography,
  Space, Statistic, Row, Col, Dropdown, Spin, Alert, Tag, Modal, Badge
} from 'antd'
import {
  SwapOutlined, ReloadOutlined, DownOutlined,
  RobotOutlined, TrophyOutlined, SettingOutlined
} from '@ant-design/icons'
import Link from 'next/link'

// Services
import { fetchFPLData, getPlayerFixtures, calculateLast3GameweeksPoints } from './services/fpl-service'
import { generateRecommendations, calculateHybridScore } from './services/algorithm-service'
import { generateChipStrategy } from './services/chip-service'
import { fetchScoutPicks } from './services/scout-service'
import { fetchSentimentData } from './services/sentiment-service'

// Components
import { StandardTable } from './components/StandardTable'
import { StrategyTimeline } from './components/StrategyTimeline'
import { SentimentBadge } from './components/SentimentBadge'
import { DebugPanel } from './components/DebugPanel'
import {
  getTargetsTableColumns,
  getWeakPlayersTableColumns,
  getSquadTableColumns,
  getBestFixturesTableColumns
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
  const [data, setData] = useState(null) // Holds all FPL data
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Configuration State
  const [randomSeed, setRandomSeed] = useState(0)
  const [activeTab, setActiveTab] = useState('0') // Default to 'Recommended Team'
  const [fixturesToShow, setFixturesToShow] = useState(5)

  // AI/Strategy State
  const [scoutPicks, setScoutPicks] = useState(new Set())
  const [sentimentData, setSentimentData] = useState({})
  const [chipStrategy, setChipStrategy] = useState([])
  const [last3PointsData, setLast3PointsData] = useState({})

  // Initialize team ID
  useEffect(() => {
    const savedTeamId = localStorage.getItem('fplTeamId') || DEFAULT_TEAM_ID
    setTeamId(savedTeamId)
  }, [])

  // Fetch Data
  useEffect(() => {
    if (!teamId) return

    let cancelled = false

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch FPL data first (most critical)
          // Set a maximum wait time - if it takes too long, show UI anyway
          const dataFetchPromise = fetchFPLData(teamId)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Data fetch timeout')), 90000) // 90s max wait
          )

          let fplData
          try {
            fplData = await Promise.race([dataFetchPromise, timeoutPromise])
          } catch (err) {
            if (err.message === 'Data fetch timeout') {
              // Timeout - show error but don't block UI completely
              setError('Loading is taking longer than expected. Some data may be unavailable.')
              setLoading(false)
              return
            }
            throw err
          }

          if (cancelled) return

          setData(fplData)
          
          // Show UI immediately - don't wait for other computations
          setLoading(false)

          // Generate Chip Strategy in background (non-blocking)
          try {
            const strategy = generateChipStrategy(fplData.myHistory, fplData.myTeam, fplData.fixtures)
            if (!cancelled) {
              setChipStrategy(strategy)
            }
          } catch (err) {
            console.warn('Error generating chip strategy:', err)
          }

          // Fetch external intelligence in parallel (non-critical, can fail silently)
          Promise.all([
            fetchScoutPicks().catch(() => []),
            fetchSentimentData().catch(() => ({}))
          ]).then(([scout, sentiment]) => {
            if (!cancelled) {
              setScoutPicks(new Set(scout))
              setSentimentData(sentiment)
            }
          }).catch(err => {
            console.warn('Error fetching external intelligence:', err)
          })

          // Fetch last 3 gameweeks points in background (non-blocking)
          // Reduced to only my team players + top 5 targets to speed up loading
          const myPlayerIds = fplData.myPicks?.picks?.map(p => p.element) || []
          const topTargetIds = (fplData.allPlayers || [])
            .filter(p => !myPlayerIds.includes(p.id) && parseFloat(p.form || 0) > 3.0)
            .sort((a, b) => parseFloat(b.form || 0) - parseFloat(a.form || 0))
            .slice(0, 5) // Reduced from 30 to 5
            .map(p => p.id)

          const allRelevantIds = [...myPlayerIds, ...topTargetIds]
          // Don't block on this - let it run in background, use approximations if not ready
          calculateLast3GameweeksPoints(allRelevantIds)
            .then((points) => {
              if (!cancelled) {
                setLast3PointsData(points)
              }
            })
            .catch(err => {
              console.warn('Failed to fetch last 3 gameweeks points:', err)
              if (!cancelled) {
                setLast3PointsData({}) // Use empty object, algorithm will use approximations
              }
            })
      } catch (err) {
        if (cancelled) return
        console.error('Error loading data:', err)
        setError(`Failed to load team data: ${err.message || 'Unknown error'}`)
        setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [teamId])

  // Derived State: Recommendations - computed asynchronously to avoid blocking
  const [recommendations, setRecommendations] = useState(null)
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)

  useEffect(() => {
    if (!data || !data.myPicks) {
      setRecommendations(null)
      return
    }

    // Set loading state
    setRecommendationsLoading(true)

    // Use setTimeout to defer computation to next tick (non-blocking)
    const timeoutId = setTimeout(() => {
      try {
        const recs = generateRecommendations(
          data.myPicks,
          data.allPlayers,
          data.allTeams,
          data.fixtures,
          randomSeed,
          fixturesToShow,
          last3PointsData
        )
        setRecommendations(recs)
        setRecommendationsLoading(false)
      } catch (err) {
        console.error('Error generating recommendations:', err)
        setRecommendations(null)
        setRecommendationsLoading(false)
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [data, randomSeed, fixturesToShow, last3PointsData])

  // Derived State: Your Squad - Grouped by Position
  const mySquadDataGrouped = useMemo(() => {
    if (!data || !data.myPicks || !data.myPicks.picks) return { GKP: [], DEF: [], MID: [], FWD: [] }

    const upcomingFixtures = (data.fixtures || []).filter(f => !f.finished_provisional).slice(0, 50)
    
    const players = data.myPicks.picks.map(pick => {
      const player = data.allPlayers.find(pl => pl.id === pick.element)
      if (!player) return null

      const team = data.allTeams.find(t => t.id === player.team)
      const fixtures = getPlayerFixtures(player.id, data.allPlayers, data.allTeams, upcomingFixtures).slice(0, 5)
      const avgDifficulty = fixtures.length > 0
        ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
        : 3

      // Check if player is on bench (position > 11)
      const isBenched = (pick.position || 0) > 11

      return {
        ...player,
        pick,
        team,
        fixtures,
        avgDifficulty,
        isBenched,
        form: parseFloat(player.form || 0),
        totalPoints: player.total_points || 0
      }
    }).filter(p => p !== null)

    // Group by position
    const grouped = {
      GKP: [],
      DEF: [],
      MID: [],
      FWD: []
    }

    players.forEach(player => {
      const positionMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' }
      const position = positionMap[player.element_type] || 'FWD'
      grouped[position].push(player)
    })

    // Sort each group by starting XI first, then bench
    Object.keys(grouped).forEach(position => {
      grouped[position].sort((a, b) => {
        const aPos = a.pick?.position || 99
        const bPos = b.pick?.position || 99
        return aPos - bPos
      })
    })

    return grouped
  }, [data])

  // Derived State: Best Fixtures
  const bestFixturesData = useMemo(() => {
    if (!data || !data.allPlayers || !data.fixtures) return []

    const upcomingFixtures = data.fixtures.filter(f => !f.finished_provisional).slice(0, 50)
    
    return data.allPlayers
      .filter(p => p.minutes > 0) // Only active players
      .map(player => {
        const team = data.allTeams.find(t => t.id === player.team)
        const fixtures = getPlayerFixtures(player.id, data.allPlayers, data.allTeams, upcomingFixtures).slice(0, 5)
        const avgDifficulty = fixtures.length > 0
          ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
          : 5

        return {
          ...player,
          team,
          avgDifficulty,
          form: parseFloat(player.form || 0),
          totalPoints: player.total_points || 0
        }
      })
      .filter(p => p.avgDifficulty <= 3.5) // Only players with relatively easy fixtures
      .sort((a, b) => a.avgDifficulty - b.avgDifficulty) // Sort by easiest fixtures first
      .slice(0, 50) // Limit to top 50
  }, [data])

  // Derived State: Recommended Squad (after transfers, including players being sold)
  const recommendedSquadGrouped = useMemo(() => {
    if (!recommendations || !data || !data.myPicks || !recommendations.suggestedTransfers) {
      return { GKP: [], DEF: [], MID: [], FWD: [] }
    }

    const upcomingFixtures = (data.fixtures || []).filter(f => !f.finished_provisional).slice(0, 50)
    
    // 1. Get IDs of players being sold
    const soldIds = new Set(recommendations.suggestedTransfers.map(t => t.out.id))
    
    // 2. Get players being sold (with special marking)
    const soldPlayers = data.myPicks.picks
      .filter(pick => {
        const player = data.allPlayers.find(pl => pl.id === pick.element)
        return player && soldIds.has(player.id)
      })
      .map(pick => {
        const player = data.allPlayers.find(pl => pl.id === pick.element)
        const team = data.allTeams.find(t => t.id === player.team)
        const fixtures = getPlayerFixtures(player.id, data.allPlayers, data.allTeams, upcomingFixtures).slice(0, 5)
        const avgDifficulty = fixtures.length > 0
          ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
          : 3

        return {
          ...player,
          pick,
          team,
          fixtures,
          avgDifficulty,
          isBenched: (pick.position || 0) > 11,
          form: parseFloat(player.form || 0),
          totalPoints: player.total_points || 0,
          isBeingSold: true, // Mark as being sold
          isNew: false
        }
      })
    
    // 3. Get remaining players (not being sold)
    const remainingPlayers = data.myPicks.picks
      .filter(pick => {
        const player = data.allPlayers.find(pl => pl.id === pick.element)
        return player && !soldIds.has(player.id)
      })
      .map(pick => {
        const player = data.allPlayers.find(pl => pl.id === pick.element)
        const team = data.allTeams.find(t => t.id === player.team)
        const fixtures = getPlayerFixtures(player.id, data.allPlayers, data.allTeams, upcomingFixtures).slice(0, 5)
        const avgDifficulty = fixtures.length > 0
          ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
          : 3

        return {
          ...player,
          pick,
          team,
          fixtures,
          avgDifficulty,
          isBenched: (pick.position || 0) > 11,
          form: parseFloat(player.form || 0),
          totalPoints: player.total_points || 0,
          isBeingSold: false,
          isNew: false
        }
      })
    
    // 4. Add incoming players
    const incomingPlayers = recommendations.suggestedTransfers.map(t => {
      const player = t.in
      const fixtures = getPlayerFixtures(player.id, data.allPlayers, data.allTeams, upcomingFixtures).slice(0, 5)
      const avgDifficulty = fixtures.length > 0
        ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
        : 3

      return {
        ...player,
        team: t.in.team,
        fixtures,
        avgDifficulty,
        isBenched: false,
        form: parseFloat(player.form || 0),
        totalPoints: player.total_points || 0,
        isBeingSold: false,
        isNew: true // Mark as new transfer
      }
    })
    
    // 5. Combine all players (sold, remaining, and incoming)
    const allPlayers = [...soldPlayers, ...remainingPlayers, ...incomingPlayers]
    
    // 6. Group by position
    const grouped = {
      GKP: [],
      DEF: [],
      MID: [],
      FWD: []
    }

    allPlayers.forEach(player => {
      const positionMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' }
      const position = positionMap[player.element_type] || 'FWD'
      grouped[position].push(player)
    })

    // 7. Sort each group: being sold at top, then new, then remaining by form
    Object.keys(grouped).forEach(position => {
      grouped[position].sort((a, b) => {
        // Being sold players first
        if (a.isBeingSold && !b.isBeingSold) return -1
        if (!a.isBeingSold && b.isBeingSold) return 1
        // Then new players
        if (a.isNew && !b.isNew) return -1
        if (!a.isNew && b.isNew) return 1
        // Then by form
        return b.form - a.form
      })
    })

    return grouped
  }, [recommendations, data])

  // Derived State: Captaincy
  const captaincyRecommendation = useMemo(() => {
    if (!recommendations || !data) return null

    // Logic: Captain player with best combination of total points and easy fixtures
    // 1. Get current squad (excluding sold players)
    const soldIds = new Set(recommendations.suggestedTransfers.map(t => t.out.id))
    const currentSquad = data.myPicks.picks
      .map(p => data.allPlayers.find(pl => pl.id === p.element))
      .filter(p => p && !soldIds.has(p.id))

    // 2. Get incoming players
    const incomingPlayers = recommendations.suggestedTransfers.map(t => t.in)

    // 3. Combine and calculate captaincy score
    const finalSquad = [...currentSquad, ...incomingPlayers]

    const scoredSquad = finalSquad.map(p => {
      const fixtures = getPlayerFixtures(p.id, data.allPlayers, data.allTeams, data.fixtures)
      const nextFixture = fixtures[0]
      
      // Base captaincy score heavily weighted on total points
      let captaincyScore = (p.total_points || 0) * 2 // Double weight on season performance
      
      // Add form component
      captaincyScore += (parseFloat(p.form || 0) * 15)
      
      // Fixture difficulty bonus (only for easy fixtures: 1, 2, or 3)
      if (nextFixture) {
        if (nextFixture.difficulty === 1) {
          captaincyScore += 50 // Very easy fixture = big bonus
        } else if (nextFixture.difficulty === 2) {
          captaincyScore += 35 // Easy fixture = good bonus
        } else if (nextFixture.difficulty === 3) {
          captaincyScore += 15 // Moderate fixture = small bonus
        } else if (nextFixture.difficulty === 4) {
          captaincyScore -= 20 // Difficult fixture = penalty
        } else if (nextFixture.difficulty === 5) {
          captaincyScore -= 40 // Very difficult fixture = big penalty
        }
        
        // Home advantage bonus
        if (nextFixture.isHome) {
          captaincyScore += 10
        }
      }
      
      // Add points per game if available
      const ppg = p.total_points && p.minutes > 0 
        ? (p.total_points / (p.minutes / 90)) 
        : 0
      captaincyScore += ppg * 5
      
      return { 
        ...p, 
        captaincyScore,
        nextFixture,
        fixtureBonus: nextFixture ? (nextFixture.difficulty <= 3 ? 'Easy' : 'Hard') : 'Unknown',
        isEligibleForCaptain: nextFixture ? (nextFixture.difficulty <= 2) : false
      }
    })

    // 4. Filter to only eligible captains (fixture difficulty 1 or 2), then sort by captaincy score
    const eligibleCaptains = scoredSquad.filter(p => p.isEligibleForCaptain)
    eligibleCaptains.sort((a, b) => b.captaincyScore - a.captaincyScore)
    
    // Fallback: if no eligible captains with easy fixtures, use best player regardless
    const captainPool = eligibleCaptains.length > 0 ? eligibleCaptains : scoredSquad.sort((a, b) => b.captaincyScore - a.captaincyScore)

    return {
      captain: captainPool[0],
      vice: captainPool[1] || scoredSquad[0] // Vice can be from full pool if needed
    }
  }, [recommendations, data])


  // Handlers
  const handleTeamChange = (newId) => {
    setTeamId(newId)
    localStorage.setItem('fplTeamId', newId)
  }

  const handleRefresh = () => {
    // Force re-fetch
    const currentId = teamId
    setTeamId(null)
    setTimeout(() => setTeamId(currentId), 10)
  }

  // Render Helpers
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

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Consulting the AI Coach...</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-8 text-center">
        <Alert type="error" message="Error" description={error} />
        <Button className="mt-4" onClick={handleRefresh}>Retry</Button>
      </div>
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
      <Layout className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Content className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Error Alert */}
        {error && (
          <Alert
            type="warning"
            message="Partial Data Loaded"
            description={error}
            closable
            onClose={() => setError(null)}
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
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>Refresh</Button>
          </Space>
        </div>

        {/* Team Stats */}
        {data && (
          <Card className="mb-6">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Overall Rank" 
                  value={data?.myTeam?.summary_overall_rank?.toLocaleString() || 'N/A'}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Total Points" 
                  value={data?.myTeam?.summary_overall_points || 0} 
                  prefix={<TrophyOutlined />} 
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Team Value" 
                  value={`£${(data?.myPicks?.entry_history?.value || 0) / 10}m`} 
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Bank" 
                  value={`£${(data?.myPicks?.entry_history?.bank || 0) / 10}m`} 
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Free Transfers" 
                  value={data?.myPicks?.transfers?.limit || 0} 
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* Main Dashboard */}
        <>
            {/* Main Dashboard - Full Width */}
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
                      <div>
                        <Spin spinning={recommendationsLoading}>
                          {/* Header with info */}
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <Title level={5} className="mb-0">Recommended Team for This Gameweek</Title>
                              <Space size="large">
                                {recommendations?.suggestedTransfers && (
                                  <div>
                                    <Text type="secondary">Recommended amount of transfers: </Text>
                                    <Tag color="blue">{recommendations.suggestedTransfers.length}</Tag>
                                  </div>
                                )}
                                {recommendations?.suggestedTransfers && recommendations.suggestedTransfers.length > 0 && (
                                  <div>
                                    <Text type="secondary">Cost/Gain: </Text>
                                    <Text strong style={{ 
                                      color: (() => {
                                        const costGain = recommendations.suggestedTransfers.reduce((sum, transfer) => {
                                          const soldPrice = transfer.out.now_cost / 10;
                                          const boughtPrice = transfer.in.now_cost / 10;
                                          return sum + (soldPrice - boughtPrice);
                                        }, 0);
                                        return costGain >= 0 ? '#52c41a' : '#ff4d4f';
                                      })()
                                    }}>
                                      {(() => {
                                        const costGain = recommendations.suggestedTransfers.reduce((sum, transfer) => {
                                          const soldPrice = transfer.out.now_cost / 10;
                                          const boughtPrice = transfer.in.now_cost / 10;
                                          return sum + (soldPrice - boughtPrice);
                                        }, 0);
                                        return `£${costGain.toFixed(1)}m`;
                                      })()}
                                    </Text>
                                  </div>
                                )}
                              </Space>
                            </div>
                            
                            {/* Legend and Formation */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Space size="small">
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  <span style={{ 
                                    display: 'inline-block', 
                                    width: 12, 
                                    height: 12, 
                                    backgroundColor: '#e6f7ff', 
                                    border: '1px solid #91d5ff',
                                    marginRight: 6,
                                    verticalAlign: 'middle'
                                  }}></span>
                                  Transfer In
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  <span style={{ 
                                    display: 'inline-block', 
                                    width: 12, 
                                    height: 12, 
                                    backgroundColor: '#f5f5f5', 
                                    border: '1px solid #d9d9d9',
                                    marginRight: 6,
                                    verticalAlign: 'middle',
                                    opacity: 0.5
                                  }}></span>
                                  Transfer Out
                                </Text>
                              </Space>
                              
                              {recommendations?.formation && (
                                <Space>
                                  <Text type="secondary" style={{ fontSize: 12 }}>Formation:</Text>
                                  <Tag color="purple">
                                    {recommendations.formation.DEF}-{recommendations.formation.MID}-{recommendations.formation.FWD}
                                  </Tag>
                                </Space>
                              )}
                            </div>
                          </div>

                          {/* Explanations Section */}
                          {recommendations && (
                            <div style={{ marginBottom: 24 }}>
                              {/* Transfer Recommendations Explanation */}
                              {recommendations.suggestedTransfers && recommendations.suggestedTransfers.length > 0 && (
                                <Alert
                                  type="info"
                                  showIcon
                                  style={{ marginBottom: 16 }}
                                  message="Transfer Recommendations"
                                  description={
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                      {recommendations.suggestedTransfers.map((transfer, idx) => {
                                        const outForm = parseFloat(transfer.out.form || 0);
                                        const inForm = parseFloat(transfer.in.form || 0);
                                        const outFixtures = transfer.out.fixtures || [];
                                        const inFixtures = transfer.in.fixtures || [];
                                        const outNextDiff = outFixtures[0]?.difficulty || 3;
                                        const inNextDiff = inFixtures[0]?.difficulty || 3;
                                        const outPrice = transfer.out.now_cost / 10;
                                        const inPrice = transfer.in.now_cost / 10;
                                        
                                        let reason = '';
                                        
                                        // Determine sell reason
                                        if (transfer.out.chance_of_playing_next_round !== null && transfer.out.chance_of_playing_next_round < 75) {
                                          reason += `Selling ${transfer.out.web_name} due to injury/availability concerns (${transfer.out.chance_of_playing_next_round}% fit). `;
                                        } else if (outForm < 3.0) {
                                          reason += `Selling ${transfer.out.web_name} due to poor form (${outForm.toFixed(1)}). `;
                                        } else if (outNextDiff >= 4) {
                                          reason += `Selling ${transfer.out.web_name} due to difficult upcoming fixtures (avg difficulty ${outNextDiff}). `;
                                        } else {
                                          reason += `Selling ${transfer.out.web_name} to upgrade. `;
                                        }
                                        
                                        // Determine buy reason
                                        reason += `Buying ${transfer.in.web_name} because: `;
                                        const buyReasons = [];
                                        if (inForm >= 5.0) buyReasons.push(`excellent form (${inForm.toFixed(1)})`);
                                        else if (inForm >= 4.0) buyReasons.push(`good form (${inForm.toFixed(1)})`);
                                        
                                        if (inNextDiff <= 2) buyReasons.push(`easy fixtures ahead`);
                                        else if (inNextDiff === 3) buyReasons.push(`moderate fixtures`);
                                        
                                        if (transfer.in.total_points > transfer.out.total_points + 20) {
                                          buyReasons.push(`higher season points (${transfer.in.total_points} vs ${transfer.out.total_points})`);
                                        }
                                        
                                        if (inPrice < outPrice) {
                                          buyReasons.push(`saves £${(outPrice - inPrice).toFixed(1)}m`);
                                        } else if (inPrice > outPrice) {
                                          buyReasons.push(`costs £${(inPrice - outPrice).toFixed(1)}m more`);
                                        }
                                        
                                        reason += buyReasons.join(', ') + '.';
                                        
                                        return (
                                          <div key={idx}>
                                            <Text strong>{idx + 1}. </Text>
                                            <Text>{reason}</Text>
                                          </div>
                                        );
                                      })}
                                    </Space>
                                  }
                                />
                              )}

                              {/* Starting 11 Explanation */}
                              {recommendations.starting11 && recommendations.starting11.length > 0 && (
                                <Alert
                                  type="success"
                                  showIcon
                                  style={{ marginBottom: 16 }}
                                  message={`Starting 11 Formation: ${recommendations.formation.DEF}-${recommendations.formation.MID}-${recommendations.formation.FWD}`}
                                  description={
                                    <div>
                                      <Text>
                                        This formation was selected because it maximizes your team&apos;s overall score. 
                                        The starting 11 includes your best {11} players based on form, fixtures, and availability. 
                                        {recommendations.starting11.some(p => {
                                          const chanceOfPlaying = p.chance_of_playing_next_round;
                                          return chanceOfPlaying !== null && chanceOfPlaying >= 75 && chanceOfPlaying < 100;
                                        }) && ' Note: Some players have uncertain availability but are still selected as your best options.'}
                                      </Text>
                                    </div>
                                  }
                                />
                              )}

                              {/* Bench Explanation */}
                              {recommendations.bench && recommendations.bench.length > 0 && (
                                <Alert
                                  type="default"
                                  showIcon
                                  message="Bench Players"
                                  description={
                                    <div>
                                      <Text>
                                        Players on the bench: {recommendations.bench.map(p => p.web_name).join(', ')}. 
                                        {' '}
                                        {(() => {
                                          const benchReasons = [];
                                          const hasInjured = recommendations.bench.some(p => 
                                            p.chance_of_playing_next_round !== null && p.chance_of_playing_next_round < 75
                                          );
                                          const hasPoorForm = recommendations.bench.some(p => parseFloat(p.form || 0) < 3.0);
                                          const hasBadFixtures = recommendations.bench.some(p => {
                                            const fixtures = p.fixtures || [];
                                            return fixtures[0]?.difficulty >= 4;
                                          });
                                          
                                          if (hasInjured) benchReasons.push('injury concerns');
                                          if (hasPoorForm) benchReasons.push('poor form');
                                          if (hasBadFixtures) benchReasons.push('difficult fixtures');
                                          
                                          if (benchReasons.length > 0) {
                                            return `Benched due to: ${benchReasons.join(', ')}.`;
                                          }
                                          return 'Benched as starting 11 provides better overall score.';
                                        })()}
                                      </Text>
                                    </div>
                                  }
                                />
                              )}
                            </div>
                          )}

                          {/* Squad Section */}
                          <div>
                            
                            {/* Goalkeepers */}
                            {recommendedSquadGrouped.GKP.length > 0 && (
                              <div className="mb-6">
                                <Title level={5} className="mb-3">Goalkeepers ({recommendedSquadGrouped.GKP.filter(p => !p.isBeingSold).length})</Title>
                                <StandardTable
                                  dataSource={recommendedSquadGrouped.GKP}
                                  columns={getSquadTableColumns()}
                                  rowKey="id"
                                  pagination={false}
                                  rowClassName={(record) => {
                                    if (record.isBeingSold) return 'transfer-out-row'
                                    if (record.isNew) return 'ant-table-row-selected'
                                    return ''
                                  }}
                                />
                                {/* GK Explanation */}
                                <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                                  <Text type="secondary" style={{ fontSize: 13 }}>
                                    {(() => {
                                      const starting = recommendedSquadGrouped.GKP.find(p => !p.isBenched && !p.isBeingSold);
                                      const benched = recommendedSquadGrouped.GKP.find(p => p.isBenched || (!starting && p));
                                      
                                      if (!starting) return 'No goalkeeper information available.';
                                      
                                      const startingFixDiff = starting.fixtures?.[0]?.difficulty || 3;
                                      const startingForm = parseFloat(starting.form || 0);
                                      
                                      let explanation = `Starting ${starting.web_name}`;
                                      const reasons = [];
                                      
                                      if (starting.isNew) reasons.push('new transfer in');
                                      if (startingForm >= 4.0) reasons.push(`good form (${startingForm.toFixed(1)})`);
                                      if (startingFixDiff <= 2) reasons.push('easy fixture');
                                      if (reasons.length === 0) reasons.push('best available option');
                                      
                                      explanation += ` - ${reasons.join(', ')}.`;
                                      
                                      if (benched && benched !== starting) {
                                        explanation += ` Benching ${benched.web_name}`;
                                        const benchReasons = [];
                                        const benchFixDiff = benched.fixtures?.[0]?.difficulty || 3;
                                        const benchForm = parseFloat(benched.form || 0);
                                        
                                        if (benched.isBeingSold) benchReasons.push('being transferred out');
                                        else if (benchForm < startingForm) benchReasons.push('lower form');
                                        else if (benchFixDiff > startingFixDiff) benchReasons.push('harder fixture');
                                        else benchReasons.push('rotation keeper');
                                        
                                        explanation += ` - ${benchReasons.join(', ')}.`;
                                      }
                                      
                                      return explanation;
                                    })()}
                                  </Text>
                                </div>
                              </div>
                            )}

                            {/* Defenders */}
                            {recommendedSquadGrouped.DEF.length > 0 && (
                              <div className="mb-6">
                                <Title level={5} className="mb-3">Defenders ({recommendedSquadGrouped.DEF.filter(p => !p.isBeingSold).length})</Title>
                                <StandardTable
                                  dataSource={recommendedSquadGrouped.DEF}
                                  columns={getSquadTableColumns()}
                                  rowKey="id"
                                  pagination={false}
                                  rowClassName={(record) => {
                                    if (record.isBeingSold) return 'transfer-out-row'
                                    if (record.isNew) return 'ant-table-row-selected'
                                    return ''
                                  }}
                                />
                                {/* Defenders Explanation */}
                                <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                                  <Text type="secondary" style={{ fontSize: 13 }}>
                                    {(() => {
                                      const starting = recommendedSquadGrouped.DEF.filter(p => !p.isBenched && !p.isBeingSold);
                                      const benched = recommendedSquadGrouped.DEF.filter(p => p.isBenched && !p.isBeingSold);
                                      const beingSold = recommendedSquadGrouped.DEF.filter(p => p.isBeingSold);
                                      
                                      let explanation = '';
                                      
                                      // Starting defenders
                                      if (starting.length > 0) {
                                        explanation += `Starting ${starting.length} defender${starting.length > 1 ? 's' : ''}: ${starting.map(p => p.web_name).join(', ')}. `;
                                        
                                        const hasNewTransfers = starting.some(p => p.isNew);
                                        const hasEasyFixtures = starting.some(p => p.fixtures?.[0]?.difficulty <= 2);
                                        const hasGoodForm = starting.some(p => parseFloat(p.form || 0) >= 4.0);
                                        
                                        const reasons = [];
                                        if (hasNewTransfers) reasons.push('includes new signings');
                                        if (hasEasyFixtures) reasons.push('favorable fixtures');
                                        if (hasGoodForm) reasons.push('good form');
                                        
                                        if (reasons.length > 0) explanation += `Selected for ${reasons.join(' and ')}. `;
                                      }
                                      
                                      // Benched defenders
                                      if (benched.length > 0) {
                                        explanation += `Benched ${benched.length}: ${benched.map(p => p.web_name).join(', ')}. `;
                                        
                                        const reasons = [];
                                        if (benched.some(p => parseFloat(p.form || 0) < 3.0)) reasons.push('poor form');
                                        if (benched.some(p => p.fixtures?.[0]?.difficulty >= 4)) reasons.push('difficult fixtures');
                                        if (benched.some(p => p.minutes < 300)) reasons.push('limited playing time');
                                        
                                        if (reasons.length > 0) explanation += `Reason: ${reasons.join(', ')}.`;
                                      }
                                      
                                      // Being sold
                                      if (beingSold.length > 0) {
                                        explanation += ` Transferring out: ${beingSold.map(p => p.web_name).join(', ')}.`;
                                      }
                                      
                                      return explanation || 'Defender selection optimized for this gameweek.';
                                    })()}
                                  </Text>
                                </div>
                              </div>
                            )}

                            {/* Midfielders */}
                            {recommendedSquadGrouped.MID.length > 0 && (
                              <div className="mb-6">
                                <Title level={5} className="mb-3">Midfielders ({recommendedSquadGrouped.MID.filter(p => !p.isBeingSold).length})</Title>
                                <StandardTable
                                  dataSource={recommendedSquadGrouped.MID}
                                  columns={getSquadTableColumns()}
                                  rowKey="id"
                                  pagination={false}
                                  rowClassName={(record) => {
                                    if (record.isBeingSold) return 'transfer-out-row'
                                    if (record.isNew) return 'ant-table-row-selected'
                                    return ''
                                  }}
                                />
                                {/* Midfielders Explanation */}
                                <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                                  <Text type="secondary" style={{ fontSize: 13 }}>
                                    {(() => {
                                      const starting = recommendedSquadGrouped.MID.filter(p => !p.isBenched && !p.isBeingSold);
                                      const benched = recommendedSquadGrouped.MID.filter(p => p.isBenched && !p.isBeingSold);
                                      const beingSold = recommendedSquadGrouped.MID.filter(p => p.isBeingSold);
                                      
                                      let explanation = '';
                                      
                                      // Starting midfielders
                                      if (starting.length > 0) {
                                        explanation += `Starting ${starting.length} midfielder${starting.length > 1 ? 's' : ''}: ${starting.map(p => p.web_name).join(', ')}. `;
                                        
                                        const topScorer = starting.reduce((best, p) => 
                                          (!best || (p.total_points || 0) > (best.total_points || 0)) ? p : best
                                        , null);
                                        
                                        if (topScorer) {
                                          explanation += `${topScorer.web_name} leads with ${topScorer.total_points} points this season. `;
                                        }
                                        
                                        const hasNewTransfers = starting.some(p => p.isNew);
                                        if (hasNewTransfers) {
                                          const newPlayers = starting.filter(p => p.isNew);
                                          explanation += `New addition${newPlayers.length > 1 ? 's' : ''}: ${newPlayers.map(p => p.web_name).join(', ')}. `;
                                        }
                                      }
                                      
                                      // Benched midfielders
                                      if (benched.length > 0) {
                                        explanation += `Benched: ${benched.map(p => p.web_name).join(', ')} - `;
                                        
                                        const benchedReasons = benched.map(p => {
                                          const form = parseFloat(p.form || 0);
                                          const fixDiff = p.fixtures?.[0]?.difficulty || 3;
                                          
                                          if (form < 3.0) return 'poor form';
                                          if (fixDiff >= 4) return 'hard fixture';
                                          return 'squad rotation';
                                        });
                                        
                                        explanation += benchedReasons[0] + '.';
                                      }
                                      
                                      return explanation || 'Midfielder selection optimized for this gameweek.';
                                    })()}
                                  </Text>
                                </div>
                              </div>
                            )}

                            {/* Forwards */}
                            {recommendedSquadGrouped.FWD.length > 0 && (
                              <div className="mb-6">
                                <Title level={5} className="mb-3">Forwards ({recommendedSquadGrouped.FWD.filter(p => !p.isBeingSold).length})</Title>
                                <StandardTable
                                  dataSource={recommendedSquadGrouped.FWD}
                                  columns={getSquadTableColumns()}
                                  rowKey="id"
                                  pagination={false}
                                  rowClassName={(record) => {
                                    if (record.isBeingSold) return 'transfer-out-row'
                                    if (record.isNew) return 'ant-table-row-selected'
                                    return ''
                                  }}
                                />
                                {/* Forwards Explanation */}
                                <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                                  <Text type="secondary" style={{ fontSize: 13 }}>
                                    {(() => {
                                      const starting = recommendedSquadGrouped.FWD.filter(p => !p.isBenched && !p.isBeingSold);
                                      const benched = recommendedSquadGrouped.FWD.filter(p => p.isBenched && !p.isBeingSold);
                                      const beingSold = recommendedSquadGrouped.FWD.filter(p => p.isBeingSold);
                                      
                                      let explanation = '';
                                      
                                      // Starting forwards
                                      if (starting.length > 0) {
                                        explanation += `Starting ${starting.length} forward${starting.length > 1 ? 's' : ''}: ${starting.map(p => p.web_name).join(', ')}. `;
                                        
                                        const eliteForward = starting.find(p => (p.total_points || 0) > 100);
                                        if (eliteForward) {
                                          explanation += `${eliteForward.web_name} is a premium pick with ${eliteForward.total_points} points. `;
                                        }
                                        
                                        const hasNewTransfers = starting.some(p => p.isNew);
                                        if (hasNewTransfers) {
                                          const newPlayers = starting.filter(p => p.isNew);
                                          explanation += `New signing${newPlayers.length > 1 ? 's' : ''}: ${newPlayers.map(p => p.web_name).join(', ')} with promising fixtures. `;
                                        }
                                      }
                                      
                                      // Benched forwards
                                      if (benched.length > 0) {
                                        explanation += `Benched: ${benched.map(p => p.web_name).join(', ')} - `;
                                        
                                        const benchedReasons = benched.map(p => {
                                          const form = parseFloat(p.form || 0);
                                          const fixDiff = p.fixtures?.[0]?.difficulty || 3;
                                          const minutes = p.minutes || 0;
                                          
                                          if (minutes < 200) return 'limited minutes';
                                          if (form < 2.5) return 'poor form';
                                          if (fixDiff >= 4) return 'hard fixture';
                                          return 'better options available';
                                        });
                                        
                                        explanation += benchedReasons[0] + '.';
                                      }
                                      
                                      // Being sold
                                      if (beingSold.length > 0) {
                                        explanation += ` Transferring out ${beingSold.map(p => p.web_name).join(', ')} to improve the squad.`;
                                      }
                                      
                                      return explanation || 'Forward selection optimized for this gameweek.';
                                    })()}
                                  </Text>
                                </div>
                              </div>
                            )}
                          </div>
                        </Spin>
                      </div>
                    )
                  },
                  {
                    key: '1',
                    label: 'Current Squad',
                    children: (
                      <div>
                        <Spin spinning={loading}>
                          {/* Goalkeepers */}
                          {mySquadDataGrouped.GKP.length > 0 && (
                            <div className="mb-6">
                              <Title level={5} className="mb-3">Goalkeepers ({mySquadDataGrouped.GKP.length})</Title>
                              <StandardTable
                                dataSource={mySquadDataGrouped.GKP}
                                columns={getSquadTableColumns()}
                                rowKey="id"
                                pagination={false}
                              />
                            </div>
                          )}

                          {/* Defenders */}
                          {mySquadDataGrouped.DEF.length > 0 && (
                            <div className="mb-6">
                              <Title level={5} className="mb-3">Defenders ({mySquadDataGrouped.DEF.length})</Title>
                              <StandardTable
                                dataSource={mySquadDataGrouped.DEF}
                                columns={getSquadTableColumns()}
                                rowKey="id"
                                pagination={false}
                              />
                            </div>
                          )}

                          {/* Midfielders */}
                          {mySquadDataGrouped.MID.length > 0 && (
                            <div className="mb-6">
                              <Title level={5} className="mb-3">Midfielders ({mySquadDataGrouped.MID.length})</Title>
                              <StandardTable
                                dataSource={mySquadDataGrouped.MID}
                                columns={getSquadTableColumns()}
                                rowKey="id"
                                pagination={false}
                              />
                            </div>
                          )}

                          {/* Forwards/Attackers */}
                          {mySquadDataGrouped.FWD.length > 0 && (
                            <div className="mb-6">
                              <Title level={5} className="mb-3">Forwards ({mySquadDataGrouped.FWD.length})</Title>
                              <StandardTable
                                dataSource={mySquadDataGrouped.FWD}
                                columns={getSquadTableColumns()}
                                rowKey="id"
                                pagination={false}
                              />
                            </div>
                          )}
                        </Spin>
                      </div>
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
                      <StandardTable
                        loading={loading}
                        dataSource={bestFixturesData}
                        columns={getBestFixturesTableColumns()}
                        rowKey="id"
                      />
                    )
                  },
                  {
                    key: '5',
                    label: 'Chip Strategy',
                    children: (
                      <StrategyTimeline strategy={chipStrategy} />
                    )
                  }
                ]}
              />
            </Card>
          </>
      </Content>
    </Layout>
    </>
  )
}
