import React, { useState } from 'react';

export default function Settings({
    walletAddress,
    userProfile,
    setRiskProfile,
    customSources,
    setCustomSources,
    addToast
}) {
    const CURATED_SOURCES = [
        { id: 'cdesk', name: 'CoinDesk Pro', url: 'coindesk.com', trust: 'High' },
        { id: 'cpanic', name: 'CryptoPanic Aggr.', url: 'cryptopanic.com', trust: 'High' },
        { id: 'reddit', name: 'Reddit /r/CryptoCurrency', url: 'reddit.com/r/CryptoCurrency', trust: 'Medium' },
        { id: 'bloom', name: 'Bloomberg Terminal (Mock)', url: 'bloomberg.com/crypto', trust: 'High' },
        { id: 'x', name: 'X / Twitter Influencers', url: 'twitter.com', trust: 'Low' }
    ];

    const [activeSources, setActiveSources] = useState(['cdesk', 'cpanic', 'bloom']);

    const [influencerInput, setInfluencerInput] = useState('');
    const [whitelistedInfluencers, setWhitelistedInfluencers] = useState(['@elonmusk', '@saylor']);
    const [blacklistedInfluencers, setBlacklistedInfluencers] = useState(['@bitboy_crypto']);

    const addInfluencer = (type) => {
        if (!influencerInput.trim() || !influencerInput.startsWith('@')) {
            addToast('error', 'Influencer handle must start with @');
            return;
        }
        if (type === 'whitelist') {
            setWhitelistedInfluencers(prev => [...new Set([...prev, influencerInput])]);
            addToast('success', `${influencerInput} added to whitelist.`);
        } else {
            setBlacklistedInfluencers(prev => [...new Set([...prev, influencerInput])]);
            addToast('success', `${influencerInput} added to blacklist.`);
        }
        setInfluencerInput('');
    };

    const removeInfluencer = (handle, type) => {
        if (type === 'whitelist') setWhitelistedInfluencers(prev => prev.filter(h => h !== handle));
        else setBlacklistedInfluencers(prev => prev.filter(h => h !== handle));
    };

    const toggleSource = (sourceId) => {
        let newActive;
        if (activeSources.includes(sourceId)) {
            newActive = activeSources.filter(id => id !== sourceId);
        } else {
            newActive = [...activeSources, sourceId];
        }
        setActiveSources(newActive);

        // Mocking the structure expected by the backend
        const mappedUrls = newActive.map(id => CURATED_SOURCES.find(s => s.id === id).url);
        setCustomSources({ "GLOBAL": mappedUrls });
    };

    const handleSaveSources = () => {
        addToast('success', 'Source Trustlist saved to GenLayer Smart Contract.');
    };

    const handleProfileChange = (id) => {
        setRiskProfile(id);
        const profiles = { 1: 'Conservative', 2: 'Balanced', 3: 'Aggressive' };
        addToast('success', `Risk profile changed to ${profiles[id]}`);
    };

    if (!walletAddress) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Wallet Connection Required</h2>
                <p className="meta-text">Please connect your GenLayer wallet to configure your personal bot settings.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div className="card">
                <h2 className="card-title">Bot Risk Management Profile</h2>
                <p className="meta-text" style={{ marginBottom: '1.5rem' }}>
                    Select the AI trading personality that best fits your risk appetite. This alters the threshold for triggering rebalances and maximum asset allocations.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>

                    <div
                        className={`profile-card ${userProfile === 1 ? 'profile-active' : ''}`}
                        onClick={() => handleProfileChange(1)}
                    >
                        <h3>🛡️ Conservative</h3>
                        <p className="meta-text">High conviction required. Max 40% per asset.</p>
                    </div>

                    <div
                        className={`profile-card ${userProfile === 2 ? 'profile-active' : ''}`}
                        onClick={() => handleProfileChange(2)}
                    >
                        <h3>⚖️ Balanced</h3>
                        <p className="meta-text">Standard AI scoring bounds. Max 60% per asset.</p>
                    </div>

                    <div
                        className={`profile-card ${userProfile === 3 ? 'profile-active' : ''}`}
                        onClick={() => handleProfileChange(3)}
                    >
                        <h3>🚀 Aggressive</h3>
                        <p className="meta-text">Reacts to slight momentum shifts. Max 90% per asset.</p>
                    </div>

                </div>
            </div>

            <div className="card">
                <h2 className="card-title">Curated Oracle Sources (Trustlist)</h2>
                <p className="meta-text" style={{ marginBottom: '1.5rem' }}>
                    Select which data sources the LLM Oracle will aggregate and synthesize into its final sentiment score.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {CURATED_SOURCES.map((src) => (
                        <div key={src.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                            border: activeSources.includes(src.id) ? '1px solid var(--primary)' : '1px solid transparent'
                        }}>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{src.name}</div>
                                <div className="meta-text" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>{src.url}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span className={`score-badge ${src.trust === 'High' ? 'score-positive' : src.trust === 'Medium' ? 'score-neutral' : 'score-negative'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                                    Trust: {src.trust}
                                </span>
                                <button className={`btn ${activeSources.includes(src.id) ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggleSource(src.id)}>
                                    {activeSources.includes(src.id) ? 'Remove' : 'Add Source'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={handleSaveSources} style={{ padding: '0.75rem 2rem' }}>
                        Commit Whitelist On-chain
                    </button>
                </div>
            </div>

            <div className="card">
                <h2 className="card-title">X / Twitter Influencer Filters</h2>
                <p className="meta-text" style={{ marginBottom: '1.5rem' }}>
                    Whitelist trusted usernames to boost their sentiment weight, or blacklist noisy accounts to ignore them completely during text aggregation.
                </p>

                <div className="input-group" style={{ marginBottom: '1.5rem', flexWrap: 'nowrap' }}>
                    <input type="text" className="input-field" placeholder="@username" value={influencerInput} onChange={e => setInfluencerInput(e.target.value)} />
                    <button className="btn" style={{ background: 'var(--success)', color: '#000' }} onClick={() => addInfluencer('whitelist')}>Whitelist</button>
                    <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={() => addInfluencer('blacklist')}>Blacklist</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '1rem' }}>
                    <div>
                        <h3 className="meta-text" style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Whitelisted</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {whitelistedInfluencers.length === 0 && <span className="meta-text">None</span>}
                            {whitelistedInfluencers.map(handle => (
                                <span key={handle} style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--success)', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {handle} <span style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => removeInfluencer(handle, 'whitelist')}>×</span>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="meta-text" style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Blacklisted</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {blacklistedInfluencers.length === 0 && <span className="meta-text">None</span>}
                            {blacklistedInfluencers.map(handle => (
                                <span key={handle} style={{ background: 'rgba(255,61,0,0.1)', color: 'var(--danger)', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {handle} <span style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => removeInfluencer(handle, 'blacklist')}>×</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
