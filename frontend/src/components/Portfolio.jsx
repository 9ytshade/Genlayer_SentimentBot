import React, { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Portfolio({ ALL_TOKENS, activeTokens, setActiveTokens, portfolio, setPortfolio, trades, setTrades, walletAddress, userProfile, addToast }) {
    const [amount, setAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawToken, setWithdrawToken] = useState('USD');
    const [loading, setLoading] = useState(false);

    if (!walletAddress) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Wallet Connection Required</h2>
                <p className="meta-text">Please connect your GenLayer wallet to view your personal portfolio and rebalance.</p>
            </div>
        );
    }

    const handleDeposit = (source) => {
        if (!amount || isNaN(amount) || amount <= 0) {
            addToast('error', 'Please enter a valid deposit amount.');
            return;
        }
        setPortfolio(prev => ({ ...prev, fiatBalance: prev.fiatBalance + parseInt(amount) }));
        setTrades(prev => [
            { block: Date.now().toString().slice(-4), caller: walletAddress, reason: `Deposit via ${source}`, action_text: `+$${amount}` },
            ...prev
        ]);
        setAmount('');
        addToast('success', `Successfully deposited $${amount} via ${source}.`);
    };

    const handleWithdraw = () => {
        if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
            addToast('error', 'Please enter a valid withdrawal amount.');
            return;
        }

        if (withdrawToken === 'USD') {
            if (withdrawAmount > portfolio.fiatBalance) {
                addToast('error', 'Insufficient fiat balance to withdraw.');
                return;
            }
            setPortfolio(prev => ({ ...prev, fiatBalance: prev.fiatBalance - parseInt(withdrawAmount) }));
            setTrades(prev => [
                { block: Date.now().toString().slice(-4), caller: walletAddress, reason: 'Fiat Withdrawal', action_text: `-$${withdrawAmount}` },
                ...prev
            ]);
            setWithdrawAmount('');
            addToast('success', `Successfully withdrew $${withdrawAmount} from GenLayer Escrow.`);
        } else {
            // Mock crypto withdrawal: reduce TVL roughly
            setPortfolio(prev => ({ ...prev, cryptoValue: Math.max(0, prev.cryptoValue - parseInt(withdrawAmount) * 1000) }));
            setTrades(prev => [
                { block: Date.now().toString().slice(-4), caller: walletAddress, reason: 'Crypto Withdrawal', action_text: `-${withdrawAmount} ${withdrawToken}` },
                ...prev
            ]);
            setWithdrawAmount('');
            addToast('success', `Successfully withdrew ${withdrawAmount} ${withdrawToken} to connected wallet.`);
        }
    };

    const toggleToken = (sym) => {
        if (activeTokens.includes(sym)) {
            setActiveTokens(prev => prev.filter(t => t !== sym));
            addToast('info', `${sym} blacklisted from portfolio.`);
        } else {
            setActiveTokens(prev => [...prev, sym]);
            addToast('success', `${sym} whitelisted for AI trading.`);
        }
    };

    const handleRebalance = () => {
        setLoading(true);
        addToast('info', 'Executing Semantic Rebalance on GenLayer...');

        setTimeout(() => {
            if (activeTokens.length === 0) {
                addToast('error', 'No tokens actively tracked. Cannot rebalance.');
                setLoading(false);
                return;
            }

            // Distribute across activeTokens based on risk profile
            let newWeights = {};
            let remaining = 100;

            // Just a mock algorithm spreading the weight
            activeTokens.forEach((sym, idx) => {
                if (idx === activeTokens.length - 1) {
                    newWeights[sym] = remaining; // give the rest
                } else {
                    // Aggressive favors the first token heavily, Conservative spreads evenly
                    const share = userProfile === 3 ? Math.floor(remaining * 0.6) : userProfile === 2 ? Math.floor(remaining * 0.4) : Math.floor(remaining / activeTokens.length);
                    newWeights[sym] = share;
                    remaining -= share;
                }
            });

            setPortfolio(prev => ({ ...prev, weights: newWeights }));

            const botNames = { 1: "Conservative", 2: "Balanced", 3: "Aggressive" };
            setTrades(prev => [
                { block: Date.now().toString().slice(-4), caller: walletAddress, reason: `${botNames[userProfile]} Bot rebalance`, new_weights: newWeights },
                ...prev
            ]);

            setLoading(false);
            addToast('success', '🤖 AI Autonomous Rebalance complete!');
        }, 2500);
    };

    // Prepare Chart Data
    const chartData = {
        labels: Object.keys(portfolio.weights).filter(k => portfolio.weights[k] > 0),
        datasets: [{
            data: Object.values(portfolio.weights).filter(v => v > 0),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#71B37C'
            ],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div className="card">
                <h2 className="card-title">Portfolio Assets Whitelist</h2>
                <p className="meta-text" style={{ marginBottom: '1rem' }}>Select which tokens you want the AI bot to actively trade and hold in your portfolio.</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {ALL_TOKENS && ALL_TOKENS.map(sym => (
                        <button
                            key={sym}
                            className={`btn ${activeTokens.includes(sym) ? 'btn-primary' : ''}`}
                            onClick={() => toggleToken(sym)}
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            {sym} {activeTokens.includes(sym) ? '✓' : '+'}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '2rem' }}>
                <div className="card">
                    <h2 className="card-title">Portfolio Allocation</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '250px', height: '250px', marginBottom: '1.5rem' }}>
                            <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
                        </div>
                        <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                            {Object.entries(portfolio.weights).filter(([sym, w]) => w > 0).map(([sym, w]) => (
                                <div key={sym} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                                    <strong>{sym}</strong> <span style={{ opacity: 0.7 }}>{w}%</span>
                                    <br />
                                    <span style={{ color: 'var(--success)' }}>${((portfolio.cryptoValue * w) / 100).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2 className="card-title">Account Balances & Funding</h2>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <span className="meta-text">Fiat Cash Balance</span>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>${portfolio.fiatBalance.toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className="meta-text">Crypto TVL</span>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-bright)' }}>${portfolio.cryptoValue.toLocaleString()}</div>
                        </div>
                    </div>

                    <p className="meta-text" style={{ marginBottom: '1rem' }}>Deposit external funds to enable bot trading.</p>

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <input type="number" className="input-field" placeholder="Deposit Amount (USD)" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        <button className="btn" style={{ flex: 1, minWidth: '120px' }} onClick={() => handleDeposit('Local Bank Transfer')}>🏦 Bank Transfer</button>
                        <button className="btn" style={{ flex: 1, minWidth: '120px' }} onClick={() => handleDeposit('Credit Card')}>💳 Credit Card</button>
                        <button className="btn btn-primary" style={{ flex: 1, minWidth: '120px' }} onClick={() => handleDeposit('Web3 Wallet')}>🦊 Connected Wallet</button>
                    </div>

                    <div className="input-group" style={{ marginBottom: '0.5rem' }}>
                        <select className="input-field" style={{ maxWidth: '100px' }} value={withdrawToken} onChange={e => setWithdrawToken(e.target.value)}>
                            <option value="USD">USD</option>
                            {activeTokens.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input type="number" className="input-field" placeholder="Amount" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                        <button className="btn btn-danger" onClick={handleWithdraw}>Withdraw</button>
                    </div>

                    <hr style={{ margin: '2rem 0', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <button className="btn btn-primary" onClick={handleRebalance} disabled={loading} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                        {loading ? <div className="spinner" style={{ margin: '0 auto' }}></div> : '🚀 Trigger AI Autonomous Rebalance'}
                    </button>
                </div>
            </div>

            <div className="card">
                <h2 className="card-title">Recent Trade History</h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Block #</th>
                                <th>Caller</th>
                                <th>Reason</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.map((t, idx) => (
                                <tr key={idx}>
                                    <td>{t.block}</td>
                                    <td className="meta-text">{t.caller.substring(0, 6)}...{t.caller.substring(38)}</td>
                                    <td>{t.reason}</td>
                                    <td>
                                        {t.action_text ? (
                                            <span style={{
                                                color: t.action_text.startsWith('+') ? 'var(--success)' : 'var(--danger)',
                                                fontWeight: 'bold'
                                            }}>
                                                {t.action_text}
                                            </span>
                                        ) : (
                                            <span className="score-badge score-positive" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                                                Reallocated to AI Weights
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {trades.length === 0 && (
                                <tr><td colSpan="4" style={{ textAlign: 'center' }}>No recent trades</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
