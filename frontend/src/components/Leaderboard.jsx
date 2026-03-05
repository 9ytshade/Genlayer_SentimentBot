import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Leaderboard({ sentiments, activeTokens }) {

    // Generate distinct bright colors for charting
    const COLORS = ['#00e676', '#ff3d00', '#2979ff', '#ffea00', '#d500f9', '#00e5ff', '#ff9100', '#1de9b6'];



    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>

            <div className="card">
                <h2 className="card-title">Top Callers (History)</h2>
                <p className="meta-text" style={{ marginBottom: '1rem' }}>Addresses triggering the most accurate oracle updates.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                        { caller: '0xABC...123', score: 150 },
                        { caller: '0xDEF...456', score: 120 },
                        { caller: '0x789...XYZ', score: 85 }
                    ].map((lb, idx) => (
                        <div key={idx} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                            border: idx === 0 ? '1px solid var(--warning)' : 'none'
                        }}>
                            <div>
                                <span style={{
                                    color: idx === 0 ? 'var(--warning)' : 'var(--text-secondary)',
                                    fontWeight: 700, marginRight: '0.5rem'
                                }}>#{idx + 1}</span>
                                <span style={{ fontSize: '0.875rem' }}>{lb.caller}</span>
                            </div>
                            <span className="score-badge score-neutral" style={{ fontSize: '0.875rem' }}>
                                {lb.score} pts
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 className="card-title">Individual Sentiment History</h2>
                {activeTokens.map((sym, index) => {
                    const tokenData = sentiments.find(s => s.symbol === sym);
                    const currentScore = tokenData ? tokenData.score : 0;

                    let history = [currentScore];
                    for (let i = 0; i < 4; i++) {
                        history.unshift(Math.max(-100, Math.min(100, history[0] + (Math.floor(Math.random() * 40) - 20))));
                    }

                    const chartData = {
                        labels: ['-4h', '-3h', '-2h', '-1h', 'Now'],
                        datasets: [{
                            label: `${sym} Sentiment`,
                            data: history,
                            borderColor: COLORS[index % COLORS.length],
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            tension: 0.3,
                            pointRadius: 3
                        }]
                    };

                    const chartOptions = {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false }, title: { display: true, text: `${sym} AI Sentiment`, color: 'var(--text-primary)' } },
                        scales: {
                            y: { min: -100, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } },
                            x: { grid: { color: 'rgba(255,255,255,0.05)' } }
                        }
                    };

                    return (
                        <div key={sym} className="card" style={{ height: '300px' }}>
                            <Line options={chartOptions} data={chartData} />
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
