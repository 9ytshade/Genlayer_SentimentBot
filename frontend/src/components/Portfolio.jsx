import React, { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const CHART_COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#71B37C', '#E7E9ED'
];

export default function Portfolio({
    ALL_TOKENS, activeTokens, setActiveTokens,
    portfolio, setPortfolio, trades, setTrades,
    walletAddress, userProfile, addToast
}) {
    const [loading, setLoading] = useState(false);

    const toggleToken = (sym) => {
        if (activeTokens.includes(sym)) {
            setActiveTokens(prev => prev.filter(t => t !== sym));
            addToast(`${sym} removed from portfolio tracking.`, 'info');
        } else {
            setActiveTokens(prev => [...prev, sym]);
            addToast(`${sym} added to portfolio tracking.`, 'success');
        }
    };

    const handleRebalance = () => {
        if (activeTokens.length === 0) {
            addToast('No tokens selected. Add at least one token first.', 'error');
            return;
        }
        setLoading(true);
        addToast('🤖 Triggering AI Autonomous Rebalance on GenLayer...', 'info');

        setTimeout(() => {
            let newWeights = {};
            let remaining = 100;
            activeTokens.forEach((sym, idx) => {
                if (idx === activeTokens.length - 1) {
                    newWeights[sym] = remaining;
                } else {
                    const share =
                        userProfile === 3 ? Math.floor(remaining * 0.55) :
                            userProfile === 1 ? Math.floor(remaining / activeTokens.length) :
                                Math.floor(remaining * 0.4);
                    newWeights[sym] = share;
                    remaining -= share;
                }
            });

            setPortfolio(prev => ({ ...prev, weights: newWeights }));

            const botNames = { 1: 'Conservative', 2: 'Balanced', 3: 'Aggressive' };
            setTrades(prev => [
                {
                    block: Date.now().toString().slice(-5),
                    caller: walletAddress,
                    reason: `${botNames[userProfile]} Bot — AI Rebalance`,
                    action_text: null,
                    new_weights: newWeights,
                },
                ...prev,
            ]);

            setLoading(false);
            addToast('✅ AI Rebalance complete! Weights updated on-chain.', 'success');
        }, 2500);
    };

    // Chart data — only active tokens with >0 weight
    const weightEntries = Object.entries(portfolio.weights).filter(
        ([sym, w]) => w > 0 && activeTokens.includes(sym)
    );
    const chartData = {
        labels: weightEntries.map(([sym]) => sym),
        datasets: [{
            data: weightEntries.map(([, w]) => w),
            backgroundColor: CHART_COLORS,
            borderWidth: 0,
            hoverOffset: 6,
        }],
    };

    const chartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } },
            },
        },
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ── Token Whitelist ─────────────────────────────────────── */}
            <div className="card">
                <h2 className="card-title">Token Whitelist</h2>
                <p className="meta-text" style={{ marginBottom: '1rem' }}>
                    Select which tokens the AI bot actively tracks and holds in your portfolio.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {ALL_TOKENS && ALL_TOKENS.map(sym => (
                        <button
                            key={sym}
                            className={`btn ${activeTokens.includes(sym) ? 'btn-primary' : ''}`}
                            onClick={() => toggleToken(sym)}
                            style={{ padding: '0.5rem 1.1rem', fontSize: '0.9rem' }}
                        >
                            {sym} {activeTokens.includes(sym) ? '✓' : '+'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Allocation Chart + Token Breakdown ─────────────────── */}
            <div className="card">
                <h2 className="card-title">Portfolio Allocation</h2>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '260px', height: '260px' }}>
                        <Doughnut data={chartData} options={chartOptions} />
                    </div>

                    {/* Token weight tiles */}
                    <div style={{
                        width: '100%', display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                        gap: '0.6rem'
                    }}>
                        {weightEntries.map(([sym, w], i) => (
                            <div key={sym} style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '10px',
                                padding: '0.7rem',
                                textAlign: 'center',
                            }}>
                                <div style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: CHART_COLORS[i % CHART_COLORS.length],
                                    display: 'inline-block', marginBottom: '0.3rem'
                                }} />
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{sym}</div>
                                <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{w}%</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                    ${((portfolio.cryptoValue * w) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                            </div>
                        ))}
                        {weightEntries.length === 0 && (
                            <p className="meta-text" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem' }}>
                                No active tokens selected.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── AI Rebalance ───────────────────────────────────────── */}
            <button
                className="btn btn-primary"
                onClick={handleRebalance}
                disabled={loading}
                style={{ width: '100%', padding: '1.1rem', fontSize: '1.05rem', borderRadius: '12px' }}
            >
                {loading
                    ? <><span className="auth-spinner" style={{ marginRight: '0.5rem' }} /> Rebalancing...</>
                    : '🚀 Trigger AI Autonomous Rebalance'}
            </button>

            {/* ── Trade History ──────────────────────────────────────── */}
            <div className="card">
                <h2 className="card-title">Recent Trade History</h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Block #</th>
                                <th>Wallet</th>
                                <th>Reason</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.map((t, idx) => (
                                <tr key={idx}>
                                    <td className="meta-text">#{t.block}</td>
                                    <td className="meta-text">
                                        {t.caller ? `${t.caller.substring(0, 6)}...${t.caller.slice(-4)}` : '—'}
                                    </td>
                                    <td>{t.reason}</td>
                                    <td>
                                        {t.action_text ? (
                                            <span style={{
                                                color: t.action_text.startsWith('+') ? 'var(--success)' : 'var(--danger)',
                                                fontWeight: 700,
                                            }}>
                                                {t.action_text}
                                            </span>
                                        ) : (
                                            <span className="score-badge score-positive" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                                                Weights Updated
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {trades.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No rebalances yet — trigger your first AI trade above.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
