# FPL Advisor 🏆

A personalized Fantasy Premier League advisor that analyzes your team and provides tailored transfer recommendations.

## Features

- 📊 **Personalized Analysis**: Get insights specific to your FPL team
- 🔄 **Smart Transfer Suggestions**: AI-powered recommendations based on form, fixtures, and budget
- 📅 **Fixture Analysis**: Color-coded difficulty ratings for upcoming matches
- 💰 **Budget Management**: Cumulative budget calculations for multiple transfers
- 🎲 **Randomize Options**: Explore different transfer combinations
- 📱 **Fully Responsive**: Optimized for mobile, tablet, and desktop
- 🌙 **Dark Mode**: Easy on the eyes with Ant Design dark theme
- ⚡ **Fast Performance**: Server-side caching and React optimizations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: Ant Design
- **Styling**: Tailwind CSS + Custom CSS
- **Font**: Geist Sans (Vercel)
- **Data Source**: Official FPL API
- **Deployment**: Optimized for Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd "FPL Advisor"

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Configuration

The app uses two hardcoded team IDs by default:
- Team 1: `7535279` (DH-to-the-moon)
- Team 2: `5385777` (Caribbean Chaos)

To use your own team:
1. Get your FPL team ID from your team URL: `https://fantasy.premierleague.com/entry/YOUR_TEAM_ID/event/XX`
2. Update `DEFAULT_TEAM_ID` in `app/page.js`
3. Update `MY_TEAMS` array with your team details

## Deployment to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy" (Vercel auto-detects Next.js)

## API Routes

The app includes serverless API routes that act as proxies to the FPL API:

- `/api/fpl/bootstrap` - Player and team data (cached 5 min)
- `/api/fpl/fixtures` - Fixture list (cached 2 min)
- `/api/fpl/team/[teamId]` - Team info (cached 1 min)
- `/api/fpl/team/[teamId]/picks` - Squad picks (cached 1 min)

All routes include proper caching headers for optimal performance.

## Performance Optimizations

### Implemented Optimizations

✅ **React Optimizations**
- `useMemo` for expensive calculations
- `useCallback` for memoized handlers
- Proper dependency arrays
- Lazy loading where applicable

✅ **API Optimizations**
- Server-side caching with revalidation
- Stale-while-revalidate strategy
- Proper HTTP headers

✅ **Mobile Optimizations**
- Responsive breakpoints (xs, sm, md, lg)
- Touch-friendly button sizes (44px min)
- Optimized font sizes with `clamp()`
- Reduced padding on small screens
- Horizontal scroll for tables

✅ **Next.js Best Practices**
- Server Components where possible
- Client Components only when needed
- Proper metadata configuration
- Optimized font loading with `next/font`

## Project Structure

```
FPL Advisor/
├── app/
│   ├── api/fpl/              # API proxy routes
│   ├── components/           # Reusable components
│   │   ├── FixtureChips.js   # Fixture display
│   │   ├── PlayerInfo.js     # Player details
│   │   ├── StandardTable.js  # Table wrapper
│   │   ├── TableColumns.js   # Column definitions
│   │   └── TransferCard.js   # Transfer suggestions
│   ├── utils/                # Helper functions
│   ├── globals.css           # Global styles
│   ├── layout.js             # Root layout
│   ├── page.js               # Main page
│   └── providers.js          # Theme provider
├── public/                   # Static assets
├── .gitignore
├── package.json
└── README.md
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Metrics

Target Lighthouse scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

## Contributing

This is a personal project, but suggestions and bug reports are welcome!

## License

MIT

## Acknowledgments

- Data provided by [Fantasy Premier League](https://fantasy.premierleague.com)
- UI components by [Ant Design](https://ant.design)
- Font by [Vercel](https://vercel.com/font)

---

Built with ❤️ for FPL managers who want to beat Sheitlingthorp FC
