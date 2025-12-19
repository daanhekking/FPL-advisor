'use client'

import { useState, useEffect } from 'react'
import { fetchFPLData, calculateLast3GameweeksPoints } from '../services/fpl-service'
import { generateChipStrategy } from '../services/chip-service'

/**
 * Custom hook to fetch and manage FPL team data
 * Handles data fetching, loading states, errors, and background data enrichment
 * 
 * @param {string} teamId - FPL team ID to fetch data for
 * @returns {Object} { data, loading, error, refetch }
 */
export const useTeamData = (teamId) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chipStrategy, setChipStrategy] = useState([])
  const [last3PointsData, setLast3PointsData] = useState({})

  const loadData = async (signal) => {
    if (!teamId) return

    try {
      setLoading(true)
      setError(null)
      // Reset previous team's data immediately to prevent stale data display
      setData(null)
      setChipStrategy([])
      setLast3PointsData({})

      // Fetch FPL data with timeout
      const dataFetchPromise = fetchFPLData(teamId)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Data fetch timeout')), 90000)
      )

      let fplData
      try {
        fplData = await Promise.race([dataFetchPromise, timeoutPromise])
      } catch (err) {
        if (err.message === 'Data fetch timeout') {
          setError('Loading is taking longer than expected. Some data may be unavailable.')
          setLoading(false)
          return
        }
        throw err
      }

      // Check if this fetch was cancelled (user switched teams)
      if (signal?.aborted) return

      setData(fplData)
      setLoading(false)

      // Background tasks (non-blocking)

      // Generate chip strategy
      try {
        const strategy = generateChipStrategy(fplData.myHistory, fplData.myTeam, fplData.fixtures)
        if (!signal?.aborted) setChipStrategy(strategy)
      } catch (err) {
        console.warn('Error generating chip strategy:', err)
      }

      // Fetch last 3 gameweeks points for relevant players
      const myPlayerIds = fplData.myPicks?.picks?.map(p => p.element) || []
      const topTargetIds = (fplData.allPlayers || [])
        .filter(p => !myPlayerIds.includes(p.id) && parseFloat(p.form || 0) > 3.0)
        .sort((a, b) => parseFloat(b.form || 0) - parseFloat(a.form || 0))
        .slice(0, 5)
        .map(p => p.id)

      const allRelevantIds = [...myPlayerIds, ...topTargetIds]

      calculateLast3GameweeksPoints(allRelevantIds)
        .then((points) => {
          if (!signal?.aborted) setLast3PointsData(points)
        })
        .catch(err => {
          console.warn('Failed to fetch last 3 gameweeks points:', err)
          if (!signal?.aborted) setLast3PointsData({})
        })

    } catch (err) {
      console.error('Error loading data:', err)
      if (!signal?.aborted) {
        setError(`Failed to load team data: ${err.message || 'Unknown error'}`)
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const abortController = new AbortController()

    loadData(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [teamId])

  const refetch = () => {
    loadData()
  }

  return {
    data,
    loading,
    error,
    chipStrategy,
    last3PointsData,
    refetch
  }
}

