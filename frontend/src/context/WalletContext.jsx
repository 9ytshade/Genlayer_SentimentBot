/**
 * WalletContext.jsx
 * Provides Privy-style embedded wallet state management.
 * - Generates BIP-39 HD wallets from ethers.js
 * - OTP gated via sessionStorage (swap getOtp for API call in production)
 * - Wallet encrypted mnemonic persisted in localStorage per email
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext(null);

// Simple scramble so we're not storing mnemonic in plaintext
function scramble(text, key) {
    return btoa(text.split('').map((c, i) =>
        String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join(''));
}
function unscramble(encoded, key) {
    try {
        const raw = atob(encoded);
        return raw.split('').map((c, i) =>
            String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
        ).join('');
    } catch {
        return null;
    }
}

function storageKey(email) {
    return `sentimentagent_wallet_${btoa(email.toLowerCase().trim())}`;
}

export function WalletProvider({ children }) {
    const [user, setUser] = useState(null);       // { email, walletAddress, isNew }
    const [wallet, setWallet] = useState(null);   // ethers.Wallet instance (in-memory only)
    const [mnemonic, setMnemonic] = useState(''); // shown once during onboarding
    const [step, setStep] = useState('idle');     // idle | email | otp | seedphrase | done

    // ── OTP Generation ──────────────────────────────────────────────────────
    // Returns the 6-digit OTP so the caller can display it (demo mode)
    // In production: replace return value usage with an API call to your email service
    const requestOtp = useCallback((email) => {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        sessionStorage.setItem(`otp_${email}`, JSON.stringify({ otp, expiry }));
        console.info(`[SentimentAgent] OTP for ${email}: ${otp}`);
        return otp; // caller shows this in a toast (demo mode)
    }, []);

    // ── OTP Verification + Wallet Creation ──────────────────────────────────
    const verifyOtp = useCallback(async (email, inputOtp) => {
        const raw = sessionStorage.getItem(`otp_${email}`);
        if (!raw) throw new Error('No OTP found. Please request a new code.');

        const { otp, expiry } = JSON.parse(raw);
        if (Date.now() > expiry) {
            sessionStorage.removeItem(`otp_${email}`);
            throw new Error('OTP expired. Please request a new code.');
        }
        if (otp !== inputOtp.trim()) {
            throw new Error('Incorrect verification code. Please try again.');
        }

        sessionStorage.removeItem(`otp_${email}`);

        // Check if wallet already exists for this email
        const key = storageKey(email);
        const existing = localStorage.getItem(key);
        let ethWallet;
        let isNew = false;

        if (existing) {
            // Returning user — restore wallet from stored mnemonic
            const recoveredMnemonic = unscramble(existing, email.toLowerCase().trim());
            if (!recoveredMnemonic) throw new Error('Could not restore wallet. Storage may be corrupted.');
            ethWallet = ethers.Wallet.fromPhrase(recoveredMnemonic);
        } else {
            // New user — create fresh BIP-39 wallet
            ethWallet = ethers.Wallet.createRandom();
            const phrase = ethWallet.mnemonic.phrase;
            localStorage.setItem(key, scramble(phrase, email.toLowerCase().trim()));
            setMnemonic(phrase);
            isNew = true;
        }

        setWallet(ethWallet);
        setUser({ email, walletAddress: ethWallet.address, isNew });
        return { isNew, address: ethWallet.address };
    }, []);

    // ── Sign Transaction (for future on-chain use) ──────────────────────────
    const signTransaction = useCallback(async (txData) => {
        if (!wallet) throw new Error('No wallet connected');
        return wallet.signTransaction(txData);
    }, [wallet]);

    // ── Logout ──────────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        setUser(null);
        setWallet(null);
        setMnemonic('');
        setStep('idle');
    }, []);

    return (
        <WalletContext.Provider value={{
            user, wallet, mnemonic, step, setStep,
            requestOtp, verifyOtp, signTransaction, logout
        }}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error('useWallet must be used inside <WalletProvider>');
    return ctx;
}
