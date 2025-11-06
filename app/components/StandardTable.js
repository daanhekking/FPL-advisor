'use client'

import { Table } from 'antd'

/**
 * Standardized table component with consistent configuration
 * Used across all tables in the application
 */
export function StandardTable({ 
  columns, 
  dataSource, 
  pagination = { pageSize: 10 },
  scroll = { x: 1200 },
  ...props 
}) {
  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      pagination={pagination}
      scroll={scroll}
      showSorterTooltip={false}
      {...props}
    />
  )
}

