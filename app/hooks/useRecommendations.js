'use client'

import { useState, useEffect } from 'react'
import { generateRecommendations } from '../services/algorithm-service'

/**
 * Custom hook to generate transfer recommendations
 * Runs asynchronously to avoid blocking the UI
 * 
 * @param {Object} data - FPL data containing picks, players, teams, fixtures
 * @param {number} randomSeed - Seed for randomizing transfer suggestions
 * @param {number} fixturesToShow - Number of fixtures to consider
 * @param {Object} last3PointsData - Last 3 gameweeks points data
 * @returns {Object} { recommendations, loading }
 */
export const useRecommendations = (data, randomSeed = 0, fixturesToShow = 5, last3PointsData = {}, userInputTransfers = null) => {
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!data || !data.myPicks) {
      setRecommendations(null)
      return
    }

    setLoading(true)

    // Defer computation to next tick to avoid blocking UI
    const timeoutId = setTimeout(() => {
      try {
        const recs = generateRecommendations(
          data.myPicks,
          data.allPlayers,
          data.allTeams,
          data.fixtures,
          randomSeed,
          fixturesToShow,
          last3PointsData,
          userInputTransfers
        )
        setRecommendations(recs)
        setLoading(false)
      } catch (err) {
        console.error('Error generating recommendations:', err)
        setRecommendations(null)
        setLoading(false)
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [data, randomSeed, fixturesToShow, last3PointsData, userInputTransfers])

  return {
    recommendations,
    loading
  }
}

