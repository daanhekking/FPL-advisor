'use client'

import React from 'react'
import {
  Layout, Card, Typography, Divider, Space, Row, Col, Tag, List, Alert
} from 'antd'
import {
  CheckCircleOutlined, TrophyOutlined, SwapOutlined,
  TeamOutlined, SettingOutlined, InfoCircleOutlined,
  ApiOutlined, DatabaseOutlined, CloudOutlined, ExperimentOutlined
} from '@ant-design/icons'
import Link from 'next/link'

const { Content } = Layout
const { Title, Paragraph, Text } = Typography

export default function AlgorithmSetupPage() {
  return (
    <Layout className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Content className="p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" style={{ color: '#1890ff' }}>
            ← Back to Dashboard
          </Link>
          <Title level={2} className="!mt-4 flex items-center gap-2">
            <SettingOutlined className="text-blue-500" /> Algorithm Setup & Data Sources
          </Title>
          <Text type="secondary">
            Understanding how the AI Coach analyzes data and makes transfer recommendations
          </Text>
        </div>

        {/* Data Sources Section */}
        <Card className="mb-6">
          <Title level={3}>
            <DatabaseOutlined /> Data Sources & APIs
          </Title>
          <Paragraph>
            The AI Coach integrates multiple data sources to provide comprehensive analysis and recommendations. Here's an overview of where the data comes from:
          </Paragraph>

          <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '16px' }}>
            {/* FPL Official API */}
            <Card size="small" style={{ borderLeft: '4px solid #1890ff' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ApiOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                  <Text strong style={{ fontSize: '16px' }}>Official FPL API</Text>
                  <Tag color="green">Active</Tag>
                </div>
                <Paragraph style={{ marginBottom: '8px' }}>
                  <Text strong>Source:</Text> <code>fantasy.premierleague.com/api/</code>
                </Paragraph>
                <Paragraph style={{ marginBottom: '8px' }}>
                  <Text strong>Data Retrieved:</Text>
                </Paragraph>
                <List size="small" style={{ marginLeft: '16px' }}>
                  <List.Item>✓ <strong>Bootstrap Data:</strong> All 700+ players with stats (form, points, price, positions)</List.Item>
                  <List.Item>✓ <strong>Team Data:</strong> All 20 Premier League teams with strength ratings</List.Item>
                  <List.Item>✓ <strong>Fixtures:</strong> Complete fixture list with difficulty ratings (1-5)</List.Item>
                  <List.Item>✓ <strong>Your Squad:</strong> Current team, formation, and bench</List.Item>
                  <List.Item>✓ <strong>Squad Picks:</strong> Starting XI and substitutes for current gameweek</List.Item>
                  <List.Item>✓ <strong>History:</strong> Your gameweek performance and season statistics</List.Item>
                  <List.Item>✓ <strong>Player History:</strong> Individual player performance over last 3 gameweeks</List.Item>
                </List>
                <Paragraph style={{ marginTop: '8px' }}>
                  <Text type="secondary"><strong>Update Frequency:</strong> Real-time (no caching) - always fetches latest data</Text>
                </Paragraph>
              </Space>
            </Card>

            {/* Future Data Sources - Minimized */}
            <Alert
              message="Future Data Sources (Not Currently Active)"
              description={
                <Space direction="vertical" size="small" style={{ width: '100%', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ExperimentOutlined style={{ fontSize: '16px', color: '#faad14' }} />
                    <Text strong>FPL Scout Picks</Text>
                    <Tag color="orange" size="small">Planned</Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: '13px', paddingLeft: '24px' }}>
                    Will integrate expert selections from The Scout for additional player recommendations.
                  </Text>
                  
                  <Divider style={{ margin: '8px 0' }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CloudOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                    <Text strong>Sentiment Analysis</Text>
                    <Tag color="orange" size="small">Planned</Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: '13px', paddingLeft: '24px' }}>
                    Will analyze social media and FPL community trends for player sentiment and transfer buzz.
                  </Text>
                </Space>
              }
              type="default"
              showIcon={false}
              style={{ opacity: 0.7 }}
            />
          </Space>

          <Alert
            className="mt-4"
            message="Data Privacy & Security"
            description="Your FPL team ID is stored locally in your browser. No personal data is sent to external servers. All API calls are made directly to official FPL endpoints through secure proxy routes."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        </Card>

        {/* Step-by-Step Logic */}
        <Card className="mb-6">
          <Title level={3}>
            <CheckCircleOutlined /> Step-by-Step Decision Process
          </Title>
          
          <List
            itemLayout="horizontal"
            dataSource={[
              {
                step: 1,
                title: 'Analyze Current Squad',
                description: 'Reviews all 15 players in your squad, including form, fixtures, injuries, and playing time.',
                color: '#1890ff'
              },
              {
                step: 2,
                title: 'Select Optimal Starting 11',
                description: 'Determines the best possible starting 11 from your current squad based on hybrid scoring (form, fixtures, sentiment). Respects FPL formation rules. Applies fixture penalties: top 10 players immune to moderate fixtures (3), top 20 immune to hard fixtures (4-5).',
                color: '#52c41a'
              },
              {
                step: 3,
                title: 'Identify Weak Starting Players',
                description: 'Finds players in your STARTING 11 who are underperforming, injured, or have difficult fixtures. Bench players are NOT considered for transfers.',
                color: '#faad14'
              },
              {
                step: 4,
                title: 'Find Potential Targets',
                description: 'Searches for players not in your team who have good form, easy fixtures, and positive sentiment. Filters by position and affordability.',
                color: '#722ed1'
              },
              {
                step: 5,
                title: 'Evaluate Transfers',
                description: 'For each potential transfer, checks if the new player would actually start and if the transfer improves the starting 11 score.',
                color: '#13c2c2'
              },
              {
                step: 6,
                title: 'Make Intelligent Decision',
                description: 'Decides how many transfers to make based on available free transfers and the quality of upgrades available. May use fewer than available FTs if upgrades aren\'t worthwhile.',
                color: '#eb2f96'
              },
              {
                step: 7,
                title: 'Recommend Captain & Vice-Captain',
                description: 'Selects captain and vice-captain using specialized scoring that prioritizes high total points, current form, and easy fixtures (1-3 difficulty). Elite players with favorable matchups are strongly preferred.',
                color: '#f5222d'
              }
            ]}
            renderItem={(item) => (
              <List.Item style={{ borderLeft: `4px solid ${item.color}`, paddingLeft: '16px', marginBottom: '16px' }}>
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      {item.step}
                    </div>
                  }
                  title={<Text strong style={{ fontSize: '16px' }}>{item.title}</Text>}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </Card>

        {/* FPL Formation Rules */}
        <Card className="mb-6">
          <Title level={3}>
            <TeamOutlined /> FPL Formation Rules
          </Title>
          <Paragraph>
            The algorithm strictly adheres to Fantasy Premier League formation rules:
          </Paragraph>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card size="small" title="Starting 11 Requirements">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text>• <strong>Exactly 1</strong> Goalkeeper</Text>
                  <Text>• <strong>3-5</strong> Defenders</Text>
                  <Text>• <strong>2-5</strong> Midfielders</Text>
                  <Text>• <strong>1-3</strong> Forwards</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Text strong>Total: 11 players</Text>
                </Space>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card size="small" title="Squad Composition">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text>• <strong>2</strong> Goalkeepers (1 starts, 1 bench)</Text>
                  <Text>• <strong>5</strong> Defenders</Text>
                  <Text>• <strong>5</strong> Midfielders</Text>
                  <Text>• <strong>3</strong> Forwards</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Text strong>Total: 15 players</Text>
                </Space>
              </Card>
            </Col>
          </Row>

          <Alert
            className="mt-4"
            message="Valid Formations"
            description={
              <Space wrap>
                <Tag color="blue">3-4-3</Tag>
                <Tag color="blue">3-5-2</Tag>
                <Tag color="blue">4-3-3</Tag>
                <Tag color="blue">4-4-2</Tag>
                <Tag color="blue">4-5-1</Tag>
                <Tag color="blue">5-3-2</Tag>
                <Tag color="blue">5-4-1</Tag>
                <Tag color="blue">5-2-3</Tag>
              </Space>
            }
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        </Card>

        {/* Transfer Decision Logic */}
        <Card className="mb-6">
          <Title level={3}>
            <SwapOutlined /> Transfer Decision Logic
          </Title>
          
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong style={{ fontSize: '16px' }}>When to Make Transfers:</Text>
              <List size="small" style={{ marginTop: '8px' }}>
                <List.Item>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                  <strong>2 Free Transfers Available:</strong> Will use 1-2 transfers depending on upgrade quality
                </List.Item>
                <List.Item>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                  <strong>1 Free Transfer Available:</strong> Will use it if a good upgrade is found
                </List.Item>
                <List.Item>
                  <CheckCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                  <strong>0 Free Transfers:</strong> Will only take a hit (-4 points) if multiple starters are injured
                </List.Item>
              </List>
            </div>

          <div>
              <Text strong style={{ fontSize: '16px' }}>Transfer Criteria:</Text>
              <List size="small" style={{ marginTop: '8px' }}>
                <List.Item>
                  <strong>Starting 11 Only:</strong> Only considers replacing players who are in your starting 11. Bench players are not transferred out.
                </List.Item>
                <List.Item>
                  <strong>New Player Must Start:</strong> The incoming player must be good enough to make your starting 11, otherwise the transfer is not made.
                </List.Item>
                <List.Item>
                  <strong>Score Improvement:</strong> The transfer must improve your starting 11's overall score, unless replacing an injured starter.
                </List.Item>
                <List.Item>
                  <strong>Budget Constraint:</strong> The new player must be affordable with your available budget plus the sale price of the outgoing player.
                </List.Item>
                <List.Item>
                  <strong>Fixture Difficulty Rule:</strong> Players with moderate fixtures (3) receive a 30% penalty unless they're in the top 10. Players with hard fixtures (4-5) receive a 60% penalty unless they're in the top 20. Elite players (Salah, Haaland, etc.) perform regardless of opposition.
                </List.Item>
              </List>
            </div>

            <Alert
              message="Important: Bench Players"
              description="The algorithm will NEVER suggest transferring out a bench player. Transfers are only made to improve your starting 11. If you have a weak bench player, they will stay on the bench."
              type="warning"
              showIcon
            />
          </Space>
        </Card>

        {/* Captaincy Recommendations */}
        <Card className="mb-6">
          <Title level={3}>
            <TrophyOutlined /> Captaincy Recommendations
          </Title>
          <Paragraph>
            Choosing the right captain can double your highest-scoring player's points. The algorithm uses a specialized scoring system for captaincy that differs from general team selection.
          </Paragraph>
          
          <Alert
            message="Fixture Requirement for Captain"
            description="Captains MUST have a fixture difficulty of 2 or better (Very Easy or Easy). Players with moderate or difficult fixtures (3, 4, or 5) will NOT be considered for captaincy, regardless of their form or total points."
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '16px' }}>
            <Alert
              message="Captaincy Formula"
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '15px' }}>Captain Score = Total Points × 2 + Form × 15 + Fixture Bonus + PPG × 5</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text strong style={{ color: '#ff4d4f' }}>✓ First Filter: Only players with fixture difficulty ≤ 2 are eligible</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text><strong>Then Rank By:</strong></Text>
                  <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
                    <li>Season performance (total points) - heavily weighted</li>
                    <li>Current form (last 5 games)</li>
                    <li>Next gameweek fixture bonus (1 or 2 only)</li>
                    <li>Points per 90 minutes consistency</li>
                    <li>Home advantage</li>
                  </ul>
                </Space>
              }
              type="success"
              showIcon
            />

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Captain Eligibility & Bonuses" style={{ borderLeft: '3px solid #1890ff' }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ color: '#52c41a' }}>✓ ELIGIBLE FOR CAPTAIN:</Text>
                    <Text><Tag color="green">Difficulty 1</Tag> <strong>+50 points</strong> - Very Easy</Text>
                    <Text><Tag color="blue">Difficulty 2</Tag> <strong>+35 points</strong> - Easy</Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Text strong style={{ color: '#ff4d4f' }}>✗ NOT ELIGIBLE FOR CAPTAIN:</Text>
                    <Text><Tag color="default">Difficulty 3</Tag> Moderate - Filtered Out</Text>
                    <Text><Tag color="orange">Difficulty 4</Tag> Difficult - Filtered Out</Text>
                    <Text><Tag color="red">Difficulty 5</Tag> Very Difficult - Filtered Out</Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Text><Tag color="purple">Home Game</Tag> <strong>+10 points</strong> bonus</Text>
                  </Space>
                </Card>
              </Col>
              
              <Col xs={24} md={12}>
                <Card size="small" title="Why This Works" style={{ borderLeft: '3px solid #52c41a' }}>
                  <Space direction="vertical" size="small">
                    <Text>✓ <strong>Only easy fixtures considered</strong> - guarantees favorable matchup</Text>
                    <Text>✓ <strong>Reliable performers</strong> get rewarded (high total points)</Text>
                    <Text>✓ <strong>No risky captains</strong> - moderate/hard fixtures excluded</Text>
                    <Text>✓ <strong>Home advantage</strong> adds extra value</Text>
                    <Text>✓ Vice-captain from same pool or best available player</Text>
                  </Space>
                </Card>
              </Col>
            </Row>

            <Alert
              message="Example Scenarios"
              description={
                <div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong style={{ color: '#52c41a' }}>✓ Eligible Captain:</Text>
                      <Text strong style={{ display: 'block', marginTop: '4px' }}>Salah</Text>
                      <ul style={{ marginTop: '8px', marginBottom: '0' }}>
                        <li>Total Points: 180 → 360 score</li>
                        <li>Form: 6.0 → +90 score</li>
                        <li>Fixture: vs Ipswich <Tag color="blue">Diff 2</Tag> → +35</li>
                        <li>Home game → +10</li>
                        <li><strong>Total: ~495 ✓ SELECTED</strong></li>
                      </ul>
                    </Col>
                    <Col span={12}>
                      <Text strong style={{ color: '#ff4d4f' }}>✗ Not Eligible:</Text>
                      <Text strong style={{ display: 'block', marginTop: '4px' }}>Haaland</Text>
                      <ul style={{ marginTop: '8px', marginBottom: '0' }}>
                        <li>Total Points: 200 → 400 score</li>
                        <li>Form: 8.0 → +120 score</li>
                        <li>Fixture: vs Liverpool <Tag color="orange">Diff 4</Tag></li>
                        <li>Away game → +0</li>
                        <li><strong>EXCLUDED - Fixture too hard!</strong></li>
                      </ul>
                    </Col>
                  </Row>
                  <Text strong style={{ display: 'block', marginTop: '12px', color: '#52c41a' }}>
                    Result: Salah becomes captain despite Haaland having better form, because Haaland's fixture is too difficult (4)!
                  </Text>
                </div>
              }
              type="info"
              showIcon
            />

            <div>
              <Text strong style={{ fontSize: '14px' }}>Pro Tip:</Text>
              <Paragraph style={{ marginTop: '8px', marginBottom: '0' }}>
                The algorithm <strong>only considers players with easy fixtures (1-2 difficulty)</strong> for captaincy. This means even elite players like Haaland or Salah won't be selected as captain if they face a tough opponent that week. The system prioritizes <strong>safe, high-probability returns</strong> over risky captaincy choices. If no player has an easy fixture (rare), it will fall back to the best player regardless of fixture.
              </Paragraph>
            </div>
          </Space>
        </Card>

        {/* Fixture Difficulty Strategy */}
        <Card className="mb-6">
          <Title level={3}>
            <InfoCircleOutlined /> Fixture Difficulty Strategy
          </Title>
          <Paragraph>
            The algorithm intelligently handles fixture difficulty when selecting your starting 11:
          </Paragraph>
          
          <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '16px' }}>
          <Alert
            message="Fixture Difficulty Rules"
            description={
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>
                  <strong>Moderate Fixtures (3):</strong> 30% score penalty for players outside the top 10.
                </Text>
                <Text>
                  <strong>Hard Fixtures (4-5):</strong> 60% score penalty for players outside the top 20.
                </Text>
                <Divider style={{ margin: '8px 0' }} />
                <Text strong style={{ color: '#52c41a' }}>
                  ✓ Top 10 players: Immune to all fixture penalties (1-5)
                </Text>
                <Text strong style={{ color: '#1890ff' }}>
                  ✓ Top 11-20 players: Immune to hard fixture penalties (4-5), but 30% penalty for moderate (3)
                </Text>
              </Space>
            }
            type="info"
            showIcon
          />

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Why This Matters" style={{ borderLeft: '3px solid #faad14' }}>
                  <Space direction="vertical" size="small">
                    <Text>• Mid-tier players facing moderate opponents (3) have uncertain returns</Text>
                    <Text>• Defenders facing top teams (4-5) are unlikely to keep clean sheets</Text>
                    <Text>• Better to bench them and use players with easier fixtures</Text>
                  </Space>
                </Card>
              </Col>
              
              <Col xs={24} md={12}>
                <Card size="small" title="Elite Players Tiers" style={{ borderLeft: '3px solid #52c41a' }}>
                  <Space direction="vertical" size="small">
                    <Text><strong>Top 10:</strong> Always considered, even for moderate fixtures (e.g., Salah vs Chelsea)</Text>
                    <Text><strong>Top 11-20:</strong> Considered for hard fixtures but penalized for moderate ones</Text>
                    <Text><strong>Others:</strong> Penalized for both moderate and hard fixtures</Text>
                  </Space>
                </Card>
              </Col>
            </Row>

            <div>
              <Text strong style={{ fontSize: '14px' }}>Fixture Difficulty Scale:</Text>
              <Space wrap style={{ marginTop: '8px' }}>
                <Tag color="green">1 - Very Easy</Tag>
                <Tag color="blue">2 - Easy</Tag>
                <Tag color="default">3 - Moderate</Tag>
                <Tag color="orange">4 - Difficult</Tag>
                <Tag color="red">5 - Very Difficult</Tag>
              </Space>
            </div>

            <Alert
              message="Example Scenarios"
              description={
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>Scenario 1: Moderate Fixture (Difficulty 3)</Text>
                  <ul style={{ marginTop: '8px', marginBottom: '12px', paddingLeft: '20px' }}>
                    <li><strong>Top 10 player (e.g., Salah):</strong> Full score, will likely start</li>
                    <li><strong>Top 11-20 player:</strong> 30% penalty, might be benched</li>
                    <li><strong>Regular player:</strong> 30% penalty, likely benched</li>
                  </ul>
                  
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>Scenario 2: Hard Fixture (Difficulty 5)</Text>
                  <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
                    <li><strong>Top 20 player (e.g., Haaland):</strong> Full score, will start</li>
                    <li><strong>Regular player:</strong> 60% penalty, will be benched</li>
                  </ul>
                </div>
              }
              type="warning"
              showIcon
            />
          </Space>
        </Card>

        {/* Scoring System */}
        <Card className="mb-6">
          <Title level={3}>Hybrid Scoring System</Title>
          <Paragraph>
            Each player is scored using a hybrid algorithm that combines multiple factors with carefully weighted components:
          </Paragraph>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card size="small" title="Form & Stats (40%)" style={{ borderLeft: '3px solid #1890ff' }}>
                <Space direction="vertical" size="small">
                  <Text>• Current form (last 5 games)</Text>
                  <Text>• Points per game average</Text>
                  <Text>• Recent performance trends</Text>
                  <Text>• Consistency metrics</Text>
                </Space>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card size="small" title="Fixtures (55%)" style={{ borderLeft: '3px solid #52c41a' }}>
                <Space direction="vertical" size="small">
                  <Text>• Next 5 fixtures difficulty</Text>
                  <Text>• Opponent strength ratings</Text>
                  <Text>• Home vs Away balance</Text>
                  <Text><strong>Largest weight</strong> - fixtures matter most!</Text>
                </Space>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card size="small" title="Availability (5%)" style={{ borderLeft: '3px solid #faad14' }}>
                <Space direction="vertical" size="small">
                  <Text>• <strong>100% fit:</strong> Small bonus</Text>
                  <Text>• <strong>75-99%:</strong> Full consideration</Text>
                  <Text>• <strong>50-74%:</strong> 50% penalty</Text>
                  <Text>• <strong>&lt;50%:</strong> Excluded from selection</Text>
                </Space>
              </Card>
            </Col>
          </Row>

          <Alert
            className="mt-4"
            message="Why Fixtures Are Prioritized"
            description="Fixtures are weighted at 55% because match difficulty is the strongest predictor of points. A top player against a weak team has much higher expected returns than the same player against a top-6 side. Form and stats (40%) matter, but favorable fixtures are the key to maximizing points."
            type="success"
            showIcon
          />
        </Card>

        {/* Example Scenario */}
        <Card className="mb-6">
          <Title level={4}>Example Scenario</Title>
          <Paragraph>
            <Text strong>Situation:</Text> You have 2 free transfers available.
          </Paragraph>
          
          <Space direction="vertical" size="small" style={{ width: '100%', marginTop: '16px' }}>
            <Text>1. Algorithm selects your optimal starting 11 from current squad</Text>
            <Text>2. Identifies that your starting midfielder has form of 1.5 (poor)</Text>
            <Text>3. Your backup goalkeeper on bench has form of 2.0 (also poor) - <strong>IGNORED</strong> because not starting</Text>
            <Text>4. Finds an affordable midfielder with form of 6.5 and easy fixtures</Text>
            <Text>5. Verifies the new midfielder would make your starting 11 - <strong>YES</strong></Text>
            <Text>6. Transfer is recommended: Poor midfielder OUT → Good midfielder IN</Text>
            <Text>7. Evaluates if a second transfer is worthwhile - if not, saves the 2nd FT</Text>
          </Space>
        </Card>

      </Content>
    </Layout>
  )
}
