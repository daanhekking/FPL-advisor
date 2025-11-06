'use client'

import React, { useState, useEffect } from 'react'
import { 
  Layout, Tabs, Card, Button, Typography, 
  Space, Statistic, Row, Col, Dropdown, Spin, Alert 
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

const { Content } = Layout
const { Title, Text } = Typography
const { TabPane } = Tabs

const DEFAULT_TEAM_ID = '7535279'

const MY_TEAMS = [
  { id: '7535279', name: 'DH-to-the-moon', manager: 'Your Team' },
  { id: '5385777', name: 'Caribbean Chaos', manager: 'Doried Marin' }
]

export default function MyTeamAdvisor() {
  const [teamId, setTeamId] = useState(null)
  const [myTeam, setMyTeam] = useState(null)
  const [myPicks, setMyPicks] = useState(null)
  const [allPlayers, setAllPlayers] = useState([])
  const [allTeams, setAllTeams] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [transfersToUse, setTransfersToUse] = useState(1)
  const [randomSeed, setRandomSeed] = useState(0)
  const [activeTab, setActiveTab] = useState('1')

  useEffect(() => {
    const savedTeamId = localStorage.getItem('fplTeamId') || DEFAULT_TEAM_ID
    setTeamId(savedTeamId)
  }, [])

  useEffect(() => {
    if (teamId) {
      fetchAllData()
    }
  }, [teamId])

  useEffect(() => {
    if (myPicks && allPlayers.length > 0 && allTeams.length > 0 && fixtures.length > 0) {
      const recs = generateRecommendations(myPicks, allPlayers, allTeams, fixtures, transfersToUse, randomSeed)
      setRecommendations(recs)
    }
  }, [transfersToUse, randomSeed, myPicks, allPlayers, allTeams, fixtures])

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
      
      const recs = generateRecommendations(picks, bootstrap.elements, bootstrap.teams, fixturesData, 1, 0)
      setRecommendations(recs)
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(`Failed to load your team: ${err.message}`)
      setLoading(false)
    }
  }

  const generateRecommendations = (picks, players, teams, fixtures, numTransfers, seed = 0) => {
    const myPlayerIds = picks.picks.map(p => p.element)
    const myPlayerData = myPlayerIds.map(id => {
      const player = players.find(p => p.id === id)
      const pick = picks.picks.find(p => p.element === id)
      return { ...player, pick }
    }).filter(p => p && p.id)
    
    const upcomingFixtures = fixtures.filter(f => !f.finished_provisional).slice(0, 50)
    const budget = (picks.entry_history?.bank || 0) / 10
    
    // Helper function to get fixtures for a player
    const getPlayerFixtures = (playerId) => {
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
    
    // Find weak players
    const weakPlayers = myPlayerData
      .filter(p => {
        const form = parseFloat(p.form || 0)
        const isInjured = p.chance_of_playing_next_round !== null && p.chance_of_playing_next_round < 75
        return form < 2.5 || isInjured || p.minutes < 100
      })
      .map(p => {
        const team = teams.find(t => t.id === p.team)
        const fixtures = getPlayerFixtures(p.id)
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
        const fixtures = getPlayerFixtures(p.id)
        
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
        const fixtures = getPlayerFixtures(p.id)
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

  const handleTeamSwitch = (newTeamId) => {
    setTeamId(newTeamId)
    localStorage.setItem('fplTeamId', newTeamId)
    setRandomSeed(0)
    setTransfersToUse(1)
  }

  const handleRandomize = () => {
    setRandomSeed(prev => prev + 1)
  }

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '50px' }}>
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" danger onClick={fetchAllData}>
                Retry
              </Button>
            }
          />
        </Content>
      </Layout>
    )
  }

  if (!myTeam || !myPicks || !recommendations) {
    return <Spin size="large" />
  }

  const getCurrentTeamInfo = () => MY_TEAMS.find(t => t.id === teamId) || MY_TEAMS[0]
  const teamMenuItems = MY_TEAMS.filter(t => t.id !== teamId).map(team => ({
    key: team.id,
    label: (
      <div>
        <div style={{ fontWeight: 600 }}>{team.name}</div>
        <div style={{ fontSize: 12, color: '#666' }}>Manager: {team.manager}</div>
      </div>
    ),
    onClick: () => handleTeamSwitch(team.id)
  }))

  // Prepare squad data with fixtures
  const myPlayerData = myPicks.picks.map(pick => {
    const player = allPlayers.find(p => p.id === pick.element)
    if (!player) return null
    const team = allTeams.find(t => t.id === player.team)
    const isBenched = pick.position > 11
    
    const upcomingFixtures = fixtures.filter(f => !f.finished_provisional).slice(0, 50)
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
    
    return { ...player, pick, team, isBenched, fixtures: nextFixtures }
  }).filter(p => p !== null)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Team Info Card */}
          <Card bordered={false}>
            <Row gutter={24} align="middle">
              <Col flex="auto">
                <Space direction="vertical" size={0}>
                  <Space size="small" align="center">
                    <Title level={2} style={{ margin: 0 }}>{myTeam.name}</Title>
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
              <Col>
                <Statistic 
                  title="Points" 
                  value={myPicks.entry_history?.points || 0} 
                  valueStyle={{ color: '#1677ff' }}
                />
              </Col>
              <Col>
                <Statistic 
                  title="Team Value" 
                  value={((myPicks.entry_history?.value || 0) / 10).toFixed(1)} 
                  prefix="£"
                  suffix="m"
                />
              </Col>
              <Col>
                <Statistic 
                  title="Bank" 
                  value={((myPicks.entry_history?.bank || 0) / 10).toFixed(1)} 
                  prefix="£"
                  suffix="m"
                />
              </Col>
            </Row>
          </Card>

          {/* Tabs */}
          <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
            <TabPane tab="🏆 Plan Transfers" key="1">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Suggested Transfers */}
                {recommendations.suggestedTransfers.length > 0 && (
                  <Card 
                    title="💡 Suggested Team Setup" 
                    extra={
                      <Space>
                        <Text>Transfers:</Text>
                        <Button onClick={() => setTransfersToUse(Math.max(1, transfersToUse - 1))}>-</Button>
                        <Text strong>{transfersToUse}</Text>
                        <Button onClick={() => setTransfersToUse(transfersToUse + 1)}>+</Button>
                        <Button icon={<ReloadOutlined />} onClick={handleRandomize}>
                          Randomize
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
                  />
                </Card>

                {/* Consider Selling */}
                <Card title="⚠️ Consider Selling">
                  {recommendations.weakPlayers.length > 0 ? (
                    <StandardTable
                      columns={getWeakPlayersTableColumns()}
                      dataSource={recommendations.weakPlayers}
                      scroll={{ x: 900 }}
                    />
                  ) : (
                    <Text type="secondary">Team looks solid 💪</Text>
                  )}
                </Card>
              </Space>
            </TabPane>

            <TabPane tab="👥 Your Squad" key="2">
              <Card>
                <StandardTable
                  columns={getSquadTableColumns()}
                  dataSource={myPlayerData}
                  pagination={false}
                  scroll={{ x: 1000 }}
                />
              </Card>
            </TabPane>

            <TabPane tab="📅 Best Fixtures" key="3">
              <Card title="⭐ Teams with Best Upcoming Fixtures">
                <Text type="secondary">
                  Coming soon - fixture analysis by team
                </Text>
              </Card>
            </TabPane>
          </Tabs>
        </Space>
      </Content>
    </Layout>
  )
}
