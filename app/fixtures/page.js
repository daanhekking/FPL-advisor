'use client'

import React, { useState, useEffect } from 'react'
import {
  Row, Col, Layout, PageHeader, Section, LoadingSpinner,
  FixtureDifficultyTag, Typography, Space, Badge
} from '../design-system'

const { Text } = Typography
const { Content } = Layout

export default function Fixtures() {
  const [teams, setTeams] = useState([])
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
          ? (teamFixtures.reduce((sum, f) => sum + f.difficulty, 0) / teamFixtures.length)
          : 0

        return {
          id: team.id,
          name: team.name,
          shortName: team.short_name,
          fixtures: teamFixtures,
          avgDifficulty: avgDifficulty
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

  if (loading) {
    return <LoadingSpinner fullScreen tip="Analyzing fixture difficulty..." />
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Fixture Difficulty"
          description="Upcoming fixtures for all Premier League teams (sorted by difficulty)"
          actions={[
            <Space key="tags">
              <Badge status="success" text="Easy" />
              <Badge status="warning" text="Medium" />
              <Badge status="error" text="Hard" />
            </Space>
          ]}
        />

        {error && (
          <Section>
            <Text type="danger">{error}</Text>
          </Section>
        )}

        <Row gutter={[16, 16]}>
          {teams.map((team) => (
            <Col xs={24} lg={12} key={team.id}>
              <Section
                title={team.name}
                description={team.shortName}
                extra={
                  <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      Avg Difficulty
                    </Text>
                    <FixtureDifficultyTag difficulty={team.avgDifficulty} />
                  </div>
                }
              >
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
                      <FixtureDifficultyTag difficulty={fixture.difficulty} showLabel={false} />
                    </div>
                  ))}
                  {team.fixtures.length === 0 && (
                    <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 24 }}>
                      No upcoming fixtures
                    </Text>
                  )}
                </Space>
              </Section>
            </Col>
          ))}
        </Row>
      </Content>
    </Layout>
  )
}

