"""
Integration tests: SentimentOracle → PortfolioAgent → SentimentLeaderboard
Run: pytest tests/test_integration.py -v
"""
import pytest
import json


# ─── Simulated contract state ──────────────────────────────────────────────────

class MockSentimentOracle:
    def __init__(self):
        self.sentiment_scores = {
            "BTC": {"score": 72, "label": "bullish", "confidence": 88, "source": "cryptopanic.com", "block_number": 100, "caller": "0xABC"},
            "ETH": {"score": 45, "label": "bullish", "confidence": 70, "source": "reddit.com", "block_number": 100, "caller": "0xABC"},
            "SOL": {"score": -15, "label": "bearish", "confidence": 60, "source": "cryptopanic.com", "block_number": 100, "caller": "0xABC"},
            "BNB": {"score": 5, "label": "neutral", "confidence": 50, "source": "coingecko.com", "block_number": 100, "caller": "0xABC"},
        }
        self.last_updated = {"BTC": 100, "ETH": 100, "SOL": 100, "BNB": 100}

    def get_sentiment(self, symbol: str) -> str:
        if symbol in self.sentiment_scores:
            return json.dumps(self.sentiment_scores[symbol])
        return json.dumps({"error": "No data"})

    def get_all_sentiments(self) -> str:
        results = []
        for symbol, data in self.sentiment_scores.items():
            entry = {"symbol": symbol}
            entry.update(data)
            results.append(entry)
        return json.dumps(results)

    def update_sentiment(self, symbol: str, new_score: int, label: str) -> None:
        """Simulate an oracle update."""
        self.sentiment_scores[symbol] = {
            "score": new_score,
            "label": label,
            "confidence": 80,
            "source": "cryptopanic.com",
            "block_number": 200,
            "caller": "0xDEF",
        }
        self.last_updated[symbol] = 200


class MockPortfolioAgent:
    REBALANCE_THRESHOLD = 10
    MAX_WEIGHT = 60

    def __init__(self, oracle: MockSentimentOracle):
        self.oracle = oracle
        self.balances = {}
        self.portfolio_weights = {}
        self.trade_history = []

    def deposit(self, user: str, amount: int) -> None:
        self.balances[user] = self.balances.get(user, 0) + amount

    def withdraw(self, user: str, amount: int) -> None:
        if self.balances.get(user, 0) < amount:
            raise ValueError("Insufficient balance")
        self.balances[user] -= amount

    def rebalance(self, user: str) -> dict:
        sentiments = json.loads(self.oracle.get_all_sentiments())
        eligible = [(s["symbol"], s["score"]) for s in sentiments if s["score"] >= self.REBALANCE_THRESHOLD]

        if not eligible:
            count = len(sentiments)
            equal = 100 // count
            weights = {s["symbol"]: equal for s in sentiments}
        else:
            total = sum(s for _, s in eligible)
            weights = {}
            for symbol, score in eligible:
                weights[symbol] = min(self.MAX_WEIGHT, round((score / total) * 100))
            total_assigned = sum(weights.values())
            if total_assigned > 0:
                for symbol in weights:
                    weights[symbol] = round(weights[symbol] * 100 / total_assigned)

        old_weights = self.portfolio_weights.get(user, {"BTC": 25, "ETH": 25, "SOL": 25, "BNB": 25})
        self.portfolio_weights[user] = weights
        self.trade_history.append({
            "user": user, "old_weights": old_weights, "new_weights": weights, "block": 200,
        })
        return weights

    def get_portfolio(self, user: str) -> dict:
        return {
            "balance": self.balances.get(user, 0),
            "weights": self.portfolio_weights.get(user, {"BTC": 25, "ETH": 25, "SOL": 25, "BNB": 25}),
        }


class MockSentimentLeaderboard:
    MAX_HISTORY = 50

    def __init__(self):
        self.history = {}
        self.caller_scores = {}
        self.total_snapshots = 0

    def record_snapshot(self, symbol: str, score: int, label: str, caller: str) -> None:
        if symbol not in self.history:
            self.history[symbol] = []
        self.history[symbol].append({"score": score, "label": label, "block": 200, "caller": caller})
        if len(self.history[symbol]) > self.MAX_HISTORY:
            self.history[symbol] = self.history[symbol][-self.MAX_HISTORY:]
        self.caller_scores[caller] = self.caller_scores.get(caller, 0) + 1
        self.total_snapshots += 1

    def get_history(self, symbol: str, limit: int = 10) -> list:
        return self.history.get(symbol, [])[-limit:]

    def get_leaderboard(self) -> list:
        entries = [{"caller": c, "score": s} for c, s in self.caller_scores.items()]
        return sorted(entries, key=lambda x: x["score"], reverse=True)


# ── Integration Tests ──────────────────────────────────────────────────────────

@pytest.fixture
def oracle():
    return MockSentimentOracle()


@pytest.fixture
def agent(oracle):
    return MockPortfolioAgent(oracle)


@pytest.fixture
def leaderboard():
    return MockSentimentLeaderboard()


class TestFullFlow:

    def test_oracle_to_agent_rebalance(self, oracle, agent):
        """Oracle sentiment should drive portfolio rebalancing correctly."""
        user = "0xUSER1"
        agent.deposit(user, 10000)
        weights = agent.rebalance(user)

        # With BTC=72 and ETH=45 bullish, they should dominate
        assert "BTC" in weights
        assert "ETH" in weights
        assert weights["BTC"] >= weights["ETH"], "BTC should have higher or equal weight than ETH"
        # SOL (-15) and BNB (5) are below threshold, should be excluded
        assert weights.get("SOL", 0) == 0
        assert weights.get("BNB", 0) == 0

    def test_trade_history_recorded(self, oracle, agent):
        """Trade history should be recorded after rebalance."""
        user = "0xUSER2"
        agent.deposit(user, 5000)
        assert len(agent.trade_history) == 0
        agent.rebalance(user)
        assert len(agent.trade_history) == 1
        record = agent.trade_history[0]
        assert record["user"] == user
        assert "new_weights" in record
        assert "old_weights" in record

    def test_oracle_update_changes_weights(self, oracle, agent):
        """Updating oracle to bearish should shift weights on next rebalance."""
        user = "0xUSER3"
        agent.deposit(user, 5000)

        # First rebalance with bullish BTC (72)
        weights_before = agent.rebalance(user)
        btc_weight_before = weights_before.get("BTC", 0)

        # Simulate BTC going bearish
        oracle.update_sentiment("BTC", -80, "bearish")
        
        weights_after = agent.rebalance(user)
        btc_weight_after = weights_after.get("BTC", 0)

        assert btc_weight_after < btc_weight_before, (
            "BTC weight should decrease after going bearish"
        )

    def test_leaderboard_records_snapshots(self, oracle, leaderboard):
        """Leaderboard should grow as callers trigger updates."""
        assert leaderboard.total_snapshots == 0

        leaderboard.record_snapshot("BTC", 72, "bullish", "0xALICE")
        leaderboard.record_snapshot("ETH", 45, "bullish", "0xBOB")
        leaderboard.record_snapshot("BTC", 65, "bullish", "0xALICE")

        assert leaderboard.total_snapshots == 3
        history = leaderboard.get_history("BTC", limit=10)
        assert len(history) == 2

    def test_leaderboard_sorted_correctly(self, leaderboard):
        """Leaderboard should sort callers by score descending."""
        leaderboard.record_snapshot("BTC", 50, "bullish", "0xALICE")
        leaderboard.record_snapshot("ETH", 30, "bullish", "0xBOB")
        leaderboard.record_snapshot("SOL", 20, "bullish", "0xALICE")
        leaderboard.record_snapshot("BNB", 10, "bullish", "0xCHARLIE")
        leaderboard.record_snapshot("BTC", 40, "bullish", "0xALICE")

        board = leaderboard.get_leaderboard()
        # 0xALICE called 3 times, 0xBOB 1 time, 0xCHARLIE 1 time
        assert board[0]["caller"] == "0xALICE"
        assert board[0]["score"] == 3

    def test_deposit_withdraw_flow(self, agent):
        """Full deposit → rebalance → withdraw cycle."""
        user = "0xUSER4"
        agent.deposit(user, 2000)
        assert agent.get_portfolio(user)["balance"] == 2000
        agent.rebalance(user)
        agent.withdraw(user, 500)
        assert agent.get_portfolio(user)["balance"] == 1500

    def test_cannot_overdraw(self, agent):
        """Should raise ValueError when withdrawing more than balance."""
        user = "0xUSER5"
        agent.deposit(user, 300)
        with pytest.raises(ValueError, match="Insufficient balance"):
            agent.withdraw(user, 1000)

    def test_history_cap_enforced(self, leaderboard):
        """Leaderboard should cap history at MAX_HISTORY snapshots per symbol."""
        for i in range(60):
            leaderboard.record_snapshot("BTC", i - 30, "neutral", "0xTESTER")
        history = leaderboard.get_history("BTC", limit=100)
        assert len(history) <= 50, "History should be capped at 50 snapshots"
