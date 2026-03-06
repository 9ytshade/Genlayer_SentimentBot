/**
 * GenLayer Sentiment Investment Agent — Deployment Script
 * Target: Testnet Asimov
 * Run: npx ts-node scripts/deploy.ts
 *
 * Requirements: @genlayer/js installed
 *   npm install @genlayer/js
 */

import * as fs from "fs";
import * as path from "path";

// ─── Config ────────────────────────────────────────────────────────────────────

const NETWORK = {
    name: "testnet_asimov",
    rpcUrl: "https://testnet.genlayer.com/api",
    chainId: 42,
};

const CONTRACTS_DIR = path.resolve(__dirname, "../contracts");

// ─── Helpers ────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function readContract(filename: string): string {
    const filePath = path.join(CONTRACTS_DIR, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Contract file not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, "utf-8");
}

function log(emoji: string, msg: string): void {
    console.log(`${emoji}  ${msg}`);
}

// ─── Main Deployment ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("PRIVATE_KEY environment variable is required.\nSet it with: $env:PRIVATE_KEY='your-key-here'");
    }

    log("🚀", `Deploying to ${NETWORK.name} (${NETWORK.rpcUrl})`);
    log("📡", "Initialising GenLayer client...");

    // Dynamic import of genlayer js SDK
    const { createWalletClient, http } = await import("@genlayer/js" as any);

    const client = createWalletClient({
        transport: http(NETWORK.rpcUrl),
        account: { privateKey },
    });

    // ── 1. Deploy SentimentOracle ───────────────────────────────────────────────
    log("📝", "Deploying SentimentOracle...");
    const oracleCode = readContract("SentimentOracle.py");

    const oracleTx = await client.deployContract({
        code: oracleCode,
        args: [],
        leaderAddress: client.account.address,
    });

    log("⏳", `Waiting for SentimentOracle confirmation (tx: ${oracleTx.hash})...`);
    const oracleReceipt = await client.waitForTransactionReceipt({ hash: oracleTx.hash });
    const oracleAddress = oracleReceipt.contractAddress;
    log("✅", `SentimentOracle deployed at: ${oracleAddress}`);
    await sleep(2000);

    // ── 2. Deploy SentimentLeaderboard ─────────────────────────────────────────
    log("📝", "Deploying SentimentLeaderboard...");
    const leaderboardCode = readContract("SentimentLeaderboard.py");

    const leaderboardTx = await client.deployContract({
        code: leaderboardCode,
        args: [oracleAddress],
        leaderAddress: client.account.address,
    });

    log("⏳", `Waiting for SentimentLeaderboard confirmation (tx: ${leaderboardTx.hash})...`);
    const leaderboardReceipt = await client.waitForTransactionReceipt({ hash: leaderboardTx.hash });
    const leaderboardAddress = leaderboardReceipt.contractAddress;
    log("✅", `SentimentLeaderboard deployed at: ${leaderboardAddress}`);
    await sleep(2000);

    // ── 3. Deploy PortfolioAgent ────────────────────────────────────────────────
    log("📝", "Deploying PortfolioAgent...");
    const agentCode = readContract("PortfolioAgent.py");

    const agentTx = await client.deployContract({
        code: agentCode,
        args: [oracleAddress, leaderboardAddress],
        leaderAddress: client.account.address,
    });

    log("⏳", `Waiting for PortfolioAgent confirmation (tx: ${agentTx.hash})...`);
    const agentReceipt = await client.waitForTransactionReceipt({ hash: agentTx.hash });
    const agentAddress = agentReceipt.contractAddress;
    log("✅", `PortfolioAgent deployed at: ${agentAddress}`);

    // ── Save deployment addresses ───────────────────────────────────────────────
    const deployment = {
        network: NETWORK.name,
        deployedAt: new Date().toISOString(),
        contracts: {
            SentimentOracle: oracleAddress,
            SentimentLeaderboard: leaderboardAddress,
            PortfolioAgent: agentAddress,
        },
    };

    const outputPath = path.resolve(__dirname, "../deployment.json");
    fs.writeFileSync(outputPath, JSON.stringify(deployment, null, 2));
    log("💾", `Deployment addresses saved to: ${outputPath}`);

    // ── Summary ─────────────────────────────────────────────────────────────────
    console.log("\n" + "═".repeat(60));
    console.log("🎉  DEPLOYMENT COMPLETE");
    console.log("═".repeat(60));
    console.log(`  SentimentOracle:      ${oracleAddress}`);
    console.log(`  SentimentLeaderboard: ${leaderboardAddress}`);
    console.log(`  PortfolioAgent:       ${agentAddress}`);
    console.log("═".repeat(60));
    console.log("\nNext steps:");
    console.log("  1. Copy addresses from deployment.json into frontend/.env.local");
    console.log("  2. Run: cd frontend && npm run dev");
    console.log("  3. Open http://localhost:5173");
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌  Deployment failed:", err.message);
        process.exit(1);
    });
