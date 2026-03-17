import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');

    // V3: Expanded tokens and active selection
    const ALL_TOKENS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'DOGE'];
    const [activeTokens, setActiveTokens] = useState(['BTC', 'ETH', 'SOL', 'BNB']);

    const [sentiments, setSentiments] = useState(ALL_TOKENS.map(sym => ({
        symbol: sym,
        score: Math.floor(Math.random() * 100) * (Math.random() > 0.5 ? 1 : -1),
        label: 'neutral',
        confidence: Math.floor(Math.random() * 40 + 50),
        source: 'cryptopanic.com',
        price: Math.random() * (sym === 'BTC' ? 90000 : sym === 'ETH' ? 4000 : 100) + 10,
        change24h: (Math.random() * 10 - 5).toFixed(2)
    })));

    const [portfolio, setPortfolio] = useState({
        fiatBalance: 5000,
        cryptoValue: 10000,
        weights: { BTC: 40, ETH: 30, SOL: 20, BNB: 10 }
    });

    const [trades, setTrades] = useState([]);

    const [leaderboard, setLeaderboard] = useState([
        { caller: '0xABC...123', score: 15 },
        { caller: '0xDEF...456', score: 12 },
        { caller: '0x789...XYZ', score: 8 }
    ]);

    // v2 Features State
    const [walletAddress, setWalletAddress] = useState(null);
    const [userProfile, setRiskProfile] = useState(2); // 1, 2, 3
    const [customSources, setCustomSources] = useState({});
    const [toasts, setToasts] = useState([]);
    const [isWalletHovered, setIsWalletHovered] = useState(false);

    const addToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const handleConnectWallet = () => {
        if (walletAddress) {
            setWalletAddress(null);
            addToast('info', 'Wallet disconnected.');
        } else {
            const mockAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
            setWalletAddress(mockAddr);
            addToast('success', 'Wallet connected successfully!');
        }
    };

    return (
        <div className="app-container">
            {/* Toast Notifications */}
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

            <header>
                <div>
                    <h1>SentimentAgent</h1>
                    <p className="meta-text">Powered by GenLayer Intelligent Contracts</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="status-badge">
                        <div className="status-dot"></div>
                        Testnet Bradbury Connected
                    </div>
                    <button
                        className={`btn ${walletAddress ? 'btn-primary' : ''}`}
                        onClick={handleConnectWallet}
                        onMouseEnter={() => setIsWalletHovered(true)}
                        onMouseLeave={() => setIsWalletHovered(false)}
                    >
                        {walletAddress
                            ? (isWalletHovered ? '🔌 Disconnect Wallet' : `🔌 ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`)
                            : '💳 Connect Wallet'}
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

export default App;
