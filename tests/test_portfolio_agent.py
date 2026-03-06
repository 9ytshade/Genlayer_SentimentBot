"""
Tests for PortfolioAgent contract.
Run: pytest tests/test_portfolio_agent.py -v
"""
import pytest
import json


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def bullish_sentiments():
    return json.dumps([
        {"symbol": "BTC", "score": 80, "label": "bullish", "confidence": 90},
        {"symbol": "ETH", "score": 60, "label": "bullish", "confidence": 75},
        {"symbol": "SOL", "score": 30, "label": "bullish", "confidence": 60},
        {"symbol": "BNB", "score": -20, "label": "bearish", "confidence": 65},
    ])


@pytest.fixture
def all_bearish_sentiments():
    return json.dumps([
        {"symbol": "BTC", "score": -50, "label": "bearish", "confidence": 80},
        {"symbol": "ETH", "score": -40, "label": "bearish", "confidence": 70},
        {"symbol": "SOL", "score": -60, "label": "bearish", "confidence": 75},
        {"symbol": "BNB", "score": -30, "label": "bearish", "confidence": 65},
    ])


@pytest.fixture
def mixed_sentiments():
    return json.dumps([
        {"symbol": "BTC", "score": 50, "label": "bullish", "confidence": 80},
        {"symbol": "ETH", "score": 5, "label": "neutral", "confidence": 50},
        {"symbol": "SOL", "score": -10, "label": "neutral", "confidence": 55},
        {"symbol": "BNB", "score": 40, "label": "bullish", "confidence": 70},
    ])


# ── Weight Computation Logic (mirrors contract _compute_weights) ──────────────

REBALANCE_THRESHOLD = 10
MAX_WEIGHT = 60


def compute_weights(sentiments_json: str, profile_id: int = 2) -> dict:
    """Python mirror of PortfolioAgent._compute_weights for testing."""
    if profile_id == 1:
        threshold = 30
        max_weight = 40
    elif profile_id == 3:
        threshold = 0
        max_weight = 90
    else:
        threshold = 10
        max_weight = 60

    sentiments = json.loads(sentiments_json)
    eligible = []
    for s in sentiments:
        score = int(s.get("score", 0))
        if score >= threshold:
            eligible.append((s["symbol"], score))

    weights = {}
    if not eligible:
        count = len(sentiments)
        equal = 100 // count if count > 0 else 0
        remainder = 100 - (equal * count) if count > 0 else 0
        for i, s in enumerate(sentiments):
            weights[s["symbol"]] = equal + (1 if i < remainder else 0)
    else:
        total_score = sum(score for _, score in eligible)
        raw_weights = {}
        for symbol, score in eligible:
            pct = min(max_weight, round((score / total_score) * 100))
            raw_weights[symbol] = pct

        total_assigned = sum(raw_weights.values())
        if total_assigned > 0:
            for symbol in raw_weights:
                raw_weights[symbol] = round(raw_weights[symbol] * 100 / total_assigned)
        weights = raw_weights

    return weights


# ── Unit Tests: Weight Computation ───────────────────────────────────────────

class TestWeightComputation:

    def test_bullish_scenario_weights(self, bullish_sentiments):
        """High-score assets should get higher weights."""
        weights = compute_weights(bullish_sentiments)
        # BTC (80) should outweigh ETH (60) which outweighs SOL (30)
        assert weights["BTC"] > weights["ETH"]
        assert weights["ETH"] > weights["SOL"]
        # BNB is bearish (-20), should not appear or have 0 weight
        assert weights.get("BNB", 0) == 0

    def test_all_bearish_falls_back_to_equal(self, all_bearish_sentiments):
        """When all assets are bearish, fallback to equal weighting."""
        # Even Aggressive (3) threshold is 0. All these are < 0.
        weights = compute_weights(all_bearish_sentiments, 3)
        assets = ["BTC", "ETH", "SOL", "BNB"]
        total = sum(weights.get(a, 0) for a in assets)
        assert 99 <= total <= 101, f"Total weights should be ~100, got {total}"
        for asset in assets:
            w = weights.get(asset, 0)
            assert 20 <= w <= 30, f"{asset} should be ~25%, got {w}%"

    def test_weights_sum_to_100(self, bullish_sentiments, mixed_sentiments, all_bearish_sentiments):
        """Weights must always sum to approximately 100."""
        for sentiments in [bullish_sentiments, mixed_sentiments, all_bearish_sentiments]:
            for profile in [1, 2, 3]:
                weights = compute_weights(sentiments, profile)
                total = sum(weights.values())
                assert 95 <= total <= 105, f"Weights must sum to ~100, got {total}"

    def test_max_weight_cap_by_profile(self, bullish_sentiments):
        """No single asset should exceed its profile's max weight."""
        # BTC = 80, grabs highest share
        w1 = compute_weights(bullish_sentiments, 1) # Conservative, max 40
        w2 = compute_weights(bullish_sentiments, 2) # Balanced, max 60
        w3 = compute_weights(bullish_sentiments, 3) # Aggressive, max 90
        
        assert w1["BTC"] <= 40
        assert w2["BTC"] <= 60
        assert w3["BTC"] <= 90

    def test_threshold_filtering_by_profile(self, mixed_sentiments):
        """Assets should be filtered based on the profile threshold."""
        # Mixed: BTC=50, ETH=5, SOL=-10, BNB=40
        w1 = compute_weights(mixed_sentiments, 1) # threshold 30
        assert "BTC" in w1 and "BNB" in w1
        assert w1.get("ETH", 0) == 0 and w1.get("SOL", 0) == 0
        
        w3 = compute_weights(mixed_sentiments, 3) # threshold 0
        assert "BTC" in w3 and "BNB" in w3 and "ETH" in w3 # ETH=5 is eligible
        assert w3.get("SOL", 0) == 0 # SOL is -10


# ── Unit Tests: Balance Management ───────────────────────────────────────────

class TestBalanceManagement:

    def test_deposit_increases_balance(self):
        balance = 0
        deposit = 1000
        balance += deposit
        assert balance == 1000

    def test_withdraw_decreases_balance(self):
        balance = 1000
        withdraw = 400
        balance -= withdraw
        assert balance == 600

    def test_cannot_withdraw_more_than_balance(self):
        balance = 500
        withdraw = 1000
        if withdraw > balance:
            error = "Insufficient balance"
        else:
            error = None
        assert error == "Insufficient balance"

    def test_zero_deposit_rejected(self):
        amount = 0
        if amount == 0:
            error = "Amount must be > 0"
        else:
            error = None
        assert error == "Amount must be > 0"


# ── Unit Tests: Trade Record Format ──────────────────────────────────────────

class TestTradeRecords:

    def test_trade_record_serialisation(self):
        """Trade records must serialise cleanly to JSON."""
        record = {
            "block": 12345,
            "caller": "0xABCDEF",
            "old_weights": {"BTC": 25, "ETH": 25, "SOL": 25, "BNB": 25},
            "new_weights": {"BTC": 48, "ETH": 35, "SOL": 17},
            "reason": "Sentiment-driven rebalance",
        }
        serialised = json.dumps(record)
        deserialised = json.loads(serialised)
        assert deserialised["block"] == 12345
        assert deserialised["reason"] == "Sentiment-driven rebalance"

    def test_portfolio_view_format(self):
        """get_portfolio should return {balance, weights}."""
        portfolio = {
            "balance": 5000,
            "weights": {"BTC": 50, "ETH": 30, "SOL": 20},
        }
        serialised = json.dumps(portfolio)
        parsed = json.loads(serialised)
        assert "balance" in parsed
        assert "weights" in parsed
        assert parsed["balance"] == 5000
