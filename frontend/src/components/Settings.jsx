import React, { useState } from 'react';

// ── Reusable tag filter panel ─────────────────────────────────────────────────
function FilterPanel({ title, placeholder, prefix, whitelist, blacklist, onAdd, onRemove }) {
    const [input, setInput] = useState('');

    const handleAdd = (type) => {
        const val = input.trim();
        if (!val) return;
        if (prefix && !val.startsWith(prefix)) {
            onAdd(null, null, `Entry must start with "${prefix}"`);
            return;
        }
        onAdd(val, type);
        setInput('');
    };

    return (
        <div className="card">
            <h2 className="card-title">{title}</h2>

            <div className="input-group" style={{ marginBottom: '1.25rem', flexWrap: 'nowrap' }}>
                <input
                    type="text"
                    className="input-field"
                    placeholder={placeholder}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd('whitelist')}
                />
                <button
                    className="btn"
                    style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)', whiteSpace: 'nowrap' }}
                    onClick={() => handleAdd('whitelist')}
                >
                    + Whitelist
                </button>
                <button
                    className="btn"
                    style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)', whiteSpace: 'nowrap' }}
                    onClick={() => handleAdd('blacklist')}
                >
                    + Blacklist
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <TagColumn
                    label="Whitelisted"
                    color="var(--success)"
                    bg="rgba(0,255,136,0.08)"
                    items={whitelist}
                    onRemove={val => onRemove(val, 'whitelist')}
                />
                <TagColumn
                    label="Blacklisted"
                    color="var(--danger)"
                    bg="rgba(239,68,68,0.08)"
                    items={blacklist}
                    onRemove={val => onRemove(val, 'blacklist')}
                />
            </div>
        </div>
    );
}

function TagColumn({ label, color, bg, items, onRemove }) {
    return (
        <div>
            <h3 style={{ color, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
                {label} ({items.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', minHeight: '36px' }}>
                {items.length === 0 && <span className="meta-text" style={{ fontSize: '0.8rem' }}>None added</span>}
                {items.map(val => (
                    <span key={val} style={{
                        background: bg, color, border: `1px solid ${color}33`,
                        padding: '0.3rem 0.6rem', borderRadius: '6px',
                        fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
                    }}>
                        {val}
                        <span
                            style={{ cursor: 'pointer', opacity: 0.7, fontWeight: 700, lineHeight: 1 }}
                            onClick={() => onRemove(val)}
                        >×</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

// ── Main Settings Component ───────────────────────────────────────────────────
export default function Settings({ walletAddress, userProfile, setRiskProfile, customSources, setCustomSources, addToast }) {

    const CURATED_SOURCES = [
        { id: 'cdesk', name: 'CoinDesk', url: 'coindesk.com', trust: 'High' },
        { id: 'cpanic', name: 'CryptoPanic', url: 'cryptopanic.com', trust: 'High' },
        { id: 'cgecko', name: 'CoinGecko News', url: 'coingecko.com', trust: 'High' },
        { id: 'bloom', name: 'Bloomberg Crypto', url: 'bloomberg.com/crypto', trust: 'High' },
        { id: 'reddit', name: 'Reddit r/CryptoCurrency', url: 'reddit.com/r/CryptoCurrency', trust: 'Medium' },
        { id: 'x', name: 'X / Twitter', url: 'twitter.com', trust: 'Low' },
    ];

    const [activeSources, setActiveSources] = useState(['cdesk', 'cpanic', 'bloom']);

    // ── X/Twitter influencer state ──
    const [xWhitelist, setXWhitelist] = useState(['@elonmusk', '@saylor']);
    const [xBlacklist, setXBlacklist] = useState(['@bitboy_crypto']);

    // ── Reddit subreddit state ──
    const [redditWhitelist, setRedditWhitelist] = useState(['r/Bitcoin', 'r/ethereum', 'r/CryptoCurrency']);
    const [redditBlacklist, setRedditBlacklist] = useState(['r/SatoshiStreetBets']);

    // ── Website source state ──
    const [siteWhitelist, setSiteWhitelist] = useState(['coindesk.com', 'cryptopanic.com']);
    const [siteBlacklist, setSiteBlacklist] = useState(['fakebitcoinnews.xyz']);

    // ── Generic add/remove for each section ──
    const makeHandlers = (setWl, setBlBl, section) => ({
        onAdd: (val, type, err) => {
            if (err) { addToast(err, 'error'); return; }
            if (type === 'whitelist') {
                setWl(prev => [...new Set([...prev, val])]);
                addToast(`${val} whitelisted for ${section}.`, 'success');
            } else {
                setBlBl(prev => [...new Set([...prev, val])]);
                addToast(`${val} blacklisted from ${section}.`, 'success');
            }
        },
        onRemove: (val, type) => {
            if (type === 'whitelist') setWl(prev => prev.filter(x => x !== val));
            else setBlBl(prev => prev.filter(x => x !== val));
        },
    });

    const xHandlers = makeHandlers(setXWhitelist, setXBlacklist, 'X/Twitter');
    const redditHandlers = makeHandlers(setRedditWhitelist, setRedditBlacklist, 'Reddit');
    const siteHandlers = makeHandlers(setSiteWhitelist, setSiteBlacklist, 'Web Sources');

    const toggleSource = (id) => {
        const next = activeSources.includes(id)
            ? activeSources.filter(x => x !== id)
            : [...activeSources, id];
        setActiveSources(next);
        const mapped = next.map(sid => CURATED_SOURCES.find(s => s.id === sid)?.url).filter(Boolean);
        setCustomSources({ GLOBAL: mapped });
    };

    const handleProfileChange = (id) => {
        setRiskProfile(id);
        const names = { 1: 'Conservative', 2: 'Balanced', 3: 'Aggressive' };
        addToast(`Risk profile set to ${names[id]}.`, 'success');
    };

    const handleSave = () => addToast('Settings committed to GenLayer Smart Contract.', 'success');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ── Risk Profile ─────────────────────────────────────────── */}
            <div className="card">
                <h2 className="card-title">Bot Risk Profile</h2>
                <p className="meta-text" style={{ marginBottom: '1.5rem' }}>
                    Select the AI trading personality. Controls rebalance thresholds and max allocation per asset.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    {[
                        { id: 1, icon: '🛡️', label: 'Conservative', desc: 'High conviction required. Max 40% per asset.' },
                        { id: 2, icon: '⚖️', label: 'Balanced', desc: 'Standard AI scoring bounds. Max 60% per asset.' },
                        { id: 3, icon: '🚀', label: 'Aggressive', desc: 'Reacts to slight momentum shifts. Max 90% per asset.' },
                    ].map(p => (
                        <div
                            key={p.id}
                            className={`profile-card ${userProfile === p.id ? 'profile-active' : ''}`}
                            onClick={() => handleProfileChange(p.id)}
                        >
                            <h3>{p.icon} {p.label}</h3>
                            <p className="meta-text">{p.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Curated Oracle Trustlist ──────────────────────────────── */}
            <div className="card">
                <h2 className="card-title">Oracle Source Trustlist</h2>
                <p className="meta-text" style={{ marginBottom: '1.5rem' }}>
                    Choose which data sources the LLM Oracle aggregates for its final sentiment score.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {CURATED_SOURCES.map(src => (
                        <div key={src.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.9rem 1rem', background: 'rgba(255,255,255,0.03)',
                            borderRadius: '10px',
                            border: activeSources.includes(src.id) ? '1px solid rgba(0,255,136,0.3)' : '1px solid transparent',
                            transition: 'border-color 0.2s',
                        }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{src.name}</div>
                                <div className="meta-text" style={{ fontSize: '0.78rem' }}>{src.url}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span className={`score-badge ${src.trust === 'High' ? 'score-positive' :
                                        src.trust === 'Medium' ? 'score-neutral' : 'score-negative'
                                    }`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                                    {src.trust}
                                </span>
                                <button
                                    className={`btn ${activeSources.includes(src.id) ? '' : 'btn-primary'}`}
                                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                                    onClick={() => toggleSource(src.id)}
                                >
                                    {activeSources.includes(src.id) ? 'Remove' : 'Add'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={handleSave} style={{ padding: '0.7rem 2rem' }}>
                        Commit On-chain ↗
                    </button>
                </div>
            </div>

            {/* ── X / Twitter Influencer Filters ────────────────────────── */}
            <FilterPanel
                title="𝕏 / Twitter Influencer Filters"
                placeholder="@username"
                prefix="@"
                whitelist={xWhitelist}
                blacklist={xBlacklist}
                onAdd={xHandlers.onAdd}
                onRemove={xHandlers.onRemove}
            />

            {/* ── Reddit Subreddit Filters ───────────────────────────────── */}
            <FilterPanel
                title="Reddit Subreddit Filters"
                placeholder="r/subreddit"
                prefix="r/"
                whitelist={redditWhitelist}
                blacklist={redditBlacklist}
                onAdd={redditHandlers.onAdd}
                onRemove={redditHandlers.onRemove}
            />

            {/* ── Website Source Filters ─────────────────────────────────── */}
            <FilterPanel
                title="Website Source Filters"
                placeholder="example.com"
                prefix={null}
                whitelist={siteWhitelist}
                blacklist={siteBlacklist}
                onAdd={siteHandlers.onAdd}
                onRemove={siteHandlers.onRemove}
            />

        </div>
    );
}
