'use client'

import React from 'react'
import {
  Layout, Typography, Divider, Space, Row, Col, Tag, List, Alert,
  PageHeader, Section, Badge,
  CheckCircleFilled, TrophyOutlined, SwapOutlined,
  TeamOutlined, SettingOutlined, InfoCircleFilled,
  ApiOutlined, DatabaseOutlined, CloudOutlined, ExperimentOutlined
} from '../design-system'
import Link from 'next/link'

const { Content } = Layout
const { Paragraph, Text } = Typography

export default function AlgorithmSetupPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content className="p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <PageHeader
          title="Algorithm Setup & Data Sources"
          description="Understanding how the AI Coach analyzes data and makes transfer recommendations"
          icon={<SettingOutlined style={{ color: '#1890ff' }} />}
          actions={[
            <Link key="back" href="/" passHref>
              <Text style={{ color: '#1890ff', cursor: 'pointer' }}>
                ← Back to Dashboard
              </Text>
            </Link>
          ]}
        />

        {/* Data Sources Section */}
        <Section
          title="Data Sources & APIs"
          icon={<DatabaseOutlined />}
          description="The AI Coach integrates multiple data sources to provide comprehensive analysis and recommendations."
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* FPL Official API */}
            <Section
              size="small"
              style={{ borderLeft: '4px solid #1890ff', marginBottom: 0 }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ApiOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                  <Text strong style={{ fontSize: '16px' }}>Official FPL API</Text>
                  <Tag color="green">Active</Tag>
                </div>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
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
            </Section>

            {/* Future Data Sources - Minimized */}
            <Alert
              message="Future Data Sources (Not Currently Active)"
              description={
                <Space direction="vertical" size="small" style={{ width: '100%', marginTop: '8px' }}>
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
              type="info"
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
            icon={<InfoCircleFilled />}
          />
        </Section>

        {/* Step-by-Step Logic */}
        <Section
          title="Step-by-Step Decision Process"
          icon={<CheckCircleFilled style={{ color: '#52c41a' }} />}
        >
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
                title: 'Calculate Performance Scores',
                description: 'Scores all 15 players using the unified formula: Total Points (×3), Form (×20), Price (×15), PPG (×10), Goals (×8), Assists (×5), Fixture Bonus/Penalty, Home (+8), Ownership (+10). Players are ranked 1-15, then fixture penalties applied: Top 10 immune to all fixtures, Rank 11-20 immune to hard fixtures, Rank 21+ penalized for moderate (-30%) and hard (-60%) fixtures.',
                color: '#52c41a'
              },
              {
                step: 3,
                title: 'Select Optimal Starting 11',
                description: 'Groups players by position and tries all 8 valid formations (3-4-3, 3-5-2, 4-3-3, 4-4-2, 4-5-1, 5-3-2, 5-4-1, 5-2-3). Selects the formation with the highest combined final score. Remaining 4 players become the bench.',
                color: '#722ed1'
              },
              {
                step: 4,
                title: 'Select Captain & Vice-Captain',
                description: 'Captain = highest final score in starting 11. Vice-captain = 2nd highest. This guarantees your best players both START and CAPTAIN - perfect consistency!',
                color: '#13c2c2'
              },
              {
                step: 5,
                title: 'Identify Weak Starting Players',
                description: 'Finds players in your STARTING 11 who are underperforming, injured, or have difficult fixtures. Bench players are NOT considered for transfers.',
                color: '#faad14'
              },
              {
                step: 6,
                title: 'Find Potential Transfer Targets',
                description: 'Searches for players not in your team who have good form, high scores, and availability (≥75% chance of playing). Filters by position and affordability (within budget + £15m).',
                color: '#eb2f96'
              },
              {
                step: 7,
                title: 'Evaluate Each Transfer',
                description: 'For each potential transfer: (1) Creates hypothetical squad with the change, (2) Recalculates starting 11, (3) Checks if new player starts, (4) Compares formation scores. Only recommends transfers that improve the starting 11.',
                color: '#f5222d'
              },
              {
                step: 8,
                title: 'Make Transfer Decision',
                description: 'Decides how many transfers to make: 2 FTs → use 1-2 if upgrades exist, 1 FT → use if clear upgrade exists, 0 FTs → only take hit if ≥2 starters injured. May use fewer than available FTs if upgrades aren\'t worthwhile.',
                color: '#1890ff'
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
        </Section>

        {/* FPL Formation Rules */}
        <Section title="FPL Formation Rules" icon={<TeamOutlined />}>
          <Paragraph>
            The algorithm strictly adheres to Fantasy Premier League formation rules:
          </Paragraph>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Section size="small" title="Starting 11 Requirements" style={{ height: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text>• <strong>Exactly 1</strong> Goalkeeper</Text>
                  <Text>• <strong>3-5</strong> Defenders</Text>
                  <Text>• <strong>2-5</strong> Midfielders</Text>
                  <Text>• <strong>1-3</strong> Forwards</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Text strong>Total: 11 players</Text>
                </Space>
              </Section>
            </Col>

            <Col xs={24} md={12}>
              <Section size="small" title="Squad Composition" style={{ height: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text>• <strong>2</strong> Goalkeepers (1 starts, 1 bench)</Text>
                  <Text>• <strong>5</strong> Defenders</Text>
                  <Text>• <strong>5</strong> Midfielders</Text>
                  <Text>• <strong>3</strong> Forwards</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Text strong>Total: 15 players</Text>
                </Space>
              </Section>
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
            icon={<InfoCircleFilled />}
          />
        </Section>

        {/* Transfer Decision Logic */}
        <Section title="Transfer Decision Logic" icon={<SwapOutlined />}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong style={{ fontSize: '16px' }}>When to Make Transfers:</Text>
              <List size="small" style={{ marginTop: '8px' }}>
                <List.Item>
                  <Badge status="success" style={{ marginRight: '8px' }} />
                  <strong>2 Free Transfers Available:</strong> Will use 1-2 transfers depending on upgrade quality
                </List.Item>
                <List.Item>
                  <Badge status="success" style={{ marginRight: '8px' }} />
                  <strong>1 Free Transfer Available:</strong> Will use it if a good upgrade is found
                </List.Item>
                <List.Item>
                  <Badge status="warning" style={{ marginRight: '8px' }} />
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
                  <strong>Score Improvement:</strong> The transfer must improve your starting 11&apos;s overall score, unless replacing an injured starter.
                </List.Item>
                <List.Item>
                  <strong>Budget Constraint:</strong> The new player must be affordable with your available budget plus the sale price of the outgoing player.
                </List.Item>
                <List.Item>
                  <strong>Rank-Based Fixture Penalties:</strong> After scoring, players are ranked 1-15. Top 10 have NO penalties (elite tier). Ranks 11-20 are immune to hard fixtures (4-5) but penalized -30% for moderate (3). Ranks 21+ penalized -30% for moderate, -60% for hard. This ensures premium players aren&apos;t unfairly benched.
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
        </Section>

        {/* Unified Performance Scoring & Captaincy */}
        <Section title="Unified Performance Scoring" icon={<TrophyOutlined />}>
          <Paragraph>
            The app uses a single, consistent performance scoring algorithm for both selecting the starting 11 AND choosing the captain. This ensures your best players both start and captain.
          </Paragraph>

          <Alert
            message="Performance Score Formula - Used For Starting 11 & Captain Selection"
            description={
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong style={{ fontSize: '15px' }}>
                  Performance Score = (Total Points × 3) + (Form × 20) + (Price × 15) + (PPG × 10) + (Goals × 8) + (Assists × 5) + Fixture Bonus + Home Bonus + Ownership Bonus
                </Text>
                <Divider style={{ margin: '12px 0' }} />
                <Text><strong>Scoring Components:</strong></Text>
                <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
                  <li><strong>Total Points (×3)</strong> - Season-long quality and reliability</li>
                  <li><strong>Form (×20)</strong> - Recent performance (last 5 gameweeks)</li>
                  <li><strong>Price (×15)</strong> - Reflects manager assessment of quality</li>
                  <li><strong>Points Per Game (×10)</strong> - Consistency when playing</li>
                  <li><strong>Goals (×8) & Assists (×5)</strong> - Direct attacking output</li>
                  <li><strong>Fixture Difficulty</strong> - Bonus for easy, penalty for tough</li>
                  <li><strong>Home Advantage (+8)</strong> - Playing at home</li>
                  <li><strong>Ownership (50%+)</strong> - Template player bonus (+10)</li>
                </ul>
              </Space>
            }
            type="success"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Section size="small" title="Fixture Impact" style={{ borderLeft: '3px solid #1890ff', height: '100%' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>Fixture Bonuses & Penalties:</Text>
                  <Text><Tag color="green">Difficulty 1</Tag> <strong>+40 points</strong> - Very Easy</Text>
                  <Text><Tag color="blue">Difficulty 2</Tag> <strong>+25 points</strong> - Easy</Text>
                  <Text><Tag color="default">Difficulty 3</Tag> <strong>+5 points</strong> - Moderate</Text>
                  <Text><Tag color="orange">Difficulty 4</Tag> <strong>-15 points</strong> - Tough</Text>
                  <Text><Tag color="red">Difficulty 5</Tag> <strong>-30 points</strong> - Very Tough</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    Note: Fixtures are a BONUS, not a gatekeeper. Premium players with tough fixtures can still be captain if their overall score is highest.
                  </Text>
                </Space>
              </Section>
            </Col>

            <Col xs={24} md={12}>
              <Section size="small" title="Why This Unified Approach" style={{ borderLeft: '3px solid #52c41a', height: '100%' }}>
                <Space direction="vertical" size="small">
                  <Text>✓ <strong>Consistency</strong> - Same logic everywhere in the app</Text>
                  <Text>✓ <strong>Quality First</strong> - Premium players properly valued</Text>
                  <Text>✓ <strong>Balanced</strong> - Form, fixtures, and output all matter</Text>
                  <Text>✓ <strong>Transparent</strong> - See exactly why players rank as they do</Text>
                  <Text>✓ <strong>Predictable</strong> - Highest score = Captain = Starts</Text>
                </Space>
              </Section>
            </Col>
          </Row>

          <Alert
            className="mt-4"
            message="Example: Haaland vs Mateta"
            description={
              <div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong style={{ color: '#52c41a' }}>Haaland (Diff 3 Fixture):</Text>
                    <ul style={{ marginTop: '8px', marginBottom: '0' }}>
                      <li>Total Points: 150 → 450 score</li>
                      <li>Form: 7.5 → +150 score</li>
                      <li>Price: £15.0m → +225 score</li>
                      <li>PPG: 6.5 → +65 score</li>
                      <li>Goals: 15 → +120 score</li>
                      <li>Fixture: Diff 3 → +5 bonus</li>
                      <li><strong>Total: ~1,025 ✓ CAPTAIN</strong></li>
                    </ul>
                  </Col>
                  <Col span={12}>
                    <Text strong>Mateta (Diff 2 Fixture):</Text>
                    <ul style={{ marginTop: '8px', marginBottom: '0' }}>
                      <li>Total Points: 65 → 195 score</li>
                      <li>Form: 5.2 → +104 score</li>
                      <li>Price: £6.0m → +90 score</li>
                      <li>PPG: 4.1 → +41 score</li>
                      <li>Goals: 8 → +64 score</li>
                      <li>Fixture: Diff 2 → +25 bonus</li>
                      <li><strong>Total: ~524 - Vice/Bench</strong></li>
                    </ul>
                  </Col>
                </Row>
                <Text strong style={{ display: 'block', marginTop: '12px', color: '#52c41a' }}>
                  Result: Haaland is captain because his quality (1,025) far exceeds Mateta (524), even with a slightly harder fixture!
                </Text>
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: '16px' }}
          />

          <div style={{ marginTop: '16px' }}>
            <Text strong style={{ fontSize: '14px' }}>How Starting 11 & Captain Are Selected:</Text>
            <Paragraph style={{ marginTop: '8px', marginBottom: '0' }}>
              1. Every player gets a <strong>base score</strong> using the formula above<br />
              2. Players are <strong>ranked 1-15</strong> by base score<br />
              3. <strong>Fixture penalties</strong> applied based on rank and fixture difficulty<br />
              4. Players grouped by position, sorted by <strong>final score</strong><br />
              5. <strong>Starting 11:</strong> Best formation by combined final score<br />
              6. <strong>Captain:</strong> Highest final score IN starting 11<br />
              7. <strong>Vice-Captain:</strong> 2nd highest final score IN starting 11<br />
              <br />
              This ensures your top performers are always starting AND captaining - perfect consistency!
            </Paragraph>
          </div>
        </Section>

        {/* Fixture Difficulty Strategy */}
        <Section title="Fixture Difficulty Strategy" icon={<InfoCircleFilled />}>
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
                <Section size="small" title="Why This Matters" style={{ borderLeft: '3px solid #faad14', height: '100%' }}>
                  <Space direction="vertical" size="small">
                    <Text>• Mid-tier players facing moderate opponents (3) have uncertain returns</Text>
                    <Text>• Defenders facing top teams (4-5) are unlikely to keep clean sheets</Text>
                    <Text>• Better to bench them and use players with easier fixtures</Text>
                  </Space>
                </Section>
              </Col>

              <Col xs={24} md={12}>
                <Section size="small" title="Elite Players Tiers" style={{ borderLeft: '3px solid #52c41a', height: '100%' }}>
                  <Space direction="vertical" size="small">
                    <Text><strong>Top 10:</strong> Always considered, even for moderate fixtures (e.g., Salah vs Chelsea)</Text>
                    <Text><strong>Top 11-20:</strong> Considered for hard fixtures but penalized for moderate ones</Text>
                    <Text><strong>Others:</strong> Penalized for both moderate and hard fixtures</Text>
                  </Space>
                </Section>
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
        </Section>

        {/* Algorithm Flow Visualization */}
        <Section title="Algorithm Flow Visualization" icon={<ExperimentOutlined />}>
          <Paragraph>
            Here&apos;s how the unified algorithm processes your team step-by-step:
          </Paragraph>

          <div style={{ background: '#f5f5f5', padding: '24px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', overflowX: 'auto' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre', color: '#333' }}>
              {`┌─────────────────────────────────────────────────────────────┐
│                   YOUR 15-PLAYER SQUAD                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  CALCULATE BASE SCORE │
              │  (All 15 players)     │
              └───────────┬───────────┘
                          │
        For each player:  │
        • Total Points x 3                = Quality
        • Form x 20                       = Recent Performance
        • Price x 15                      = Manager Assessment
        • PPG x 10                        = Consistency
        • Goals x 8 + Assists x 5         = Output
        • Fixture Bonus/Penalty           = Match Difficulty
        • Home Bonus (+8)                 = Home Advantage
        • Ownership >= 50% (+10)          = Template Player
                          │
                          ▼
              ┌───────────────────────┐
              │  SORT BY BASE SCORE   │
              │  Highest -> Lowest     │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   ASSIGN RANK 1-15    │
              └───────────┬───────────┘
                          │
                          ▼
          ┌────────────────────────────────────┐
          │     APPLY FIXTURE PENALTIES        │
          │   (Based on rank & difficulty)     │
          └────────────┬───────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    Rank 1-10                 Rank 11-15
   (Elite Players)           (Other Players)
          │                         │
    NO PENALTIES            ├─ Diff 3? -> -30%
          │                 ├─ Diff 4-5 & Rank 11-20? -> Immune
          │                 └─ Diff 4-5 & Rank 21+? -> -60%
          │                         │
          └────────────┬────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │   ALL PLAYERS HAVE     │
          │   FINAL SCORE          │
          └────────────┬───────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    ┌─────────────┐         ┌─────────────┐
    │  STARTING   │         │  CAPTAINCY  │
    │  11 LOGIC   │         │  SELECTION  │
    └──────┬──────┘         └──────┬──────┘
           │                       │
           │ Try 8 formations      │ Captain = Highest
           │ Pick best by score    │ Vice = 2nd Highest
           │                       │
           ▼                       ▼
    Starting 11              Captain & Vice
    + Bench (4)              (From Starting 11)
           │                       │
           └──────────┬────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │   TRANSFER LOGIC     │
           └──────────┬───────────┘
                      │
         Only transfers │ Must improve
         starting 11    │ starting 11 score
                      │
                      ▼
           Recommended Transfers`}
            </pre>
          </div>

          <Alert
            className="mt-4"
            message="Key Insight: Single Unified Score"
            description="Notice how the same FINAL SCORE is used for both starting 11 selection AND captaincy. This is what makes the algorithm unified - your best players start, and your best starter is captain. No contradictions possible!"
            type="success"
            showIcon
          />
        </Section>

        {/* Example Scenario */}
        <Section title="Example Scenario">
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
        </Section>

      </Content>
    </Layout>
  )
}
