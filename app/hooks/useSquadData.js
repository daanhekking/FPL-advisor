'use client'

import { useMemo } from 'react'
import { getPlayerFixtures } from '../services/fpl-service'

/**
 * Custom hook to process and group squad data by position
 * Provides current squad and recommended squad groupings
 * 
 * @param {Object} data - FPL data
 * @param {Object} recommendations - Recommendations data
 * @returns {Object} { mySquadDataGrouped, recommendedSquadGrouped, bestFixturesData, captaincyRecommendation }
 */
export const useSquadData = (data, recommendations = null) => {
  // Current Squad Grouped by Position
  const mySquadDataGrouped = useMemo(() => {
    if (!data || !data.myPicks || !data.myPicks.picks) {
      return { GKP: [], DEF: [], MID: [], FWD: [] }
    }

    const upcomingFixtures = (data.fixtures || []).filter(f => !f.finished_provisional).slice(0, 50)
    
    const players = data.myPicks.picks.map(pick => {
      const player = data.allPlayers.find(pl => pl.id === pick.element)
      if (!player) return null

      const team = data.allTeams.find(t => t.id === player.team)
      const fixtures = getPlayerFixtures(player.id, data.allPlayers, data.allTeams, upcomingFixtures).slice(0, 5)
      const avgDifficulty = fixtures.length > 0
        ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
        : 3

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
    const grouped = { GKP: [], DEF: [], MID: [], FWD: [] }
    const positionMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' }

    players.forEach(player => {
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

  // Recommended Squad (after transfers)
  const recommendedSquadGrouped = useMemo(() => {
    if (!recommendations || !data || !data.myPicks || !recommendations.suggestedTransfers) {
      return { GKP: [], DEF: [], MID: [], FWD: [] }
    }

    const upcomingFixtures = (data.fixtures || []).filter(f => !f.finished_provisional).slice(0, 50)
    const positionMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' }
    
    // Get IDs of players being sold
    const soldIds = new Set(recommendations.suggestedTransfers.map(t => t.out.id))
    
    // Get players being sold (marked for display)
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
          isBeingSold: true,
          isNew: false
        }
      })
    
    // Get remaining players (not being sold)
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
    
    // Add incoming players
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
        isNew: true
      }
    })
    
    // Combine all players
    const allPlayers = [...soldPlayers, ...remainingPlayers, ...incomingPlayers]
    
    // Group by position
    const grouped = { GKP: [], DEF: [], MID: [], FWD: [] }

    allPlayers.forEach(player => {
      const position = positionMap[player.element_type] || 'FWD'
      grouped[position].push(player)
    })

    // Sort each group: being sold first, then new, then remaining by form
    Object.keys(grouped).forEach(position => {
      grouped[position].sort((a, b) => {
        if (a.isBeingSold && !b.isBeingSold) return -1
        if (!a.isBeingSold && b.isBeingSold) return 1
        if (a.isNew && !b.isNew) return -1
        if (!a.isNew && b.isNew) return 1
        return b.form - a.form
      })
    })

    return grouped
  }, [recommendations, data])

  // Best Fixtures Data
  const bestFixturesData = useMemo(() => {
    if (!data || !data.allPlayers || !data.fixtures) return []

    const upcomingFixtures = data.fixtures.filter(f => !f.finished_provisional).slice(0, 50)
    
    return data.allPlayers
      .filter(p => p.minutes > 0)
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
      .filter(p => p.avgDifficulty <= 3.5)
      .sort((a, b) => a.avgDifficulty - b.avgDifficulty)
      .slice(0, 50)
  }, [data])

  // Captaincy Recommendation
  const captaincyRecommendation = useMemo(() => {
    if (!recommendations || !data) return null

    const soldIds = new Set(recommendations.suggestedTransfers.map(t => t.out.id))
    const currentSquad = data.myPicks.picks
      .map(p => data.allPlayers.find(pl => pl.id === p.element))
      .filter(p => p && !soldIds.has(p.id))

    const incomingPlayers = recommendations.suggestedTransfers.map(t => t.in)
    const finalSquad = [...currentSquad, ...incomingPlayers]

    const scoredSquad = finalSquad.map(p => {
      const fixtures = getPlayerFixtures(p.id, data.allPlayers, data.allTeams, data.fixtures)
      const nextFixture = fixtures[0]
      
      // Base score heavily weighted by total points (reflects overall quality)
      let captaincyScore = (p.total_points || 0) * 3
      
      // Form is important but shouldn't override quality
      captaincyScore += (parseFloat(p.form || 0) * 20)
      
      // Price indicates quality (premium players are premium for a reason)
      const price = (p.now_cost || 0) / 10
      captaincyScore += price * 15
      
      // Points per game (consistency metric)
      const ppg = p.total_points && p.minutes > 0 
        ? (p.total_points / (p.minutes / 90)) 
        : 0
      captaincyScore += ppg * 10
      
      // Fixture difficulty is a bonus/penalty, not a gatekeeper
      if (nextFixture) {
        if (nextFixture.difficulty === 1) captaincyScore += 40
        else if (nextFixture.difficulty === 2) captaincyScore += 25
        else if (nextFixture.difficulty === 3) captaincyScore += 5
        else if (nextFixture.difficulty === 4) captaincyScore -= 15
        else if (nextFixture.difficulty === 5) captaincyScore -= 30
        
        // Home advantage
        if (nextFixture.isHome) captaincyScore += 8
      }
      
      // Goals and assists (attacking threat)
      const goals = p.goals_scored || 0
      const assists = p.assists || 0
      captaincyScore += (goals * 8) + (assists * 5)
      
      // Selected by % (ownership can indicate differential opportunity, but shouldn't be primary)
      const selectedBy = parseFloat(p.selected_by_percent || 0)
      if (selectedBy >= 50) captaincyScore += 10 // Template captain
      
      return { 
        ...p, 
        captaincyScore,
        nextFixture,
        fixtureRating: nextFixture ? 
          (nextFixture.difficulty <= 2 ? 'Excellent' : 
           nextFixture.difficulty === 3 ? 'Good' : 
           nextFixture.difficulty === 4 ? 'Tough' : 'Very Tough') 
          : 'Unknown'
      }
    })

    // Sort ALL players by captaincy score (no artificial filtering)
    const sortedPlayers = scoredSquad.sort((a, b) => b.captaincyScore - a.captaincyScore)

    return {
      captain: sortedPlayers[0],
      vice: sortedPlayers[1] || sortedPlayers[0],
      allPlayersScored: sortedPlayers, // Include all players for captaincy analysis tab
      reasoning: sortedPlayers[0] ? 
        `${sortedPlayers[0].web_name} (${sortedPlayers[0].captaincyScore.toFixed(0)} score) is recommended for captain, ${sortedPlayers[1]?.web_name} (${sortedPlayers[1]?.captaincyScore.toFixed(0)} score) for vice-captain` 
        : 'No captain recommendation available'
    }
  }, [recommendations, data])

  return {
    mySquadDataGrouped,
    recommendedSquadGrouped,
    bestFixturesData,
    captaincyRecommendation
  }
}

