'use client'

import { Card, Row, Col, Space, Badge, Typography, Alert } from 'antd'
import { ArrowRightOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { FixtureChips } from './FixtureChips'
import { formatPrice } from '../utils/helpers'

const { Text } = Typography

/**
 * Standardized component for displaying transfer suggestions
 * Shows player OUT -> player IN with fixtures
 * Responsive: horizontal on desktop, vertical on mobile
 */
export function TransferCard({ transfer, allTeams }) {
  return (
    <Card size="small" type="inner">
      {transfer.notRecommended && (
        <Alert
          message="⚠️ Not in 'Consider Selling' - This player might be worth keeping"
          type="warning"
          showIcon={false}
          style={{ marginBottom: 12, fontSize: 12 }}
          closable
        />
      )}
      
      {/* Desktop Layout */}
      <Row gutter={16} align="middle" className="transfer-desktop">
        {/* Player OUT */}
        <Col span={10}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Badge count="OUT" style={{ backgroundColor: '#ff4d4f' }} />
            <Text strong style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>
              {transfer.out.web_name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {allTeams.find(t => t.id === transfer.out.team)?.short_name} • Form {transfer.out.form}
            </Text>
            <FixtureChips fixtures={transfer.out.fixtures} maxShow={5} showTooltip={true} />
            <Text strong>{formatPrice(transfer.out.now_cost)}</Text>
          </Space>
        </Col>

        {/* Arrow */}
        <Col span={4} style={{ textAlign: 'center' }}>
          <ArrowRightOutlined style={{ fontSize: 24 }} />
        </Col>

        {/* Player IN */}
        <Col span={10}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Badge count="IN" style={{ backgroundColor: '#52c41a' }} />
            <Text strong style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>
              {transfer.in.web_name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {transfer.in.team.short_name} • Form {transfer.in.form}
            </Text>
            <FixtureChips fixtures={transfer.in.fixtures} maxShow={5} showTooltip={true} />
            <Text strong>{formatPrice(transfer.in.now_cost)}</Text>
            {transfer.priceDiff !== 0 && (
              <Text type={transfer.priceDiff > 0 ? 'danger' : 'success'} style={{ fontSize: 12 }}>
                {transfer.priceDiff > 0 ? '+' : ''}{transfer.priceDiff.toFixed(1)}m
              </Text>
            )}
          </Space>
        </Col>
      </Row>

      {/* Mobile Layout */}
      <div className="transfer-mobile">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Player OUT */}
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Badge count="OUT" style={{ backgroundColor: '#ff4d4f' }} />
            <Text strong style={{ fontSize: 16 }}>{transfer.out.web_name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {allTeams.find(t => t.id === transfer.out.team)?.short_name} • Form {transfer.out.form}
            </Text>
            <FixtureChips fixtures={transfer.out.fixtures} maxShow={5} showTooltip={true} />
            <Text strong>{formatPrice(transfer.out.now_cost)}</Text>
          </Space>

          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <ArrowDownOutlined style={{ fontSize: 20 }} />
          </div>

          {/* Player IN */}
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Badge count="IN" style={{ backgroundColor: '#52c41a' }} />
            <Text strong style={{ fontSize: 16 }}>{transfer.in.web_name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {transfer.in.team.short_name} • Form {transfer.in.form}
            </Text>
            <FixtureChips fixtures={transfer.in.fixtures} maxShow={5} showTooltip={true} />
            <Space>
              <Text strong>{formatPrice(transfer.in.now_cost)}</Text>
              {transfer.priceDiff !== 0 && (
                <Text type={transfer.priceDiff > 0 ? 'danger' : 'success'} style={{ fontSize: 12 }}>
                  ({transfer.priceDiff > 0 ? '+' : ''}{transfer.priceDiff.toFixed(1)}m)
                </Text>
              )}
            </Space>
          </Space>
        </Space>
      </div>

      <style jsx>{`
        .transfer-desktop {
          display: flex;
        }
        .transfer-mobile {
          display: none;
        }
        @media (max-width: 768px) {
          .transfer-desktop {
            display: none;
          }
          .transfer-mobile {
            display: block;
          }
        }
      `}</style>
    </Card>
  )
}
