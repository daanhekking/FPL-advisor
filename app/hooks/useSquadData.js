'use client'

import { useMemo } from 'react'
import { getPlayerFixtures } from '../services/fpl-service'
import { getPlayerPerformanceData } from '../services/unified-fpl-algorithm'

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
    if (!recommendations || !data || !data.myPicks) {
      return { GKP: [], DEF: [], MID: [], FWD: [] }
    }

    const upcomingFixtures = (data.fixtures || []).filter(f => !f.finished_provisional).slice(0, 50)
    const positionMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' }

    // Create a lookup for performance scores from the unified algorithm
    const performanceScoreMap = {}

    // Get scores from starting 11 (these have finalScore, rank, penaltyApplied)
    if (recommendations.starting11) {
      recommendations.starting11.forEach(player => {
        performanceScoreMap[player.id] = {
          finalScore: player.finalScore,
          baseScore: player.baseScore,
          rank: player.rank,
          penaltyApplied: player.penaltyApplied,
          isBenched: false
        }
      })
    }

    // Get scores from bench (these also have finalScore, rank, penaltyApplied)
    if (recommendations.bench) {
      recommendations.bench.forEach(player => {
        performanceScoreMap[player.id] = {
          finalScore: player.finalScore,
          baseScore: player.baseScore,
          rank: player.rank,
          penaltyApplied: player.penaltyApplied,
          isBenched: true
        }
      })
    }

    // Get IDs of players being sold
    const soldIds = new Set((recommendations.suggestedTransfers || []).map(t => t.out.id))

    // Build the full squad (sold players + remaining players + incoming players)
    const allPlayers = []

    // Add all current players (both sold and remaining)
    data.myPicks.picks.forEach(pick => {
      const player = data.allPlayers.find(pl => pl.id === pick.element)
      if (!player) return

      const scoreData = performanceScoreMap[player.id] || {}
      const isBeingSold = soldIds.has(player.id)

      // Calculate fixtures and average difficulty
      const fixtures = getPlayerFixtures(player.id, data.allPlayers, data.allTeams, upcomingFixtures).slice(0, 5)
      const avgDifficulty = fixtures.length > 0
        ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
        : 3

      allPlayers.push({
        ...player,
        pick,
        team: data.allTeams.find(t => t.id === player.team),
        fixtures,
        avgDifficulty,
        form: parseFloat(player.form || 0),
        totalPoints: player.total_points || 0,
        isBeingSold,
        isNew: false,
        isBenched: scoreData.isBenched || false,
        // Add performance data from unified algorithm
        finalScore: scoreData.finalScore || 0,
        baseScore: scoreData.baseScore || 0,
        rank: scoreData.rank,
        penaltyApplied: scoreData.penaltyApplied,
        performanceScore: scoreData.finalScore || 0 // For backwards compatibility
      })
    })

    // Add incoming players (from transfers)
    if (recommendations.suggestedTransfers) {
      recommendations.suggestedTransfers.forEach(t => {
        const player = t.in
        const scoreData = performanceScoreMap[player.id] || {}

        // Calculate fixtures and average difficulty
        const fixtures = getPlayerFixtures(player.id, data.allPlayers, data.allTeams, upcomingFixtures).slice(0, 5)
        const avgDifficulty = fixtures.length > 0
          ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
          : 3

        allPlayers.push({
          ...player,
          team: data.allTeams.find(t => t.id === player.team),
          fixtures,
          avgDifficulty,
          form: parseFloat(player.form || 0),
          totalPoints: player.total_points || 0,
          isBeingSold: false,
          isNew: true,
          isBenched: scoreData.isBenched || false,
          // Add performance data from unified algorithm
          finalScore: scoreData.finalScore || 0,
          baseScore: scoreData.baseScore || 0,
          rank: scoreData.rank,
          penaltyApplied: scoreData.penaltyApplied,
          performanceScore: scoreData.finalScore || 0
        })
      })
    }

    // Group by position
    const grouped = { GKP: [], DEF: [], MID: [], FWD: [] }

    allPlayers.forEach(player => {
      const position = positionMap[player.element_type] || 'FWD'
      grouped[position].push(player)
    })

    // Sort each group: starting 11 first (by rank), then bench players
    Object.keys(grouped).forEach(position => {
      grouped[position].sort((a, b) => {
        // Starters before bench
        if (!a.isBenched && b.isBenched) return -1
        if (a.isBenched && !b.isBenched) return 1

        // Within starters or bench, sort by rank (or finalScore if no rank)
        if (a.rank && b.rank) return a.rank - b.rank
        return (b.finalScore || 0) - (a.finalScore || 0)
      })
    })

    return grouped
  }, [recommendations, data])

  // Best Fixtures Data - grouped by team with top players
  const bestFixturesData = useMemo(() => {
    if (!data || !data.allPlayers || !data.fixtures) return []

    const upcomingFixtures = data.fixtures.filter(f => !f.finished_provisional).slice(0, 50)

    // Get all players with their fixtures and AI performance score
    const playersWithFixtures = data.allPlayers
      .filter(p => p.minutes > 0) // Only players who have played
      .map(player => {
        const team = data.allTeams.find(t => t.id === player.team)
        const fixtures = getPlayerFixtures(player.id, data.allPlayers, data.allTeams, upcomingFixtures).slice(0, 5)

        // Calculate AI Performance Score for Best Fixtures
        const performanceData = getPlayerPerformanceData(player, fixtures)

        const avgDifficulty = fixtures.length > 0
          ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
          : 5

        return {
          ...player,
          ...performanceData, // This adds finalScore, baseScore, etc.
          team,
          fixtures,
          avgDifficulty,
          form: parseFloat(player.form || 0),
          totalPoints: player.total_points || 0,
          position: player.element_type === 1 ? 'GKP' :
            player.element_type === 2 ? 'DEF' :
              player.element_type === 3 ? 'MID' : 'FWD'
        }
      })
      .filter(p => p.avgDifficulty <= 3.5) // Only good fixtures

    // Return all players sorted by team's average difficulty
    return playersWithFixtures
      .sort((a, b) => {
        // Sort by avg difficulty first, then by the AI performance score
        const diffDiff = a.avgDifficulty - b.avgDifficulty
        if (Math.abs(diffDiff) > 0.1) return diffDiff
        return (b.finalScore || 0) - (a.finalScore || 0)
      })
  }, [data])

  // Captaincy Recommendation (now comes from unified algorithm via recommendations)
  const captaincyRecommendation = useMemo(() => {
    if (!recommendations || !data) return null

    // The unified algorithm already calculated captain/vice in recommendations
    if (recommendations.captain && recommendations.vice) {
      // Add fixture rating for display
      const captain = recommendations.captain
      const vice = recommendations.vice

      const captainFixtureRating = captain.nextFixture ?
        (captain.difficulty <= 2 ? 'Excellent' :
          captain.difficulty === 3 ? 'Good' :
            captain.difficulty === 4 ? 'Tough' : 'Very Tough')
        : 'Unknown'

      const viceFixtureRating = vice.nextFixture ?
        (vice.difficulty <= 2 ? 'Excellent' :
          vice.difficulty === 3 ? 'Good' :
            vice.difficulty === 4 ? 'Tough' : 'Very Tough')
        : 'Unknown'

      return {
        captain: {
          ...captain,
          fixtureRating: captainFixtureRating,
          captaincyScore: captain.finalScore // For backwards compatibility
        },
        vice: {
          ...vice,
          fixtureRating: viceFixtureRating,
          captaincyScore: vice.finalScore
        },
        allPlayersScored: recommendations.allPlayersScored || [],
        reasoning: recommendations.captaincyReasoning ||
          `${captain.web_name} (${captain.finalScore?.toFixed(0)} score) is recommended for captain`
      }
    }

    // Fallback: if for some reason captaincy data isn't in recommendations, return null
    return null
  }, [recommendations, data])

  return {
    mySquadDataGrouped,
    recommendedSquadGrouped,
    bestFixturesData,
    captaincyRecommendation
  }
}

