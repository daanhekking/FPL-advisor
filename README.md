# FPL Advisor

Your personalized Fantasy Premier League AI advisor - get tailored recommendations for your specific team!

## 🚀 Features

### 1. My Team - AI-Powered Analysis
- View your complete FPL squad with detailed stats
- **AI Captain Recommendations** based on form and fixtures
- **Transfer Suggestions** highlighting weak players and top targets
- Real-time team value, bank balance, and free transfers
- Overall rank tracking and gameweek performance

### 2. Fixtures
- Shows fixture difficulty ratings for all Premier League teams
- Displays upcoming fixtures (next 5 gameweeks)
- Color-coded difficulty ratings (green = easy, red = hard)
- Sorted by average fixture difficulty

### 3. Player Comparison
- Compare two players side-by-side
- Auto-complete suggestions as you type player names
- Comprehensive stats including:
  - Total points, goals and assists
  - Form, price, minutes played
  - Clean sheets and bonus points
  - Selection percentage
- Quick comparison summary showing who's better in key metrics

### 4. Settings
- Save your FPL Team ID for persistent tracking
- Easy team switching for managing multiple accounts

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: JavaScript
- **Data Source**: Official FPL Public API
- **Package Manager**: npm

## 📦 Installation

1. The project is already set up in this directory
2. Dependencies have been installed

## 🎮 Running the App

The development server is currently running. Open your browser and navigate to:

```
http://localhost:3000
```

To start the server manually in the future:

```bash
npm run dev
```

## 📁 Project Structure

```
FPL Advisor/
├── app/
│   ├── page.js              # My Team - AI Advisor (Home page)
│   ├── api/
│   │   └── fpl/            # API proxy routes for FPL data
│   ├── fixtures/
│   │   └── page.js          # Fixtures analysis page
│   ├── compare/
│   │   └── page.js          # Player comparison page
│   ├── settings/
│   │   └── page.js          # Settings page (Team ID management)
│   ├── layout.js            # Root layout with navigation
│   └── globals.css          # Global styles and Tailwind
├── package.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## 🎨 Design Features

- Modern, clean interface inspired by FPL's color scheme
- Purple (#37003c) and pink (#ff2882) brand colors
- Responsive design that works on mobile, tablet, and desktop
- Smooth transitions and hover effects
- Loading states and error handling

## 🎯 Getting Started

1. Open the app at `http://localhost:3000`
2. Click the ⚙️ Settings icon in the navigation
3. Enter your FPL Team ID (found in your FPL team URL)
4. Click "Save Settings"
5. Go to "My Team" to see your personalized analysis and recommendations!

## 📊 Data Source

All data is fetched from the official FPL API via server-side proxy routes:
- Bootstrap data (players, teams): `/api/fpl/bootstrap`
- Fixtures: `/api/fpl/fixtures`
- Team data: `/api/fpl/team/[teamId]`
- Team picks: `/api/fpl/team/[teamId]/picks`

No FPL authentication required - just your Team ID!

## 🔮 Future Enhancements

Potential features for future versions:
- Points predictions using machine learning
- Historical performance charts and trends
- Wildcard and chip planners
- Price change predictions and alerts
- Head-to-head league analysis
- Differential picks finder
- Expected goals (xG) and advanced metrics

## 🤝 Contributing

This is a local development project. Feel free to extend and customize!

## 📝 License

This project is for personal use. FPL data is provided by the official Fantasy Premier League API.

