'use client'

import { useState, useEffect } from 'react'

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#37003c]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold mb-2">Error</p>
        <p>{error}</p>
        <button 
          onClick={fetchFixturesData}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Fixture Difficulty</h2>
        <p className="text-gray-600 mt-2">Upcoming fixtures for all Premier League teams (sorted by difficulty)</p>
        <div className="mt-4 flex gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded difficulty-1"></span> Easy
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded difficulty-3"></span> Medium
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded difficulty-5"></span> Hard
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
          >
            <div className="bg-[#37003c] text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">{team.name}</h3>
                  <p className="text-sm opacity-80">{team.shortName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-80">Avg Difficulty</p>
                  <p className="text-2xl font-bold">{team.avgDifficulty}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {team.fixtures.map((fixture, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-500 w-8">
                        GW{fixture.event}
                      </span>
                      <span className="font-medium text-gray-900">
                        {fixture.isHome ? 'vs' : '@'} {fixture.opponent}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(fixture.difficulty)}`}>
                      {fixture.difficulty}
                    </span>
                  </div>
                ))}
                {team.fixtures.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No upcoming fixtures</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

