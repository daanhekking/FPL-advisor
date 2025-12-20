'use client'

import React, { useMemo } from 'react'
import { Spin, Card, Typography, Row, Col, Statistic, Tooltip, Tag } from 'antd'
import { SquadSection } from './SquadSection'
import { getDifficultyColor } from '../utils/helpers'
import {
  createPlayerColumn,
  createPositionColumn,
  createPriceColumn,
  createGameweekColumn,
  createAvgDifficultyColumn,
  createFormColumn,
  createPPGColumn,
  createTotalPointsColumn
} from './TableColumns'

const { Text, Title } = Typography

/**
 * CurrentSquadTab Component
 * Displays the user's current squad grouped by position in a structured card layout
 * Features detailed 5-gameweek fixture columns and a difficulty summary
 * 
 * @param {Object} mySquadDataGrouped - Squad data grouped by position
 * @param {boolean} loading - Loading state
 */
export const CurrentSquadTab = ({ mySquadDataGrouped, loading }) => {

  // 1. helper to get all players in a flat list
  const allPlayers = useMemo(() => {
    return [
      ...mySquadDataGrouped.GKP,
      ...mySquadDataGrouped.DEF,
      ...mySquadDataGrouped.MID,
      ...mySquadDataGrouped.FWD
    ]
  }, [mySquadDataGrouped])

  // 2. Identify the next 5 Gameweeks
  const nextGameweeks = useMemo(() => {
    if (allPlayers.length === 0) return []
    // Find a player with fixtures to extract GW numbers
    const playerWithFixtures = allPlayers.find(p => p.fixtures && p.fixtures.length > 0)
    if (!playerWithFixtures) return []

    return playerWithFixtures.fixtures.slice(0, 5).map(f => f.event)
  }, [allPlayers])

  // 3. Create Custom Columns
  const customColumns = useMemo(() => {
    if (nextGameweeks.length === 0) return []

    const gwColumns = nextGameweeks.map((gw, index) => createGameweekColumn(gw, index))

    return [
      createPlayerColumn({ showPosition: false, showForm: false }),
      createPositionColumn(),
      createPriceColumn(),
      ...gwColumns, // Insert the 5 separate GW columns here
      createAvgDifficultyColumn(),
      createFormColumn(),
      createPPGColumn(),
      createTotalPointsColumn()
    ]
  }, [nextGameweeks])

  // 4. Calculate Average Difficulty per Gameweek
  const gwDifficultySummary = useMemo(() => {
    if (nextGameweeks.length === 0 || allPlayers.length === 0) return {}

    const summary = {}

    // Initialize summary for each GW
    nextGameweeks.forEach((gw, index) => {
      summary[gw] = { totalDiff: 0, count: 0 }
    })

    // Sum up difficulty for each player for each GW
    allPlayers.forEach(player => {
      const fixtures = player.fixtures?.slice(0, 5) || []
      fixtures.forEach((fixture, index) => {
        const gw = nextGameweeks[index] // Match by index to ensure alignment with columns
        if (gw && fixture) {
          summary[gw].totalDiff += fixture.difficulty
          summary[gw].count += 1
        }
      })
    })

    // Calculate averages
    return nextGameweeks.map(gw => ({
      gameweek: gw,
      avgDiff: summary[gw].count > 0 ? summary[gw].totalDiff / summary[gw].count : 0
    }))
  }, [allPlayers, nextGameweeks])


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Spin spinning={loading}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Goalkeepers */}
          <SquadSection
            title="Goalkeepers"
            players={mySquadDataGrouped.GKP}
            columns={customColumns}
          />

          {/* Defenders */}
          <SquadSection
            title="Defenders"
            players={mySquadDataGrouped.DEF}
            columns={customColumns}
          />

          {/* Midfielders */}
          <SquadSection
            title="Midfielders"
            players={mySquadDataGrouped.MID}
            columns={customColumns}
          />

          {/* Forwards */}
          <SquadSection
            title="Forwards"
            players={mySquadDataGrouped.FWD}
            columns={customColumns}
          />

          {/* Gameweek Difficulty Summary Footer */}
          {nextGameweeks.length > 0 && (
            <Card className="shadow-sm">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ width: 310, paddingRight: 16 }}>
                  <Title level={5} style={{ margin: 0 }}>Average Difficulty per Gameweek</Title>
                  <Text type="secondary">Lower is better. Plan your transfers around high-difficulty weeks.</Text>
                </div>

                {/* Align stats with the GW columns roughly */}
                <div style={{ display: 'flex', gap: 0 }}>
                  {gwDifficultySummary.map((item, index) => (
                    <div key={item.gameweek} style={{ width: 70, textAlign: 'center' }}>
                      <Statistic
                        title={<Text type="secondary" style={{ fontSize: 12 }}>GW {item.gameweek}</Text>}
                        value={item.avgDiff}
                        precision={1}
                        valueStyle={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: getDifficultyColor(item.avgDiff) === 'success' ? '#389e0d' :
                            getDifficultyColor(item.avgDiff) === 'warning' ? '#d46b08' :
                              getDifficultyColor(item.avgDiff) === 'error' ? '#cf1322' : 'inherit'
                        }}
                      />
                      <Tag color={getDifficultyColor(item.avgDiff)} style={{ marginTop: 4 }}>
                        {item.avgDiff <= 2.5 ? 'Easy' : item.avgDiff >= 4 ? 'Hard' : 'Mixed'}
                      </Tag>
                    </div>
                  ))}
                </div>

                {/* Spacer to balance the flex if needed or for extra stats */}
                <div style={{ flex: 1 }}></div>
              </div>
            </Card>
          )}
        </div>
      </Spin>
    </div>
  )
}

