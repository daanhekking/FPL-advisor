'use client'

import React from 'react'
import { Spin, Typography } from 'antd'
import { StandardTable } from './StandardTable'
import { getSquadTableColumns } from './TableColumns'

const { Title } = Typography

/**
 * CurrentSquadTab Component
 * Displays the user's current squad grouped by position
 * 
 * @param {Object} mySquadDataGrouped - Squad data grouped by position
 * @param {boolean} loading - Loading state
 */
export const CurrentSquadTab = ({ mySquadDataGrouped, loading }) => {
  return (
    <div>
      <Spin spinning={loading}>
        {/* Goalkeepers */}
        {mySquadDataGrouped.GKP.length > 0 && (
          <div className="mb-6">
            <Title level={5} className="mb-3">
              Goalkeepers ({mySquadDataGrouped.GKP.length})
            </Title>
            <StandardTable
              dataSource={mySquadDataGrouped.GKP}
              columns={getSquadTableColumns()}
              rowKey="id"
              pagination={false}
            />
          </div>
        )}

        {/* Defenders */}
        {mySquadDataGrouped.DEF.length > 0 && (
          <div className="mb-6">
            <Title level={5} className="mb-3">
              Defenders ({mySquadDataGrouped.DEF.length})
            </Title>
            <StandardTable
              dataSource={mySquadDataGrouped.DEF}
              columns={getSquadTableColumns()}
              rowKey="id"
              pagination={false}
            />
          </div>
        )}

        {/* Midfielders */}
        {mySquadDataGrouped.MID.length > 0 && (
          <div className="mb-6">
            <Title level={5} className="mb-3">
              Midfielders ({mySquadDataGrouped.MID.length})
            </Title>
            <StandardTable
              dataSource={mySquadDataGrouped.MID}
              columns={getSquadTableColumns()}
              rowKey="id"
              pagination={false}
            />
          </div>
        )}

        {/* Forwards */}
        {mySquadDataGrouped.FWD.length > 0 && (
          <div className="mb-6">
            <Title level={5} className="mb-3">
              Forwards ({mySquadDataGrouped.FWD.length})
            </Title>
            <StandardTable
              dataSource={mySquadDataGrouped.FWD}
              columns={getSquadTableColumns()}
              rowKey="id"
              pagination={false}
            />
          </div>
        )}
      </Spin>
    </div>
  )
}

