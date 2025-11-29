# FPL Advisor Design System

A comprehensive design system built on Ant Design with FPL brand colors and dark mode support.

## 🎨 Philosophy

- **Consistency**: All UI components follow the same visual language
- **Dark Mode First**: Optimized for dark theme with FPL brand colors
- **Reusability**: DRY principle - don't repeat yourself
- **Accessibility**: All components follow WCAG guidelines
- **Performance**: Lightweight and optimized

## 📁 Structure

```
design-system/
├── theme.js              # Color palette, spacing, typography
├── index.js              # Main export file
├── components/           # Reusable UI components
│   ├── Section.js        # Page sections and headers
│   ├── StatusDisplay.js  # Status badges, tags, indicators
│   └── Loading.js        # Loading states and skeletons
└── utils/                # Utility functions
    ├── formatters.js     # Data formatting utilities
    └── colors.js         # Color utility functions
```

## 🎨 Theme

### Colors

**FPL Brand Colors:**
- Purple: `#37003c` (Primary)
- Pink: `#ff2882` (Accent)
- Green: `#00ff87` (Success/Highlights)

**Dark Mode Palette:**
- Background: `#141414`
- Cards: `#262626`
- Text: `rgba(255, 255, 255, 0.85)`

**Fixture Difficulty:**
- Very Easy: `#00ff87` (1-2)
- Easy: `#52c41a` (2)
- Moderate: `#faad14` (3)
- Hard: `#ff7a45` (4)
- Very Hard: `#ff4d4f` (5)

### Usage

```javascript
import { FPL_COLORS, SPACING, BORDER_RADIUS } from './design-system/theme'

// Use theme tokens
const myStyle = {
  backgroundColor: FPL_COLORS.purple,
  padding: SPACING.md,
  borderRadius: BORDER_RADIUS.lg
}
```

## 🧩 Components

### Section Components

**Section** - Standardized content section
```javascript
import { Section } from './design-system'

<Section 
  title="My Title"
  description="Optional description"
  icon={<Icon />}
  extra={<Button>Action</Button>}
>
  Content goes here
</Section>
```

**PageHeader** - Page-level header
```javascript
import { PageHeader } from './design-system'

<PageHeader
  title="Dashboard"
  description="Welcome to FPL Advisor"
  icon={<RobotOutlined />}
  actions={[<Button>Action 1</Button>, <Button>Action 2</Button>]}
/>
```

**EmptyState** - Empty state display
```javascript
import { EmptyState } from './design-system'

<EmptyState
  title="No players found"
  description="Try adjusting your filters"
  icon={<SearchOutlined />}
  action={<Button>Clear Filters</Button>}
/>
```

### Status Components

**FixtureDifficultyTag** - Fixture difficulty display
```javascript
import { FixtureDifficultyTag } from './design-system'

<FixtureDifficultyTag difficulty={2.5} showLabel={false} />
```

**StatusBadge** - Status indicator
```javascript
import { StatusBadge } from './design-system'

<StatusBadge status="success" text="Available" />
<StatusBadge status="warning" text="Doubtful" />
<StatusBadge status="error" text="Injured" />
```

**AvailabilityIndicator** - Player availability
```javascript
import { AvailabilityIndicator } from './design-system'

<AvailabilityIndicator chanceOfPlaying={75} />
```

**FormRating** - Form rating display
```javascript
import { FormRating } from './design-system'

<FormRating form={5.2} size="default" />
```

**TransferBadge** - Transfer status
```javascript
import { TransferBadge } from './design-system'

<TransferBadge type="in" />
<TransferBadge type="out" />
```

### Loading Components

**LoadingSpinner** - Loading indicator
```javascript
import { LoadingSpinner } from './design-system'

<LoadingSpinner size="large" tip="Loading..." fullScreen={true} />
```

**ContentSkeleton** - Content placeholder
```javascript
import { ContentSkeleton } from './design-system'

<ContentSkeleton rows={4} avatar={true} />
```

**TableSkeleton** - Table placeholder
```javascript
import { TableSkeleton } from './design-system'

<TableSkeleton rows={5} />
```

## 🛠️ Utilities

### Formatters

```javascript
import { 
  formatPrice,          // £8.5m
  formatPPG,            // 5.2
  calculateAvgPoints,   // Average points per 90 min
  formatNumber,         // 1,234,567
  formatPercentage,     // 45.5%
  formatTeamValue,      // £102.5m
  formatBank,           // £2.3m
  getPositionName,      // GKP, DEF, MID, FWD
  getFullPositionName,  // Goalkeeper, Defender...
  formatFixtureOpponent,// vs ARS, @ LIV
  formatGameweek        // GW15
} from './design-system/utils/formatters'
```

### Color Utilities

```javascript
import {
  getDifficultyColor,    // Returns Ant Design color name
  getDifficultyHexColor, // Returns hex color
  getFormColor,          // Form-based color
  getStatusColor         // Status-based color
} from './design-system/utils/colors'
```

## 📦 Importing

### Direct Import (Recommended)
```javascript
import { Section, StatusBadge, LoadingSpinner } from './design-system'
```

### Ant Design Components
```javascript
// Re-exported from design system for consistency
import { Button, Card, Table, Typography } from './design-system'
```

### Theme Tokens
```javascript
import { FPL_COLORS, SPACING } from './design-system/theme'
```

## ✨ Best Practices

1. **Always use design system components** instead of custom implementations
2. **Use theme tokens** for colors, spacing, and borders
3. **Leverage utility functions** for consistent formatting
4. **Follow dark mode principles** - test all components in dark mode
5. **Keep it DRY** - if you're writing similar code twice, create a reusable component

## 🚀 Migration Guide

To migrate existing components:

1. **Replace custom components** with design system equivalents
2. **Update imports** to use design system exports
3. **Replace inline colors** with `FPL_COLORS` tokens
4. **Use utility functions** for formatting
5. **Test in dark mode**

### Example Migration

**Before:**
```javascript
import { Card, Typography } from 'antd'

const MyComponent = () => (
  <Card style={{ marginBottom: 24 }}>
    <Typography.Title level={4}>Title</Typography.Title>
    <Typography.Text type="secondary">Description</Typography.Text>
    {/* content */}
  </Card>
)
```

**After:**
```javascript
import { Section } from './design-system'

const MyComponent = () => (
  <Section title="Title" description="Description">
    {/* content */}
  </Section>
)
```

## 🎯 Future Enhancements

- [ ] Add animation utilities
- [ ] Create more specialized components (PlayerCard, FixtureCard, etc.)
- [ ] Add responsive breakpoint utilities
- [ ] Create form components
- [ ] Add data visualization components (charts, graphs)
- [ ] Create notification system
- [ ] Add keyboard navigation support
- [ ] Create print styles

## 📚 Resources

- [Ant Design Documentation](https://ant.design)
- [FPL Brand Guidelines](https://fantasy.premierleague.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

