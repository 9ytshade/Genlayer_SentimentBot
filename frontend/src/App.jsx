import React, { useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import AuthModal from './components/auth/AuthModal';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';

// ── Secure Export Modal ───────────────────────────────────────────────────────
function ExportModal({ title, value, onClose }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    // Close on backdrop click
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'rgba(20,24,35,0.98)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px',
                    boxShadow: '0 0 60px rgba(239,68,68,0.1), 0 24px 48px rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column', gap: '1.25rem',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🔑 {title}</h2>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: 'var(--text-secondary)',
                        fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1,
                    }}>×</button>
                </div>

                {/* Warning */}
                <div style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '10px', padding: '0.875rem',
                    fontSize: '0.82rem', color: '#fca5a5', lineHeight: 1.6,
                }}>
                    ⚠️ <strong style={{ color: 'var(--danger)' }}>Never share this with anyone.</strong> Anyone
                    with this information has full control of your wallet and funds.
                </div>

                {/* Value box */}
                <div style={{
                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', padding: '1rem',
                    fontFamily: 'Courier New, monospace', fontSize: '0.85rem',
                    color: 'var(--primary)', wordBreak: 'break-all', lineHeight: 1.7,
                    userSelect: 'all',
                }}>
                    {value || '—'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={copy}
                        style={{ flex: 1, borderRadius: '10px' }}
                    >
                        {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
                    </button>
                    <button
                        className="btn"
                        onClick={onClose}
                        style={{ borderRadius: '10px', padding: '0.75rem 1.25rem' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Inner app (shown only when authenticated) ────────────────────────────────
function AuthenticatedApp({ addToast }) {
    const { user, wallet, mnemonic, logout } = useWallet();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [exportModal, setExportModal] = useState(null); // null | 'seed' | 'key'

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

    const walletAddress = user?.walletAddress ?? null;
    const shortAddr = walletAddress
        ? `${walletAddress.substring(0, 6)}...${walletAddress.slice(-4)}`
        : null;

    const handleDisconnect = () => {
        setDropdownOpen(false);
        logout();
        addToast('👋 Logged out. See you soon!', 'info');
    };

    return (
        <div className="app-container">
            {/* ── Secure Export Modal ── */}
            {exportModal === 'seed' && (
                <ExportModal
                    title="Recovery Seed Phrase"
                    value={mnemonic || (() => {
                        // Restore from localStorage if mnemonic cleared (returning user)
                        try {
                            const key = `sentimentagent_wallet_${btoa(user.email.toLowerCase().trim())}`;
                            const enc = localStorage.getItem(key);
                            if (!enc) return 'Seed phrase not available in this session.';
                            const raw = atob(enc);
                            return raw.split('').map((c, i) =>
                                String.fromCharCode(c.charCodeAt(0) ^ user.email.toLowerCase().trim().charCodeAt(i % user.email.length))
                            ).join('');
                        } catch { return 'Unable to decode seed phrase.'; }
                    })()}
                    onClose={() => setExportModal(null)}
                />
            )}
            {exportModal === 'key' && (
                <ExportModal
                    title="Private Key"
                    value={wallet?.privateKey ?? 'Private key not available in this session. Please log in again.'}
                    onClose={() => setExportModal(null)}
                />
            )}

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

                    {/* ── Wallet Dropdown ── */}
                    <div style={{ position: 'relative' }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => setDropdownOpen(o => !o)}
                            title={walletAddress}
                            style={{ gap: '0.5rem' }}
                        >
                            🔐 {shortAddr}
                            <span style={{
                                fontSize: '0.65rem', opacity: 0.7,
                                transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s', display: 'inline-block',
                            }}>▼</span>
                        </button>

                        {dropdownOpen && (
                            <>
                                {/* Click-away backdrop */}
                                <div
                                    onClick={() => setDropdownOpen(false)}
                                    style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                />
                                {/* Dropdown panel */}
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                    zIndex: 100, minWidth: '220px',
                                    background: 'rgba(16,20,30,0.98)',
                                    border: '1px solid rgba(0,255,136,0.2)',
                                    borderRadius: '14px', padding: '0.5rem',
                                    boxShadow: '0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
                                    backdropFilter: 'blur(20px)',
                                    animation: 'slideUp 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                                }}>
                                    {/* Address chip */}
                                    <div style={{
                                        padding: '0.6rem 0.75rem 0.75rem',
                                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                                        marginBottom: '0.4rem',
                                    }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Connected Wallet</div>
                                        <div style={{ fontFamily: 'Courier New, monospace', fontSize: '0.78rem', color: 'var(--primary)' }}>
                                            {walletAddress}
                                        </div>
                                    </div>

                                    {/* Menu items */}
                                    {[
                                        { icon: '📄', label: 'Export Seed Phrase', action: () => { setDropdownOpen(false); setExportModal('seed'); } },
                                        { icon: '🗝️', label: 'Export Private Key', action: () => { setDropdownOpen(false); setExportModal('key'); } },
                                    ].map(item => (
                                        <button
                                            key={item.label}
                                            onClick={item.action}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                width: '100%', background: 'none', border: 'none',
                                                color: 'var(--text-primary)', padding: '0.65rem 0.75rem',
                                                borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                                                fontFamily: 'var(--font-family)', fontSize: '0.9rem',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
                                            <span>{item.icon}</span> {item.label}
                                        </button>
                                    ))}

                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.4rem 0' }} />

                                    <button
                                        onClick={handleDisconnect}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            width: '100%', background: 'none', border: 'none',
                                            color: 'var(--danger)', padding: '0.65rem 0.75rem',
                                            borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                                            fontFamily: 'var(--font-family)', fontSize: '0.9rem',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >
                                        <span>🔌</span> Disconnect Wallet
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
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
