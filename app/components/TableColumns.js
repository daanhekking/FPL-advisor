'use client'

import { Tag, Tooltip } from 'antd'
import { PlayerInfo } from './PlayerInfo'
import { FixtureChips } from './FixtureChips'
import { getPositionName, formatPrice, formatPPG, calculateAvgPoints, getDifficultyColor } from '../utils/helpers'

/**
 * Standardized table column configurations
 * Optimized for mobile responsiveness
 */

export const createPlayerColumn = ({ showCaptaincy = false, showBench = false, showPosition = true, showForm = true }) => ({
  title: 'Player',
  dataIndex: 'web_name',
  key: 'player',
  fixed: 'left',
  width: 160,
  render: (text, record) => (
    <PlayerInfo
      name={text}
      team={record.team?.short_name}
      position={showPosition ? getPositionName(record.element_type) : null}
      form={record.form}
      isCaptain={showCaptaincy && record.pick?.is_captain}
      isViceCaptain={showCaptaincy && record.pick?.is_vice_captain}
      isBenched={showBench && record.isBenched}
      injuryStatus={record.chance_of_playing_next_round !== null && record.chance_of_playing_next_round < 75 ? record.chance_of_playing_next_round : null}
      showForm={showForm}
    />
  ),
})

export const createFixturesColumn = (maxShow = 5) => ({
  title: <Tooltip title="Upcoming fixtures with color-coded difficulty (green=easy, yellow=medium, red=hard). @ indicates away game.">Next {maxShow}</Tooltip>,
  dataIndex: 'fixtures',
  key: 'fixtures',
  width: 250,
  responsive: ['md'],
  render: (fixtures) => <FixtureChips fixtures={fixtures} maxShow={maxShow} />,
})

export const createAvgDifficultyColumn = () => ({
  title: <Tooltip title="Average difficulty of next 5 fixtures (1=easiest, 5=hardest). Click to sort.">Avg Diff</Tooltip>,
  dataIndex: 'avgDifficulty',
  key: 'avgDifficulty',
  width: 90,
  sorter: (a, b) => a.avgDifficulty - b.avgDifficulty,
  render: (val) => (
    <Tag color={getDifficultyColor(val)}>
      {val.toFixed(1)}
    </Tag>
  ),
})

export const createPriceColumn = () => ({
  title: <Tooltip title="Current player price in millions. Click to sort.">Price</Tooltip>,
  dataIndex: 'now_cost',
  key: 'price',
  width: 80,
  sorter: (a, b) => a.now_cost - b.now_cost,
  render: formatPrice,
})

export const createFormColumn = () => ({
  title: <Tooltip title="Player's form rating based on recent performances. Click to sort.">Form</Tooltip>,
  dataIndex: 'form',
  key: 'form',
  width: 70,
  sorter: (a, b) => parseFloat(a.form || 0) - parseFloat(b.form || 0),
})

export const createTotalPointsColumn = () => ({
  title: <Tooltip title="Total FPL points scored this season. Click to sort.">Total Pts</Tooltip>,
  dataIndex: 'total_points',
  key: 'total_points',
  width: 90,
  sorter: (a, b) => a.total_points - b.total_points,
  responsive: ['sm'],
})

export const createPPGColumn = () => ({
  title: <Tooltip title="Points Per Game - average points per match. Click to sort.">PPG</Tooltip>,
  dataIndex: 'points_per_game',
  key: 'ppg',
  width: 70,
  sorter: (a, b) => parseFloat(a.points_per_game || 0) - parseFloat(b.points_per_game || 0),
  render: formatPPG,
})

export const createAvgPointsColumn = () => ({
  title: <Tooltip title="Average points per 90 minutes played. Shows consistency and efficiency. Click to sort.">Avg Pts</Tooltip>,
  key: 'avgPoints',
  width: 85,
  responsive: ['lg'],
  sorter: (a, b) => {
    const aVal = a.minutes > 0 ? a.total_points / (a.minutes / 90) : 0
    const bVal = b.minutes > 0 ? b.total_points / (b.minutes / 90) : 0
    return aVal - bVal
  },
  render: (_, record) => calculateAvgPoints(record.total_points, record.minutes),
})

export const createPositionColumn = () => ({
  title: 'Pos',
  dataIndex: 'element_type',
  key: 'position',
  width: 70,
  render: (val) => <Tag>{getPositionName(val)}</Tag>,
  filters: [
    { text: 'GKP', value: 1 },
    { text: 'DEF', value: 2 },
    { text: 'MID', value: 3 },
    { text: 'FWD', value: 4 },
  ],
  onFilter: (value, record) => record.element_type === value,
})

// Pre-configured column sets for different table types
export const getTargetsTableColumns = () => [
  createPlayerColumn({ showPosition: true, showForm: false }),
  createFixturesColumn(5),
  createAvgDifficultyColumn(),
  createPriceColumn(),
  createFormColumn(),
  createTotalPointsColumn(),
  createPPGColumn(),
  createAvgPointsColumn(),
]

export const getWeakPlayersTableColumns = () => [
  createPlayerColumn({ showPosition: true, showForm: true }),
  createFixturesColumn(5),
  createFormColumn(),
  createPriceColumn(),
]

export const getSquadTableColumns = () => [
  createPlayerColumn({ showCaptaincy: true, showBench: true, showPosition: false }),
  createPositionColumn(),
  createFixturesColumn(5),
  createAvgDifficultyColumn(),
  createTotalPointsColumn(),
  createFormColumn(),
  createPriceColumn(),
]
