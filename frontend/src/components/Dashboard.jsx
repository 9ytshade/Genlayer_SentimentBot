import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip);

export default function Dashboard({ ALL_TOKENS, activeTokens, setActiveTokens, sentiments, setSentiments, addToast }) {
    const [loading, setLoading] = useState(null);

    const handleUpdate = (symbol, showToast = true) => {
        if (showToast) addToast('info', `Sent Oracle fetch request for ${symbol}...`);

        // This simulates the nondet.exec_prompt network call
        setTimeout(() => {
            let latestScore = 0;
            setSentiments(prev => prev.map(s => {
                if (s.symbol === symbol) {
                    const newScore = Math.max(-100, Math.min(100, s.score + (Math.floor(Math.random() * 20) - 10)));
                    latestScore = newScore;
                    return { ...s, score: newScore, label: newScore > 10 ? 'bullish' : newScore < -10 ? 'bearish' : 'neutral' };
                }
                return s;
            }));
            if (showToast) {
                setLoading(null);
                addToast('success', `Oracle Consensus reached for ${symbol}. New score: ${latestScore}`);
            }
        }, 1500); // slightly faster mock
    };

    // Auto update every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            // Pick a random active token to update silently
            if (activeTokens.length > 0) {
                const randomSym = activeTokens[Math.floor(Math.random() * activeTokens.length)];
                handleUpdate(randomSym, false);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [activeTokens]);

    // Live Price Simulation Loop
    useEffect(() => {
        const priceInterval = setInterval(() => {
            setSentiments(prev => prev.map(s => ({
                ...s,
                price: Math.max(0.01, s.price * (1 + (Math.random() * 0.002 - 0.001))) // jitter 0.1%
            })));
        }, 3000);
        return () => clearInterval(priceInterval);
    }, []);

    const toggleToken = (sym) => {
        if (activeTokens.includes(sym)) {
            setActiveTokens(activeTokens.filter(t => t !== sym));
        } else {
            setActiveTokens([...activeTokens, sym]);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="meta-text" style={{ alignSelf: 'center', marginRight: '0.5rem' }}>Tracked Assets:</span>
                {ALL_TOKENS.map(sym => (
                    <button
                        key={sym}
                        onClick={() => toggleToken(sym)}
                        className={`btn ${activeTokens.includes(sym) ? 'btn-primary' : ''}`}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                    >
                        {sym}
                    </button>
                ))}
            </div>

            <div className="dashboard-grid">
                {sentiments.filter(s => activeTokens.includes(s.symbol)).map((s) => {
                    const scoreClass = s.score > 10 ? 'score-positive' : s.score < -10 ? 'score-negative' : 'score-neutral';
                    const fillWidth = `${Math.abs(s.score)}%`;
                    const gradientColor = s.score > 10 ? 'var(--success)' : s.score < -10 ? 'var(--danger)' : 'var(--warning)';

                    return (
                        <div className="card" key={s.symbol}>
                            <div className="sentiment-row">
                                <span className="asset-symbol">{s.symbol}</span>
                                <span className={`score-badge ${scoreClass}`}>{s.score > 0 ? '+' : ''}{s.score}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                    ${s.price < 10 ? s.price.toFixed(4) : s.price.toFixed(2)}
                                </div>
                                <div className={parseFloat(s.change24h) >= 0 ? 'score-positive' : 'score-negative'} style={{ fontSize: '0.85rem' }}>
                                    {parseFloat(s.change24h) >= 0 ? '▲' : '▼'} {Math.abs(s.change24h)}%
                                </div>
                            </div>

                            <div className="meta-text" style={{ textTransform: 'capitalize', marginBottom: '1rem' }}>
                                <strong>AI Oracle:</strong> {s.label} ({s.confidence}% conf.)
                                <br />
                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Vol: ${(s.price * 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>

                            {/* Mini Sparkline Chart Placeholder */}
                            <div style={{ height: '60px', marginBottom: '1rem' }}>
                                <Line
                                    data={{
                                        labels: ['1', '2', '3', '4', '5', '6', '7'],
                                        datasets: [{
                                            data: Array(7).fill().map(() => s.price * (1 + (Math.random() * 0.1 - 0.05))),
                                            borderColor: parseFloat(s.change24h) >= 0 ? '#00e676' : '#ff3d00',
                                            borderWidth: 2,
                                            tension: 0.4,
                                            pointRadius: 0
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                        scales: { x: { display: false }, y: { display: false } }
                                    }}
                                />
                            </div>

                            <div className="bar-container">
                                <div
                                    className="bar-fill"
                                    style={{
                                        background: gradientColor,
                                        transformOrigin: s.score >= 0 ? 'left' : 'right',
                                        marginLeft: s.score >= 0 ? '50%' : `${50 - Math.abs(s.score)}%`,
                                        width: `${Math.abs(s.score) / 2}%` // Mapping -100 to 100 onto a center-origin bar
                                    }}
                                ></div>
                                {/* Center line marker */}
                                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: 'rgba(255,255,255,0.3)' }}></div>
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={() => handleUpdate(s.symbol)}
                                disabled={loading === s.symbol}
                                style={{ marginTop: 'auto' }}
                            >
                                {loading === s.symbol ? <div className="spinner"></div> : 'Update Oracle'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
