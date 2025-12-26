'use client'

import { Table } from '../design-system'

/**
 * Standardized table component with consistent configuration
 * Optimized for mobile with responsive pagination and scroll
 */
export function StandardTable({
  columns,
  dataSource,
  pagination = {
    pageSize: 10,
    showSizeChanger: false,
    responsive: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`
  },
  scroll = { x: 800 },
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
      size="small"
      {...props}
    />
  )
}
