/**
 * SeedPhraseCard.jsx
 * Displays the 12-word BIP-39 seed phrase with blur, copy, and acknowledgment.
 */
import React, { useState } from 'react';

export default function SeedPhraseCard({ phrase, onAcknowledged }) {
    const words = phrase.trim().split(' ');
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [checked, setChecked] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(phrase);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="seed-card">
            <div className="seed-warning">
                <span className="seed-warning-icon">⚠️</span>
                <div>
                    <strong>Save your recovery phrase</strong>
                    <p>This is the only way to recover your wallet. We never store it — if you lose it, your funds are gone forever.</p>
                </div>
            </div>

            <div className={`seed-grid ${!revealed ? 'seed-blurred' : ''}`}>
                {words.map((word, i) => (
                    <div key={i} className="seed-word">
                        <span className="seed-index">{i + 1}</span>
                        <span className="seed-text">{word}</span>
                    </div>
                ))}
            </div>

            <div className="seed-actions">
                <button
                    className="btn btn-ghost"
                    onClick={() => setRevealed(r => !r)}
                >
                    {revealed ? '🙈 Hide' : '👁 Reveal Phrase'}
                </button>
                <button
                    className="btn btn-ghost"
                    onClick={handleCopy}
                    disabled={!revealed}
                >
                    {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
            </div>

            <label className="seed-acknowledge">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => setChecked(e.target.checked)}
                />
                <span>I have saved my recovery phrase in a safe place</span>
            </label>

            <button
                className="btn btn-primary auth-submit-btn"
                disabled={!checked}
                onClick={onAcknowledged}
            >
                Continue to Dashboard →
            </button>
        </div>
    );
}
