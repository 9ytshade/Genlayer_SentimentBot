import React, { useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import AuthModal from './components/auth/AuthModal';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';

// ── Inner app (shown only when authenticated) ────────────────────────────────
function AuthenticatedApp({ addToast }) {
    const { user, logout } = useWallet();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isWalletHovered, setIsWalletHovered] = useState(false);

    const ALL_TOKENS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'DOGE'];
    const [activeTokens, setActiveTokens] = useState(['BTC', 'ETH', 'SOL', 'BNB']);

    const [sentiments, setSentiments] = useState(ALL_TOKENS.map(sym => ({
        symbol: sym,
        score: Math.floor(Math.random() * 100) * (Math.random() > 0.5 ? 1 : -1),
        label: 'neutral',
        confidence: Math.floor(Math.random() * 40 + 50),
        source: 'cryptopanic.com',
        price: Math.random() * (sym === 'BTC' ? 90000 : sym === 'ETH' ? 4000 : 100) + 10,
        change24h: (Math.random() * 10 - 5).toFixed(2),
    })));

    // Portfolio starts at $1000 test credit — user can trigger rebalance immediately
    const [portfolio, setPortfolio] = useState({
        fiatBalance: 1000,
        cryptoValue: 0,
        weights: { BTC: 12, ETH: 12, SOL: 12, BNB: 12, ADA: 13, XRP: 13, DOT: 13, DOGE: 13 },
    });

    const [trades, setTrades] = useState([]);
    const [userProfile, setRiskProfile] = useState(2);
    const [customSources, setCustomSources] = useState({});

    const handleDisconnect = () => {
        logout();
        addToast('👋 Logged out. See you soon!', 'info');
    };

    const walletAddress = user?.walletAddress ?? null;
    const shortAddr = walletAddress
        ? `${walletAddress.substring(0, 6)}...${walletAddress.slice(-4)}`
        : null;

    return (
        <div className="app-container">
            <header>
                <div>
                    <h1>SentimentAgent</h1>
                    <p className="meta-text">Powered by GenLayer Intelligent Contracts</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="status-badge">
                        <div className="status-dot" />
                        Testnet Bradbury
                    </div>
                    {/* Wallet display — sourced from embedded wallet context */}
                    <button
                        className="btn btn-primary"
                        onClick={handleDisconnect}
                        onMouseEnter={() => setIsWalletHovered(true)}
                        onMouseLeave={() => setIsWalletHovered(false)}
                        title={walletAddress}
                    >
                        {isWalletHovered ? '🔌 Disconnect' : `🔐 ${shortAddr}`}
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <button className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('dashboard')}>Live Dashboard</button>
                <button className={`btn ${activeTab === 'portfolio' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('portfolio')}>Portfolio Manager</button>
                <button className={`btn ${activeTab === 'settings' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('settings')}>Config & Settings</button>
                <button className={`btn ${activeTab === 'leaderboard' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('leaderboard')}>Leaderboard & History</button>
            </div>

            <main>
                {activeTab === 'dashboard' && <Dashboard ALL_TOKENS={ALL_TOKENS} activeTokens={activeTokens} setActiveTokens={setActiveTokens} sentiments={sentiments} setSentiments={setSentiments} addToast={addToast} />}
                {activeTab === 'portfolio' && <Portfolio ALL_TOKENS={ALL_TOKENS} activeTokens={activeTokens} setActiveTokens={setActiveTokens} portfolio={portfolio} setPortfolio={setPortfolio} trades={trades} setTrades={setTrades} walletAddress={walletAddress} userProfile={userProfile} addToast={addToast} />}
                {activeTab === 'settings' && <Settings walletAddress={walletAddress} userProfile={userProfile} setRiskProfile={setRiskProfile} customSources={customSources} setCustomSources={setCustomSources} addToast={addToast} />}
                {activeTab === 'leaderboard' && <Leaderboard sentiments={sentiments} activeTokens={activeTokens} />}
            </main>
        </div>
    );
}

// ── Root with auth gate ───────────────────────────────────────────────────────
function AppRoot() {
    const { user, step } = useWallet();
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', duration = 5000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    };

    const isAuthenticated = user?.walletAddress && step === 'done';

    return (
        <>
            {/* Toast overlay — always mounted */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        {t.type === 'success' && '✅ '}
                        {t.type === 'error' && '❌ '}
                        {t.type === 'info' && 'ℹ️ '}
                        {t.message}
                    </div>
                ))}
            </div>

            {isAuthenticated
                ? <AuthenticatedApp addToast={addToast} />
                : <AuthModal addToast={addToast} />
            }
        </>
    );
}

export default function App() {
    return (
        <WalletProvider>
            <AppRoot />
        </WalletProvider>
    );
}
