'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Layout, Tabs, Card, Button, Typography, 
  Space, Statistic, Row, Col, Dropdown, Spin, Alert, Tag 
} from 'antd'
import { 
  SwapOutlined, ReloadOutlined
} from '@ant-design/icons'

// Standardized components
import { StandardTable } from './components/StandardTable'
import { TransferCard } from './components/TransferCard'
import { 
  getTargetsTableColumns, 
  getWeakPlayersTableColumns, 
  getSquadTableColumns 
} from './components/TableColumns'
import { getPositionName } from './utils/helpers'

const { Content } = Layout
const { Title, Text } = Typography

const DEFAULT_TEAM_ID = '7535279'

const MY_TEAMS = [
  { id: '7535279', name: 'DH-to-the-moon', manager: 'Your Team' },
  { id: '5385777', name: 'Caribbean Chaos', manager: 'Doried Marin' }
]

// Helper function to get fixtures for a player (moved outside component to avoid recreating)
const getPlayerFixtures = (playerId, players, teams, upcomingFixtures) => {
  const player = players.find(p => p.id === playerId)
  if (!player) return []
  
  return upcomingFixtures
    .filter(f => f.team_h === player.team || f.team_a === player.team)
    .slice(0, 5)
    .map(f => {
      const isHome = f.team_h === player.team
      const opponentId = isHome ? f.team_a : f.team_h
      const opponent = teams.find(t => t.id === opponentId)
      const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty
      return {
        opponent: opponent?.short_name || 'TBD',
        difficulty,
        isHome,
        event: f.event
      }
    })
}

// Generate recommendations (optimized with memoization-friendly structure)
const generateRecommendations = (picks, players, teams, fixtures, numTransfers, seed = 0) => {
  const myPlayerIds = picks.picks.map(p => p.element)
  const myPlayerData = myPlayerIds.map(id => {
    const player = players.find(p => p.id === id)
    const pick = picks.picks.find(p => p.element === id)
    return { ...player, pick }
  }).filter(p => p && p.id)
  
  const upcomingFixtures = fixtures.filter(f => !f.finished_provisional).slice(0, 50)
  const budget = (picks.entry_history?.bank || 0) / 10
  
  // Find weak players
  const weakPlayers = myPlayerData
    .filter(p => {
      const form = parseFloat(p.form || 0)
      const isInjured = p.chance_of_playing_next_round !== null && p.chance_of_playing_next_round < 75
      return form < 2.5 || isInjured || p.minutes < 100
    })
    .map(p => {
      const team = teams.find(t => t.id === p.team)
      const fixtures = getPlayerFixtures(p.id, players, teams, upcomingFixtures)
      return { ...p, fixtures, team }
    })
    .sort((a, b) => parseFloat(a.form || 0) - parseFloat(b.form || 0))
  
  // Find best transfer targets
  const transferTargets = players
    .filter(p => {
      const form = parseFloat(p.form || 0)
      const price = p.now_cost / 10
      const notInMyTeam = !myPlayerIds.includes(p.id)
      return notInMyTeam && form > 4 && p.minutes > 300 && price <= budget + 15
    })
    .map(p => {
      const team = teams.find(t => t.id === p.team)
      const fixtures = getPlayerFixtures(p.id, players, teams, upcomingFixtures)
      
      const avgDifficulty = fixtures.length > 0
        ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
        : 3
      
      const form = parseFloat(p.form || 0)
      const pointsPerMillion = p.total_points / (p.now_cost / 10)
      const transferScore = form * 10 + (5 - avgDifficulty) * 5 + pointsPerMillion * 2
      
      return { ...p, team, avgDifficulty, transferScore, fixtures }
    })
    .sort((a, b) => b.transferScore - a.transferScore)
    .slice(0, 50)
  
  // Generate suggested transfers
  const suggestedTransfers = []
  
  // Get all potential players to sell (weak players first, then others sorted by form/fixtures)
  const weakPlayerIds = new Set(weakPlayers.map(p => p.id))
  const otherPlayers = myPlayerData
    .filter(p => !weakPlayerIds.has(p.id))
    .map(p => {
      const fixtures = getPlayerFixtures(p.id, players, teams, upcomingFixtures)
      const avgDifficulty = fixtures.length > 0
        ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
        : 3
      return { ...p, fixtures, avgDifficulty }
    })
    .sort((a, b) => {
      // Sort by combination of form and fixture difficulty
      const scoreA = parseFloat(a.form || 0) - a.avgDifficulty
      const scoreB = parseFloat(b.form || 0) - b.avgDifficulty
      return scoreA - scoreB
    })
  
  // Combine weak players first, then other players
  const allPotentialSells = [...weakPlayers, ...otherPlayers]
  
  // Calculate cumulative budget
  let cumulativeBudget = budget
  const playersToSell = allPotentialSells.slice(0, numTransfers)
  playersToSell.forEach(p => {
    cumulativeBudget += p.now_cost / 10
  })
  
  let remainingBudget = cumulativeBudget
  const usedPlayerIds = new Set()
  
  for (let i = 0; i < Math.min(numTransfers, allPotentialSells.length); i++) {
    const playerOut = allPotentialSells[i]
    if (!playerOut) break
    
    const isNotRecommended = !weakPlayerIds.has(playerOut.id)
    const playerOutPrice = playerOut.now_cost / 10
    
    const samePositionTargets = transferTargets.filter(p => 
      !usedPlayerIds.has(p.id) &&
      p.element_type === playerOut.element_type && 
      (p.now_cost / 10) <= remainingBudget
    )
    
    if (samePositionTargets.length > 0) {
      const targetIndex = seed > 0 && samePositionTargets.length > 1 
        ? Math.min(seed % samePositionTargets.length, samePositionTargets.length - 1)
        : 0
      const playerIn = samePositionTargets[targetIndex]
      
      remainingBudget = remainingBudget - (playerIn.now_cost / 10)
      usedPlayerIds.add(playerIn.id)
      
      suggestedTransfers.push({
        out: playerOut,
        in: playerIn,
        budget: remainingBudget,
        priceDiff: (playerIn.now_cost / 10) - playerOutPrice,
        notRecommended: isNotRecommended
      })
    }
  }
  
  return {
    weakPlayers,
    transferTargets,
    budget,
    suggestedTransfers
  }
}

export default function MyTeamAdvisor() {
  const [teamId, setTeamId] = useState(null)
  const [myTeam, setMyTeam] = useState(null)
  const [myPicks, setMyPicks] = useState(null)
  const [allPlayers, setAllPlayers] = useState([])
  const [allTeams, setAllTeams] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [transfersToUse, setTransfersToUse] = useState(1)
  const [randomSeed, setRandomSeed] = useState(0)
  const [activeTab, setActiveTab] = useState('1')

  // Initialize team ID from localStorage
  useEffect(() => {
    const savedTeamId = localStorage.getItem('fplTeamId') || DEFAULT_TEAM_ID
    setTeamId(savedTeamId)
  }, [])

  // Fetch data when team changes
  useEffect(() => {
    if (!teamId) return
    
    const fetchAllData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [bootstrapRes, teamRes, picksRes, fixturesRes] = await Promise.all([
          fetch('/api/fpl/bootstrap'),
          fetch(`/api/fpl/team/${teamId}`),
          fetch(`/api/fpl/team/${teamId}/picks?gameweek=current`),
          fetch('/api/fpl/fixtures')
        ])
        
        if (!bootstrapRes.ok || !teamRes.ok || !picksRes.ok || !fixturesRes.ok) {
          throw new Error('Failed to fetch data from API')
        }
        
        const [bootstrap, team, picks, fixturesData] = await Promise.all([
          bootstrapRes.json(),
          teamRes.json(),
          picksRes.json(),
          fixturesRes.json()
        ])
        
        setAllPlayers(bootstrap.elements)
        setAllTeams(bootstrap.teams)
        setMyTeam(team)
        setMyPicks(picks)
        setFixtures(fixturesData)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(`Failed to load your team: ${err.message}`)
        setLoading(false)
      }
    }
    
    fetchAllData()
  }, [teamId])

  // Memoize recommendations to avoid recalculating on every render
  const recommendations = useMemo(() => {
    if (!myPicks || allPlayers.length === 0 || allTeams.length === 0 || fixtures.length === 0) {
      return null
    }
    return generateRecommendations(myPicks, allPlayers, allTeams, fixtures, transfersToUse, randomSeed)
  }, [myPicks, allPlayers, allTeams, fixtures, transfersToUse, randomSeed])

  // Memoize squad data
  const myPlayerData = useMemo(() => {
    if (!myPicks || allPlayers.length === 0 || allTeams.length === 0 || fixtures.length === 0) {
      return []
    }

    const upcomingFixtures = fixtures.filter(f => !f.finished_provisional).slice(0, 50)
    
    return myPicks.picks.map(pick => {
      const player = allPlayers.find(p => p.id === pick.element)
      if (!player) return null
      const team = allTeams.find(t => t.id === player.team)
      const isBenched = pick.position > 11
      
      const nextFixtures = upcomingFixtures
        .filter(f => f.team_h === player.team || f.team_a === player.team)
        .slice(0, 5)
        .map(f => {
          const isHome = f.team_h === player.team
          const opponentId = isHome ? f.team_a : f.team_h
          const opponent = allTeams.find(t => t.id === opponentId)
          const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty
          return {
            opponent: opponent?.short_name || 'TBD',
            difficulty,
            isHome,
            event: f.event
          }
        })
      
      // Calculate average difficulty
      const avgDifficulty = nextFixtures.length > 0
        ? nextFixtures.reduce((sum, f) => sum + f.difficulty, 0) / nextFixtures.length
        : 3
      
      return { ...player, pick, team, isBenched, fixtures: nextFixtures, avgDifficulty }
    }).filter(p => p !== null)
  }, [myPicks, allPlayers, allTeams, fixtures])

  // Calculate total team points
  const totalTeamPoints = useMemo(() => {
    return myPlayerData.reduce((sum, player) => sum + (player.total_points || 0), 0)
  }, [myPlayerData])

  // Calculate best fixtures by team
  const bestFixtureTeams = useMemo(() => {
    if (allPlayers.length === 0 || allTeams.length === 0 || fixtures.length === 0) {
      return []
    }

    const upcomingFixtures = fixtures.filter(f => !f.finished_provisional).slice(0, 50)
    
    // Calculate average difficulty for each team
    const teamFixtureData = allTeams.map(team => {
      const teamFixtures = upcomingFixtures
        .filter(f => f.team_h === team.id || f.team_a === team.id)
        .slice(0, 5)
        .map(f => {
          const isHome = f.team_h === team.id
          const opponentId = isHome ? f.team_a : f.team_h
          const opponent = allTeams.find(t => t.id === opponentId)
          const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty
          return {
            opponent: opponent?.short_name || 'TBD',
            difficulty,
            isHome,
            event: f.event
          }
        })
      
      const avgDifficulty = teamFixtures.length > 0
        ? teamFixtures.reduce((sum, f) => sum + f.difficulty, 0) / teamFixtures.length
        : 5

      // Get top 10 players from this team
      const teamPlayers = allPlayers
        .filter(p => p.team === team.id && p.minutes > 100)
        .map(p => {
          const avgPoints = p.minutes > 0 ? (p.total_points / (p.minutes / 90)).toFixed(1) : '0.0'
          const medianPoints = p.minutes > 0 ? (p.total_points / (p.minutes / 90) * 0.85).toFixed(1) : '0.0' // Approximation
          return {
            ...p,
            avgPoints,
            medianPoints,
            fixtures: teamFixtures
          }
        })
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 10)

      return {
        ...team,
        fixtures: teamFixtures,
        avgDifficulty,
        players: teamPlayers
      }
    })
    
    // Sort teams by best fixtures (lowest difficulty)
    return teamFixtureData
      .filter(t => t.fixtures.length > 0)
      .sort((a, b) => a.avgDifficulty - b.avgDifficulty)
      .slice(0, 10) // Top 10 teams with best fixtures
  }, [allPlayers, allTeams, fixtures])

  // Memoized handlers
  const handleRetry = useCallback(() => {
    setTeamId(prev => prev) // Trigger refetch by updating state
    window.location.reload()
  }, [])

  const handleTeamSwitch = useCallback((newTeamId) => {
    setTeamId(newTeamId)
    localStorage.setItem('fplTeamId', newTeamId)
    setRandomSeed(0)
    setTransfersToUse(1)
  }, [])

  const handleRandomize = useCallback(() => {
    setRandomSeed(prev => prev + 1)
  }, [])

  const handleTransferIncrease = useCallback(() => {
    setTransfersToUse(prev => prev + 1)
  }, [])

  const handleTransferDecrease = useCallback(() => {
    setTransfersToUse(prev => Math.max(1, prev - 1))
  }, [])

  // Memoize team menu items
  const teamMenuItems = useMemo(() => 
    MY_TEAMS.filter(t => t.id !== teamId).map(team => ({
      key: team.id,
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>{team.name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Manager: {team.manager}</div>
        </div>
      ),
      onClick: () => handleTeamSwitch(team.id)
    }))
  , [teamId, handleTeamSwitch])

  // Loading state
  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <Spin size="large" tip="Loading your team..." />
        </Content>
      </Layout>
    )
  }

  // Error state
  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px', maxWidth: 600, margin: '50px auto' }}>
          <Alert
            message="Error Loading Team"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" danger onClick={handleRetry}>
                Retry
              </Button>
            }
          />
        </Content>
      </Layout>
    )
  }

  // No data state
  if (!myTeam || !myPicks || !recommendations) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ 
        padding: '16px', 
        maxWidth: 1400, 
        margin: '0 auto', 
        width: '100%'
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Team Info Card */}
          <Card bordered={false}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={24} md={12} lg={12}>
                <Space direction="vertical" size={0}>
                  <Space size="small" align="center">
                    <Title level={2} style={{ margin: 0, fontSize: 'clamp(20px, 5vw, 24px)' }}>
                      {myTeam.name}
                    </Title>
                    <Dropdown menu={{ items: teamMenuItems }} trigger={['click']}>
                      <Button 
                        type="text" 
                        icon={<SwapOutlined />}
                        size="small"
                        style={{ fontSize: 16 }}
                      />
                    </Dropdown>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    GW{myPicks.entry_history?.event || 'Current'} • 
                    Rank: {myTeam.summary_overall_rank?.toLocaleString() || 'N/A'}
                  </Text>
                </Space>
              </Col>
              <Col xs={8} sm={8} md={6} lg={3}>
                <Statistic 
                  title="GW Points" 
                  value={myPicks.entry_history?.points || 0} 
                  valueStyle={{ color: '#1677ff', fontSize: 'clamp(18px, 4vw, 24px)' }}
                />
              </Col>
              <Col xs={8} sm={8} md={6} lg={3}>
                <Statistic 
                  title="Total Points" 
                  value={totalTeamPoints} 
                  valueStyle={{ fontSize: 'clamp(18px, 4vw, 24px)' }}
                />
              </Col>
              <Col xs={8} sm={8} md={6} lg={3}>
                <Statistic 
                  title="Team Value" 
                  value={((myPicks.entry_history?.value || 0) / 10).toFixed(1)} 
                  prefix="£"
                  suffix="m"
                  valueStyle={{ fontSize: 'clamp(18px, 4vw, 24px)' }}
                />
              </Col>
              <Col xs={8} sm={8} md={6} lg={3}>
                <Statistic 
                  title="Bank" 
                  value={((myPicks.entry_history?.bank || 0) / 10).toFixed(1)} 
                  prefix="£"
                  suffix="m"
                  valueStyle={{ fontSize: 'clamp(18px, 4vw, 24px)' }}
                />
              </Col>
            </Row>
          </Card>

          {/* Tabs */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            size="large"
            type="line"
          >
            <Tabs.TabPane tab="🏆 Plan Transfers" key="1">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Suggested Transfers */}
                {recommendations.suggestedTransfers.length > 0 && (
                  <Card 
                    title="💡 Suggested Team Setup" 
                    extra={
                      <Space wrap>
                        <Text style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>Transfers:</Text>
                        <Button size="small" onClick={handleTransferDecrease}>-</Button>
                        <Text strong style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                          {transfersToUse}
                        </Text>
                        <Button size="small" onClick={handleTransferIncrease}>+</Button>
                        <Button 
                          icon={<ReloadOutlined />} 
                          onClick={handleRandomize}
                          size="small"
                        >
                          <span style={{ display: 'inline-block' }}>Randomize</span>
                        </Button>
                      </Space>
                    }
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {recommendations.suggestedTransfers.map((transfer, idx) => (
                        <TransferCard 
                          key={idx} 
                          transfer={transfer} 
                          allTeams={allTeams} 
                        />
                      ))}
                    </Space>
                  </Card>
                )}

                {/* Top Targets */}
                <Card title="⭐ Top Targets">
                  <StandardTable
                    columns={getTargetsTableColumns()}
                    dataSource={recommendations.transferTargets}
                    scroll={{ x: 800 }}
                  />
                </Card>

                {/* Consider Selling */}
                <Card title="⚠️ Consider Selling">
                  {recommendations.weakPlayers.length > 0 ? (
                    <StandardTable
                      columns={getWeakPlayersTableColumns()}
                      dataSource={recommendations.weakPlayers}
                      scroll={{ x: 800 }}
                    />
                  ) : (
                    <Alert
                      message="Team looks solid 💪"
                      description="No obvious weak links in your squad"
                      type="success"
                      showIcon
                    />
                  )}
                </Card>
              </Space>
            </Tabs.TabPane>

            <Tabs.TabPane tab="👥 Your Squad" key="2">
              <Card>
                <StandardTable
                  columns={getSquadTableColumns()}
                  dataSource={myPlayerData}
                  pagination={false}
                  scroll={{ x: 900 }}
                />
              </Card>
            </Tabs.TabPane>

            <Tabs.TabPane tab="📅 Best Fixtures" key="3">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {bestFixtureTeams.map((team, idx) => (
                  <Card 
                    key={team.id}
                    title={
                      <Space>
                        <Text strong style={{ fontSize: 18 }}>
                          #{idx + 1} {team.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 14 }}>
                          Avg Difficulty: {team.avgDifficulty.toFixed(2)}
                        </Text>
                      </Space>
                    }
                    extra={
                      <Space size={4}>
                        {team.fixtures.map((fixture, fIdx) => (
                          <Tag 
                            key={fIdx}
                            color={
                              fixture.difficulty <= 2 ? 'success' : 
                              fixture.difficulty <= 3 ? 'warning' : 
                              'error'
                            }
                          >
                            {fixture.isHome ? '' : '@'}{fixture.opponent}
                          </Tag>
                        ))}
                      </Space>
                    }
                  >
                    <Row gutter={[16, 16]}>
                      {team.players.map(player => (
                        <Col xs={24} sm={12} md={8} lg={6} key={player.id}>
                          <Card 
                            size="small" 
                            hoverable
                            style={{ height: '100%' }}
                          >
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              <Text strong style={{ fontSize: 14 }}>
                                {player.web_name}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {getPositionName(player.element_type)} • £{(player.now_cost / 10).toFixed(1)}m
                              </Text>
                              <Space split={<Text type="secondary">•</Text>} style={{ fontSize: 12 }}>
                                <span>Total: {player.total_points}</span>
                                <span>Form: {player.form}</span>
                              </Space>
                              <Space split={<Text type="secondary">•</Text>} style={{ fontSize: 12 }}>
                                <span>Avg: {player.avgPoints}</span>
                                <span>Med: {player.medianPoints}</span>
                              </Space>
                            </Space>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                ))}
              </Space>
            </Tabs.TabPane>
          </Tabs>
        </Space>
      </Content>
    </Layout>
  )
}
