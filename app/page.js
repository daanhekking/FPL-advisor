'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Layout, Tabs, Card, Button, Typography, 
  Space, Statistic, Row, Col, Dropdown, Spin, Alert, Tag, Modal 
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
  getSquadTableColumns,
  getBestFixturesTableColumns 
} from './components/TableColumns'

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
const generateRecommendations = (picks, players, teams, fixtures, numTransfers, seed = 0, fixtureWindow = 5) => {
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
      const fixtures = getPlayerFixtures(p.id, players, teams, upcomingFixtures).slice(0, fixtureWindow)
      const avgDifficulty = fixtures.length > 0
        ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
        : 3
      return { ...p, fixtures, team, avgDifficulty }
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
      const fixtures = getPlayerFixtures(p.id, players, teams, upcomingFixtures).slice(0, fixtureWindow)
      
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
  const [myHistory, setMyHistory] = useState(null)
  const [chipPlanModal, setChipPlanModal] = useState({ open: false, title: '', squad: [] })
  const [fixturesToShow, setFixturesToShow] = useState(5)

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
        
        const [bootstrapRes, teamRes, picksRes, fixturesRes, historyRes] = await Promise.all([
          fetch('/api/fpl/bootstrap'),
          fetch(`/api/fpl/team/${teamId}`),
          fetch(`/api/fpl/team/${teamId}/picks?gameweek=current`),
          fetch('/api/fpl/fixtures'),
          fetch(`/api/fpl/team/${teamId}/history`)
        ])
        
        if (!bootstrapRes.ok || !teamRes.ok || !picksRes.ok || !fixturesRes.ok || !historyRes.ok) {
          throw new Error('Failed to fetch data from API')
        }
        
        const [bootstrap, team, picks, fixturesData, history] = await Promise.all([
          bootstrapRes.json(),
          teamRes.json(),
          picksRes.json(),
          fixturesRes.json(),
          historyRes.json()
        ])
        
        setAllPlayers(bootstrap.elements)
        setAllTeams(bootstrap.teams)
        setMyTeam(team)
        setMyPicks(picks)
        setFixtures(fixturesData)
        setMyHistory(history)
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
    return generateRecommendations(
      myPicks,
      allPlayers,
      allTeams,
      fixtures,
      transfersToUse,
      randomSeed,
      fixturesToShow
    )
  }, [myPicks, allPlayers, allTeams, fixtures, transfersToUse, randomSeed, fixturesToShow])

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

  // Get overall points from FPL API (manager's total points for the season)
  const overallPoints = myTeam?.summary_overall_points || 0

  const captainColumns = useMemo(() => {
    const base = getTargetsTableColumns()
    return [
      ...base,
      {
        title: 'Captain Score',
        dataIndex: 'captainScore',
        key: 'captainScore',
        width: 120,
        sorter: (a, b) => (a.captainScore || 0) - (b.captainScore || 0),
        render: (val) => (val !== undefined ? val.toFixed(1) : '—')
      },
    ]
  }, [])

  const captaincyOptions = useMemo(() => {
    if (!recommendations || myPlayerData.length === 0) {
      return { my: [], external: [] }
    }

    const scorePlayer = (player) => {
      const form = parseFloat(player.form || 0)
      const ppg = parseFloat(player.points_per_game || 0)
      const avgDifficulty = player.avgDifficulty !== undefined ? player.avgDifficulty : (
        player.fixtures && player.fixtures.length > 0
          ? player.fixtures.reduce((sum, f) => sum + f.difficulty, 0) / player.fixtures.length
          : 3
      )
      const totalPoints = player.total_points || 0
      return form * 8 + ppg * 5 + (5 - avgDifficulty) * 4 + totalPoints / 10
    }

    const myOptions = myPlayerData
      .filter(p => p.pick?.multiplier > 0)
      .map(p => {
        const avgDifficulty = p.avgDifficulty !== undefined ? p.avgDifficulty : (
          p.fixtures && p.fixtures.length > 0
            ? p.fixtures.reduce((sum, f) => sum + f.difficulty, 0) / p.fixtures.length
            : 3
        )
        return {
          ...p,
          avgDifficulty,
          captainScore: scorePlayer({ ...p, avgDifficulty })
        }
      })
      .sort((a, b) => b.captainScore - a.captainScore)
      .slice(0, 3)

    const myIds = new Set(myPlayerData.map(p => p.id))
    const externalOptions = recommendations.transferTargets
      .filter(p => !myIds.has(p.id))
      .map(p => ({
        ...p,
        captainScore: scorePlayer(p)
      }))
      .sort((a, b) => b.captainScore - a.captainScore)
      .slice(0, 5)

    return {
      my: myOptions,
      external: externalOptions
    }
  }, [recommendations, myPlayerData])

  const positionLabels = useMemo(() => ({
    1: 'Goalkeepers',
    2: 'Defenders',
    3: 'Midfielders',
    4: 'Forwards',
  }), [])

  const groupedSquad = useMemo(() => {
    if (myPlayerData.length === 0) return []

    return Object.entries(positionLabels)
      .map(([posId, label]) => {
        const players = myPlayerData
          .filter(player => player.element_type === Number(posId))
          .slice()
          .sort((a, b) => {
            if (a.isBenched !== b.isBenched) {
              return a.isBenched ? 1 : -1
            }
            const posA = a.pick?.position || 99
            const posB = b.pick?.position || 99
            return posA - posB
          })

        return {
          id: Number(posId),
          label,
          players,
        }
      })
      .filter(group => group.players.length > 0)
  }, [myPlayerData, positionLabels])

  const chipSuggestions = useMemo(() => {
    if (!myHistory || !recommendations) return []

    const currentEvent = myPicks?.entry_history?.event || 0
    const wildcardMax = currentEvent >= 20 ? 2 : 1

    const CHIP_DEFS = [
      { id: 'wildcard', label: 'Wildcard', max: wildcardMax },
      { id: 'freehit', label: 'Free Hit', max: 1 },
      { id: 'benchboost', label: 'Bench Boost', max: 1 },
      { id: 'triplecaptain', label: 'Triple Captain', max: 1 },
    ]

    const usedChips = myHistory?.chips || []
    const usageCount = usedChips.reduce((acc, chip) => {
      acc[chip.name] = (acc[chip.name] || 0) + 1
      return acc
    }, {})

    const benchPlayers = myPlayerData.filter(p => p.isBenched)
    const benchPpg = benchPlayers.length
      ? benchPlayers.reduce((sum, p) => sum + parseFloat(p.points_per_game || 0), 0) / benchPlayers.length
      : 0
    const benchAvgDiff = benchPlayers.length
      ? benchPlayers.reduce((sum, p) => sum + (p.avgDifficulty || 3), 0) / benchPlayers.length
      : 3

    const weakCount = recommendations.weakPlayers.length
    const topCaptain = captaincyOptions.my[0]

    const suggestions = []

    CHIP_DEFS.forEach(chip => {
      const used = usageCount[chip.id] || 0
      const remaining = chip.max - used
      if (remaining <= 0) return

      let recommendation = 'Hold for now'
      let plan = 'Monitor upcoming fixtures and double gameweeks before deploying.'

      switch (chip.id) {
        case 'wildcard': {
          if (weakCount >= 5) {
            recommendation = 'Consider using soon'
            plan = 'Several weak spots detected. Restructure squad to target in-form options with strong fixture runs.'
          } else {
            plan = 'Team core looks stable. Save wildcard for major fixture swings or blank gameweeks.'
          }
          break
        }
        case 'benchboost': {
          if (benchPlayers.length >= 4 && benchPpg >= 3.5 && benchAvgDiff <= 2.7) {
            recommendation = 'Good window approaching'
            plan = 'Bench has playable options with friendly fixtures. Plan to align with a double gameweek if possible.'
          } else {
            plan = 'Strengthen bench first—look for four starters with favourable fixtures before activating.'
          }
          break
        }
        case 'triplecaptain': {
          if (topCaptain && topCaptain.captainScore >= 60 && topCaptain.avgDifficulty <= 2.5) {
            recommendation = 'Candidate identified'
            plan = `Consider using on ${topCaptain.web_name} while form and fixtures align. Ideally pair with a double gameweek.`
          } else {
            plan = 'Wait for a premium attacker with a double gameweek and elite form before deploying.'
          }
          break
        }
        case 'freehit': {
          if (weakCount >= 6) {
            recommendation = 'Potential use soon'
            plan = 'Upcoming gameweek may be difficult to navigate. Monitor blanks/doubles; deploy when your squad lacks coverage.'
          } else {
            plan = 'Reserve for blank or double gameweeks when coverage is limited.'
          }
          break
        }
        default:
          break
      }

      const label = chip.max > 1
        ? `${chip.label} (${remaining} left)`
        : chip.label

      suggestions.push({
        id: `${chip.id}-${remaining}`,
        chipId: chip.id,
        chip: label,
        status: `${remaining} available`,
        recommendation,
        plan,
        showAction: chip.id === 'wildcard' || chip.id === 'freehit',
      })
    })

    return suggestions
  }, [myHistory, recommendations, myPlayerData, captaincyOptions, myPicks])

  const buildChipSquad = useCallback((chipId) => {
    if (!recommendations) return []

    const desiredCounts = { 1: 2, 2: 5, 3: 5, 4: 3 }

    const getScore = (player) => {
      const form = parseFloat(player.form || 0)
      const ppg = parseFloat(player.points_per_game || 0)
      const avgDifficulty = player.avgDifficulty !== undefined
        ? player.avgDifficulty
        : (player.fixtures && player.fixtures.length > 0
          ? player.fixtures.reduce((sum, f) => sum + f.difficulty, 0) / player.fixtures.length
          : 3)
      const totalPoints = player.total_points || 0
      return form * 8 + ppg * 5 + (5 - avgDifficulty) * 4 + totalPoints / 10
    }

    const poolMap = new Map()
    recommendations.transferTargets.forEach(player => {
      if (player) poolMap.set(player.id, { ...player })
    })
    myPlayerData.forEach(player => {
      if (player && !poolMap.has(player.id)) {
        poolMap.set(player.id, { ...player })
      }
    })

    const available = Array.from(poolMap.values())
    const byPosition = { 1: [], 2: [], 3: [], 4: [] }
    available.forEach(player => {
      if (byPosition[player.element_type]) {
        byPosition[player.element_type].push(player)
      }
    })
    Object.values(byPosition).forEach(list => {
      list.sort((a, b) => getScore(b) - getScore(a))
    })

    const selected = []
    const selectedByPos = { 1: [], 2: [], 3: [], 4: [] }

    Object.entries(desiredCounts).forEach(([pos, count]) => {
      const list = byPosition[pos] || []
      for (let i = 0; i < count && i < list.length; i++) {
        const player = { ...list[i] }
        selected.push(player)
        selectedByPos[pos].push(player)
      }
    })

    if (selected.length < 15) {
      const remaining = available
        .filter(p => !selected.some(sel => sel.id === p.id))
        .sort((a, b) => getScore(b) - getScore(a))

      for (let i = 0; i < remaining.length && selected.length < 15; i++) {
        const player = { ...remaining[i] }
        selected.push(player)
        const pos = player.element_type
        if (!selectedByPos[pos]) selectedByPos[pos] = []
        selectedByPos[pos].push(player)
      }
    }

    const applyRoles = (list, starters) => {
      list.forEach((player, idx) => {
        const isStarter = idx < starters
        player.role = isStarter ? 'Starter' : 'Bench'
        player.isBenched = !isStarter
      })
    }

    applyRoles(selectedByPos[1] || [], 1)
    applyRoles(selectedByPos[2] || [], 3)
    applyRoles(selectedByPos[3] || [], 4)
    applyRoles(selectedByPos[4] || [], 3)

    const starters = selected.filter(player => !player.isBenched)
    const bench = selected.filter(player => player.isBenched)

    return [...starters, ...bench]
  }, [recommendations, myPlayerData])

  const handleShowChipPlan = useCallback((chipId, chipLabel) => {
    const squad = buildChipSquad(chipId)
    setChipPlanModal({
      open: true,
      title: `${chipLabel} - Suggested Squad`,
      squad,
    })
  }, [buildChipSquad])

  const handleCloseChipPlan = useCallback(() => {
    setChipPlanModal(prev => ({ ...prev, open: false }))
  }, [])

  const chipColumns = useMemo(() => [
    {
      title: 'Chip',
      dataIndex: 'chip',
      key: 'chip',
      width: 160,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
    },
    {
      title: 'Recommendation',
      dataIndex: 'recommendation',
      key: 'recommendation',
      width: 260,
    },
    {
      title: 'Suggested Plan',
      dataIndex: 'plan',
      key: 'plan',
      width: 320,
    },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      render: (_, record) =>
        record.showAction ? (
          <Button size="small" onClick={() => handleShowChipPlan(record.chipId, record.chip)}>
            Show anyway
          </Button>
        ) : null,
    },
  ], [handleShowChipPlan])

  const chipPlanColumns = useMemo(() => {
    const baseColumns = getSquadTableColumns()
    return [
      {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        width: 120,
      },
      ...baseColumns,
    ]
  }, [])

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
        .slice(0, fixturesToShow)
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
        .map(p => ({
          ...p,
          fixtures: teamFixtures
        }))
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
  }, [allPlayers, allTeams, fixtures, fixturesToShow])

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
  if (!myTeam || !myPicks || !recommendations || !myHistory) {
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
                  title="Overall Points" 
                  value={overallPoints} 
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
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {groupedSquad.map(group => (
                  <Card key={group.id} title={group.label}>
                    <StandardTable
                      columns={getSquadTableColumns()}
                      dataSource={group.players}
                      pagination={false}
                      scroll={{ x: 900 }}
                    />
                  </Card>
                ))}
              </Space>
            </Tabs.TabPane>

            <Tabs.TabPane tab="📅 Best Fixtures" key="3">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card
                  title="Fixture Window"
                  extra={
                    <Space>
                      <Text>Fixtures:</Text>
                      <Button onClick={() => setFixturesToShow(prev => Math.max(1, prev - 1))}>-</Button>
                      <Text strong>{fixturesToShow}</Text>
                      <Button onClick={() => setFixturesToShow(prev => Math.min(10, prev + 1))}>+</Button>
                    </Space>
                  }
                />
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
                      <Space size={4} wrap>
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
                    <StandardTable
                      columns={getBestFixturesTableColumns()}
                      dataSource={team.players}
                      pagination={false}
                      scroll={{ x: 600 }}
                    />
                  </Card>
                ))}
              </Space>
            </Tabs.TabPane>

            <Tabs.TabPane tab="🧢 Captaincy" key="4">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card title="Top Captain Picks from Your Squad">
                  <StandardTable
                    columns={captainColumns}
                    dataSource={captaincyOptions.my}
                    pagination={false}
                    scroll={{ x: 900 }}
                  />
                </Card>
                <Card title="Top Differential Captain Picks (Not in Your Squad)">
                  <StandardTable
                    columns={captainColumns}
                    dataSource={captaincyOptions.external}
                    pagination={false}
                    scroll={{ x: 900 }}
                  />
                </Card>
              </Space>
            </Tabs.TabPane>

            <Tabs.TabPane tab="🎯 Chip Strategy" key="5">
              <Card title="Chip Usage Recommendations">
                <StandardTable
                  columns={chipColumns}
                  dataSource={chipSuggestions}
                  pagination={false}
                  rowKey="id"
                  locale={{
                    emptyText: 'All chips have been used.'
                  }}
                />
              </Card>
            </Tabs.TabPane>
          </Tabs>
        </Space>
      </Content>
      <Modal
        title={chipPlanModal.title}
        open={chipPlanModal.open}
        onCancel={handleCloseChipPlan}
        footer={null}
        width={960}
      >
        <StandardTable
          columns={chipPlanColumns}
          dataSource={chipPlanModal.squad}
          pagination={false}
          scroll={{ x: 900 }}
        />
      </Modal>
    </Layout>
  )
}
