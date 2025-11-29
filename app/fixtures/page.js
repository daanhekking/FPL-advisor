'use client'

import { useState, useEffect } from 'react'
import { 
  Card, Typography, Tag, Space, Row, Col, 
  Spin, Alert, Button, Layout 
} from 'antd'

const { Title, Text } = Typography
const { Content } = Layout

export default function Fixtures() {
  const [teams, setTeams] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchFixturesData()
  }, [])

  const fetchFixturesData = async () => {
    try {
      setLoading(true)
      // Fetch bootstrap-static data for teams
      const bootstrapResponse = await fetch('/api/fpl/bootstrap')
      const bootstrapData = await bootstrapResponse.json()
      
      // Fetch fixtures
      const fixturesResponse = await fetch('/api/fpl/fixtures')
      const fixturesData = await fixturesResponse.json()
      
      // Get upcoming fixtures (next 5 gameweeks)
      const upcomingFixtures = fixturesData.filter(f => !f.finished_provisional).slice(0, 50)
      
      // Calculate fixture difficulty for each team
      const teamsWithFixtures = bootstrapData.teams.map(team => {
        const teamFixtures = upcomingFixtures
          .filter(f => f.team_h === team.id || f.team_a === team.id)
          .slice(0, 5)
          .map(f => {
            const isHome = f.team_h === team.id
            const opponent = bootstrapData.teams.find(t => t.id === (isHome ? f.team_a : f.team_h))
            return {
              opponent: opponent?.short_name || 'TBD',
              difficulty: isHome ? f.team_h_difficulty : f.team_a_difficulty,
              isHome: isHome,
              event: f.event
            }
          })
        
        const avgDifficulty = teamFixtures.length > 0
          ? (teamFixtures.reduce((sum, f) => sum + f.difficulty, 0) / teamFixtures.length).toFixed(1)
          : 0
        
        return {
          id: team.id,
          name: team.name,
          shortName: team.short_name,
          fixtures: teamFixtures,
          avgDifficulty: parseFloat(avgDifficulty)
        }
      })
      
      // Sort by average difficulty (easier fixtures first)
      teamsWithFixtures.sort((a, b) => a.avgDifficulty - b.avgDifficulty)
      
      setTeams(teamsWithFixtures)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching fixtures:', err)
      setError('Failed to load fixtures data')
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty) => {
    if (difficulty <= 2) return 'difficulty-1'
    if (difficulty === 2.5) return 'difficulty-2'
    if (difficulty === 3) return 'difficulty-3'
    if (difficulty === 3.5 || difficulty === 4) return 'difficulty-4'
    return 'difficulty-5'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading fixtures..." />
      </div>
    )
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Error"
        description={error}
        action={
          <Button size="small" danger onClick={fetchFixturesData}>
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>Fixture Difficulty</Title>
          <Text type="secondary">
            Upcoming fixtures for all Premier League teams (sorted by difficulty)
          </Text>
          <div style={{ marginTop: 16 }}>
            <Space>
              <Tag color="success">Easy</Tag>
              <Tag color="warning">Medium</Tag>
              <Tag color="error">Hard</Tag>
            </Space>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {teams.map((team) => (
            <Col xs={24} lg={12} key={team.id}>
              <Card>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>{team.name}</Title>
                    <Text type="secondary">{team.shortName}</Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      Avg Difficulty
                    </Text>
                    <Text strong style={{ fontSize: 24 }}>
                      {team.avgDifficulty}
                    </Text>
                  </div>
                </div>

                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {team.fixtures.map((fixture, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 6
                      }}
                    >
                      <Space>
                        <Text type="secondary" style={{ minWidth: 40 }}>
                          GW{fixture.event}
                        </Text>
                        <Text strong>
                          {fixture.isHome ? 'vs' : '@'} {fixture.opponent}
                        </Text>
                      </Space>
                      <Tag color={getDifficultyColor(fixture.difficulty)}>
                        {fixture.difficulty}
                      </Tag>
                    </div>
                  ))}
                  {team.fixtures.length === 0 && (
                    <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 24 }}>
                      No upcoming fixtures
                    </Text>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Content>
    </Layout>
  )
}

