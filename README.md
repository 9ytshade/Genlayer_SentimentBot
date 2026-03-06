# GenLayer Sentiment Investment Agent dApp

An on-chain intelligent investment agent powered by GenLayer, combining social sentiment analysis with autonomous portfolio management. This system automatically analyzes sentiment from multiple sources and rebalances investment portfolios based on real-time sentiment data.

## 🎯 Overview

This project demonstrates GenLayer's capability to bring AI intelligence on-chain by creating an autonomous investment system that:

- **Analyzes Social Sentiment**: Fetches and analyzes sentiment from crypto news sources and social media
- **Manages Portfolios**: Automatically rebalances user portfolios based on sentiment scores
- **Tracks History**: Maintains an immutable on-chain record of sentiment snapshots and trading decisions
- **Incentivizes Updates**: Rewards callers for keeping sentiment data fresh through a leaderboard system

## 🏗️ Architecture

### Smart Contracts

#### 1. **SentimentOracle.py**
The intelligence layer that fetches and analyzes social sentiment data.

**Key Features:**
- Fetches data from multiple sources (CryptoPanic, Reddit, CoinDesk, CoinGecko)
- Analyzes sentiment and generates scores (-100 to +100)
- Tracks confidence levels and data sources
- Supports custom user-defined data sources
- Maintains whitelist of trusted domains

**Storage:**
- `sentiment_scores`: Latest sentiment per asset
- `last_updated`: Update timestamps
- `user_custom_sources`: User-defined data sources
- `whitelisted_domains`: Approved source domains
- `supported_assets`: Tracked asset symbols (BTC, ETH, SOL, BNB)

#### 2. **PortfolioAgent.py**
The autonomous portfolio manager that executes rebalancing strategies.

**Key Features:**
- Manages user deposits and portfolio balances
- Auto-rebalances based on sentiment scores
- Supports multiple risk profiles (Conservative, Balanced, Aggressive)
- Records all trade decisions on-chain
- Rebalancing threshold: 10 (only includes assets with |sentiment| ≥ 10)
- Max weight per asset: 60%

**Storage:**
- `balances`: User account balances
- `portfolio_weights`: Per-user asset allocations
- `user_risk_profiles`: User risk preferences
- `trade_history`: Immutable trading records
- `total_deposited`: Total value locked

#### 3. **SentimentLeaderboard.py**
A historical record keeper and gamification layer.

**Key Features:**
- Records sentiment snapshots over time (max 50 per symbol)
- Tracks caller contributions and points
- Incentivizes users to keep data fresh
- Maintains historical sentiment data for analytics
- Scores: +1 point per successful data update

**Storage:**
- `sentiment_history`: Historical snapshots per symbol
- `caller_scores`: Contributor reputation scores
- `callers_list`: Ordered list of contributors
- `total_snapshots`: Cumulative history entries

### Frontend

React + Vite application providing user interface for:
- Portfolio visualization with Chart.js
- Real-time sentiment display
- Trade history viewing
- Risk profile configuration

## 📦 Project Structure

```
GenLayer PJs/
├── contracts/
│   ├── SentimentOracle.py       # Sentiment analysis smart contract
│   ├── PortfolioAgent.py         # Portfolio management contract
│   └── SentimentLeaderboard.py   # History & leaderboard contract
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   └── App.jsx               # Main app component
│   ├── public/                   # Static assets
│   ├── index.html                # HTML entry point
│   ├── package.json              # Frontend dependencies
│   └── vite.config.js            # Vite configuration
├── scripts/
│   └── deploy.ts                 # Deployment scripts
├── tests/
│   └── test_sentiment_oracle.py  # Smart contract tests
├── .vscode/
│   └── settings.json             # MCP server configuration
├── Gen Layer/                    # GenLayer documentation & blogs
└── README.md                     # This file
```

## 🚀 Installation & Setup

### Prerequisites

- **Python 3.14+** with GenLayer SDK
- **Node.js 24+** with npm
- **Git Bash** or WSL for bash terminal support

### 1. Clone the Repository

```bash
git clone https://github.com/9ytshade/Genlayer_SentimentBot.git
cd Genlayer_SentimentBot
```

### 2. Install GenLayer Python Library

```bash
pip install genlayer
```

### 3. Install GenLayer MCP Server (Optional - for VS Code Integration)

The MCP server is already configured in `.vscode/settings.json`:

```bash
npm install -g genlayer-mcp
```

### 4. Setup Frontend

```bash
cd frontend
npm install
```

### 5. Configure Environment Variables

Create a `.env` file if needed for:
- Contract addresses after deployment
- RPC endpoint configuration
- Other chain-specific settings

## 💻 Development

### Running Frontend Dev Server

```bash
cd frontend
npm run dev
```

### Building Frontend for Production

```bash
cd frontend
npm run build
```

### Running Tests

```bash
# From project root
python -m pytest tests/
```

### Deploying Contracts

```bash
# Using GenLayer CLI
genlayer deploy contracts/SentimentOracle.py
genlayer deploy contracts/SentimentLeaderboard.py
genlayer deploy contracts/PortfolioAgent.py
```

## 🔧 Configuration

### Supported Assets

Default tracked assets: `BTC, ETH, SOL, BNB`

Customize in `SentimentOracle.py`:
```python
SUPPORTED_ASSETS_DEFAULT = ["BTC", "ETH", "SOL", "BNB"]
```

### Data Sources

CryptoPanic, Reddit, CoinDesk, CoinGecko

Whitelist domains in `SentimentOracle.py`:
```python
WHITELISTED_DOMAINS_DEFAULT = ["cryptopanic.com", "reddit.com", "coingecko.com", "coindesk.com"]
```

### Portfolio Parameters

- **Rebalance Threshold**: 10 (minimum sentiment score magnitude)
- **Max Weight**: 60% (per asset)
- **Risk Profiles**: Conservative(1), Balanced(2), Aggressive(3)

## 📊 Usage

### Depositing Funds

```python
# Via PortfolioAgent contract
agent.deposit(amount=1000)
```

### Setting Risk Profile

```python
# Risk levels: 1=Conservative, 2=Balanced, 3=Aggressive
agent.set_risk_profile(user_address, risk_level=2)
```

### Triggering Sentiment Update

```python
# Anyone can call to earn leaderboard points
oracle.update_sentiment("BTC")
leaderboard.record_sentiment_snapshot("BTC")
```

### Viewing Portfolio

The frontend provides:
- Current portfolio allocation (pie chart)
- Sentiment scores by asset (bar chart)
- Trade history (table view)
- Leaderboard rankings

## 🛠️ Technologies Used

- **Smart Contracts**: Python (GenLayer)
- **Frontend**: React 18.2 + Vite 5.4
- **Charts**: Chart.js + react-chartjs-2
- **MCP Server**: GenLayer MCP for IDE integration
- **Build Tool**: Vite

## 📝 Notes

- All sentiment data is fetched real-time from public sources
- Portfolio rebalancing is deterministic based on sentiment thresholds
- Trade history is immutable once recorded on-chain
- The leaderboard incentivizes keeping sentiment data fresh

## 🤝 Contributing

When contributing to this project:

1. Maintain Python contract style consistency
2. Add tests for new smart contract functions
3. Update contract documentation in code
4. Test sentiment analysis with real sources
5. Verify frontend integration with contracts

## 📚 Resources

- [GenLayer Documentation](https://docs.genlayer.com/)
- [GenLayer Blog Posts](./Gen%20Layer/) - Included in this repository
- [Smart Contract Standards](https://docs.genlayer.com/contracts)

## 📄 License

[Specify your license here]

## 👤 Author

Created by: 9ytshade (GitHub)

---

**Last Updated**: March 2026
