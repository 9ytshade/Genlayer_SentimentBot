/**
 * AuthModal.jsx
 * Privy-style full-screen auth gate. Three steps:
 *   1. LOGIN   — email input or Google button
 *   2. OTP     — 6-digit verification code
 *   3. WALLET  — seed phrase display (new users only)
 */
import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import SeedPhraseCard from './SeedPhraseCard';

const STEPS = { LOGIN: 'login', OTP: 'otp', WALLET: 'wallet' };

export default function AuthModal({ addToast }) {
    const { requestOtp, verifyOtp, mnemonic, setStep: setCtxStep } = useWallet();

    const [step, setStep] = useState(STEPS.LOGIN);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isNew, setIsNew] = useState(false);

    const otpRefs = useRef([]);

    // Auto-focus first OTP box on step change
    useEffect(() => {
        if (step === STEPS.OTP) {
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
    }, [step]);

    // ── Step 1: Send OTP ────────────────────────────────────────────────────
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const code = requestOtp(email.trim());
            // Demo mode: show OTP in a toast
            addToast(`🔐 Your verification code: ${code}`, 'info', 15000);
            setStep(STEPS.OTP);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP ──────────────────────────────────────────────────
    const handleOtpSubmit = async (e) => {
        e?.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) { setError('Please enter all 6 digits.'); return; }
        setError('');
        setLoading(true);
        try {
            const result = await verifyOtp(email.trim(), code);
            setIsNew(result.isNew);
            if (result.isNew) {
                setStep(STEPS.WALLET);
            } else {
                // Returning user — skip seed phrase, mark done
                setCtxStep('done');
                addToast(`👋 Welcome back! Wallet: ${result.address.substring(0, 6)}...${result.address.slice(-4)}`, 'success');
            }
        } catch (err) {
            setError(err.message);
            setOtp(['', '', '', '', '', '']);
            setTimeout(() => otpRefs.current[0]?.focus(), 50);
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP digit input with auto-advance
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value.slice(-1);
        setOtp(next);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
        if (next.every(d => d !== '') && index === 5) {
            // Auto-submit when all 6 digits filled
            setTimeout(() => handleOtpSubmit(), 50);
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === 'Enter') handleOtpSubmit();
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const next = [...otp];
        pasted.split('').forEach((d, i) => { next[i] = d; });
        setOtp(next);
        const lastFilled = Math.min(pasted.length, 5);
        otpRefs.current[lastFilled]?.focus();
        if (pasted.length === 6) setTimeout(() => handleOtpSubmit(), 80);
    };

    return (
        <div className="auth-overlay">
            <div className="auth-card">
                {/* ── Logo / Brand ── */}
                <div className="auth-brand">
                    <div className="auth-logo">🧠</div>
                    <h1 className="auth-title">SentimentAgent</h1>
                    <p className="auth-subtitle">AI-powered crypto portfolio on GenLayer</p>
                </div>

                {/* ── Step Indicator ── */}
                <div className="auth-steps">
                    {['Login', 'Verify', 'Wallet'].map((label, i) => {
                        const idx = [STEPS.LOGIN, STEPS.OTP, STEPS.WALLET].indexOf(step);
                        return (
                            <React.Fragment key={label}>
                                <div className={`auth-step-dot ${i <= idx ? 'active' : ''}`}>
                                    {i < idx ? '✓' : i + 1}
                                </div>
                                {i < 2 && <div className={`auth-step-line ${i < idx ? 'active' : ''}`} />}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* ─────────────────────────────────── */}
                {/*  STEP 1: EMAIL LOGIN                */}
                {/* ─────────────────────────────────── */}
                {step === STEPS.LOGIN && (
                    <div className="auth-body">
                        <h2 className="auth-heading">Welcome</h2>
                        <p className="auth-desc">Enter your email to get started. A verification code will be sent to you.</p>

                        <form onSubmit={handleEmailSubmit} className="auth-form">
                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">✉️</span>
                                <input
                                    className="auth-input"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError(''); }}
                                    autoFocus
                                    required
                                />
                            </div>
                            {error && <p className="auth-error">{error}</p>}
                            <button
                                type="submit"
                                className="btn btn-primary auth-submit-btn"
                                disabled={loading}
                            >
                                {loading ? <span className="auth-spinner" /> : 'Continue with Email →'}
                            </button>
                        </form>

                        <div className="auth-divider"><span>or</span></div>

                        <button
                            className="btn auth-google-btn"
                            onClick={() => addToast('🔜 Google OAuth coming soon — use email for now', 'info')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <p className="auth-legal">
                            By continuing, you agree to our Terms of Service. A self-custodial wallet will be created for you.
                        </p>
                    </div>
                )}

                {/* ─────────────────────────────────── */}
                {/*  STEP 2: OTP VERIFICATION           */}
                {/* ─────────────────────────────────── */}
                {step === STEPS.OTP && (
                    <div className="auth-body">
                        <h2 className="auth-heading">Check your email</h2>
                        <p className="auth-desc">
                            We sent a 6-digit code to <strong>{email}</strong>
                        </p>

                        <div className="otp-boxes" onPaste={handleOtpPaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => otpRefs.current[i] = el}
                                    className={`otp-box ${digit ? 'filled' : ''}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                />
                            ))}
                        </div>

                        {error && <p className="auth-error">{error}</p>}

                        <button
                            className="btn btn-primary auth-submit-btn"
                            onClick={handleOtpSubmit}
                            disabled={loading || otp.join('').length < 6}
                        >
                            {loading ? <span className="auth-spinner" /> : 'Verify Code'}
                        </button>

                        <p className="auth-resend">
                            Didn't get a code?{' '}
                            <button
                                className="auth-link"
                                onClick={() => {
                                    const code = requestOtp(email);
                                    addToast(`🔐 New code: ${code}`, 'info', 15000);
                                    setOtp(['', '', '', '', '', '']);
                                    setError('');
                                }}
                            >
                                Resend
                            </button>
                            {' or '}
                            <button className="auth-link" onClick={() => { setStep(STEPS.LOGIN); setError(''); }}>
                                change email
                            </button>
                        </p>
                    </div>
                )}

                {/* ─────────────────────────────────── */}
                {/*  STEP 3: SEED PHRASE (new users)    */}
                {/* ─────────────────────────────────── */}
                {step === STEPS.WALLET && (
                    <div className="auth-body">
                        <h2 className="auth-heading">Your wallet is ready 🎉</h2>
                        <p className="auth-desc">
                            A new self-custodial wallet has been created for you. Save your recovery phrase before continuing.
                        </p>
                        <SeedPhraseCard
                            phrase={mnemonic}
                            onAcknowledged={() => {
                                setCtxStep('done');
                                addToast('✅ Wallet secured! Welcome to SentimentAgent.', 'success');
                            }}
                        />
                    </div>
                )}

                {/* ── Network Badge ── */}
                <div className="auth-network">
                    <span className="status-dot" style={{ display: 'inline-block', marginRight: '6px' }} />
                    Testnet Bradbury
                </div>
            </div>
        </div>
    );
}
