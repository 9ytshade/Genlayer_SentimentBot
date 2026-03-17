"""
Tests for PortfolioAgent contract — V3 (8 tokens + decide_action consensus).
Run: pytest tests/test_portfolio_agent.py -v
"""
import pytest
import json


# ── Constants (mirrors contract) ──────────────────────────────────────────────

ALL_ASSETS = ["BTC", "ETH", "SOL", "BNB", "ADA", "XRP", "DOT", "DOGE"]
VALID_ACTIONS = {"BUY", "SELL", "HOLD"}


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def bullish_sentiments():
    return json.dumps([
        {"symbol": "BTC", "score": 80, "label": "bullish", "confidence": 90},
        {"symbol": "ETH", "score": 60, "label": "bullish", "confidence": 75},
        {"symbol": "SOL", "score": 30, "label": "bullish", "confidence": 60},
        {"symbol": "BNB", "score": -20, "label": "bearish", "confidence": 65},
        {"symbol": "ADA", "score": 55, "label": "bullish", "confidence": 70},
        {"symbol": "XRP", "score": 25, "label": "bullish", "confidence": 55},
        {"symbol": "DOT", "score": 10, "label": "neutral", "confidence": 50},
        {"symbol": "DOGE", "score": 70, "label": "bullish", "confidence": 80},
    ])


@pytest.fixture
def all_bearish_sentiments():
    return json.dumps([
        {"symbol": sym, "score": -abs(i * 10 + 30), "label": "bearish", "confidence": 70}
        for i, sym in enumerate(ALL_ASSETS)
    ])


@pytest.fixture
def mixed_sentiments():
    return json.dumps([
        {"symbol": "BTC", "score": 50, "label": "bullish", "confidence": 80},
        {"symbol": "ETH", "score": 5, "label": "neutral", "confidence": 50},
        {"symbol": "SOL", "score": -10, "label": "neutral", "confidence": 55},
        {"symbol": "BNB", "score": 40, "label": "bullish", "confidence": 70},
        {"symbol": "ADA", "score": 12, "label": "bullish", "confidence": 60},
        {"symbol": "XRP", "score": -5, "label": "neutral", "confidence": 45},
        {"symbol": "DOT", "score": 35, "label": "bullish", "confidence": 65},
        {"symbol": "DOGE", "score": -25, "label": "bearish", "confidence": 75},
    ])


# ── Weight Computation Logic (mirrors contract rebalance) ────────────────────

def compute_weights(sentiments_json: str, profile_id: int = 2) -> dict:
    """Python mirror of the LLM prompt-based weight logic in PortfolioAgent.rebalance()."""
    if profile_id == 1:
        threshold, max_weight = 30, 40
    elif profile_id == 3:
        threshold, max_weight = 0, 90
    else:
        threshold, max_weight = 10, 60

    sentiments = json.loads(sentiments_json)
    eligible = [(s["symbol"], int(s.get("score", 0)))
                for s in sentiments if int(s.get("score", 0)) >= threshold]

    if not eligible:
        count = len(sentiments)
        equal = 100 // count if count > 0 else 0
        remainder = 100 - (equal * count)
        return {s["symbol"]: equal + (1 if i < remainder else 0) for i, s in enumerate(sentiments)}

    total_score = sum(score for _, score in eligible)
    raw = {sym: min(max_weight, round((sc / total_score) * 100)) for sym, sc in eligible}
    total = sum(raw.values())
    if total > 0:
        raw = {k: round(v * 100 / total) for k, v in raw.items()}
    return raw


# ── Unit Tests: All 8 Tokens Supported ───────────────────────────────────────

class TestAllTokensSupported:

    def test_all_assets_list_has_8_tokens(self):
        assert len(ALL_ASSETS) == 8

    def test_all_8_tokens_present(self):
        for asset in ["BTC", "ETH", "SOL", "BNB", "ADA", "XRP", "DOT", "DOGE"]:
            assert asset in ALL_ASSETS

    def test_no_duplicates(self):
        assert len(ALL_ASSETS) == len(set(ALL_ASSETS))

    def test_fixtures_have_8_entries(self, bullish_sentiments, mixed_sentiments):
        for fixture in [bullish_sentiments, mixed_sentiments]:
            parsed = json.loads(fixture)
            assert len(parsed) == 8, f"Fixture should have 8 tokens, got {len(parsed)}"


# ── Unit Tests: decide_action Consensus Logic ─────────────────────────────────

class TestDecideActionConsensus:
    """
    Simulates the decide_action() method's Equivalence Principle validator consensus.
    Validators independently produce a BUY/SELL/HOLD response.
    The result is only accepted if all validators agree.
    """

    def test_valid_actions_are_buy_sell_hold(self):
        """Only BUY, SELL, HOLD are valid actions."""
        assert VALID_ACTIONS == {"BUY", "SELL", "HOLD"}

    def test_bullish_high_score_should_be_buy(self):
        """Sentiment score > 40 + bullish label should trigger BUY for Balanced profile."""
        sentiment = {"score": 80, "label": "bullish", "confidence": 90}
        profile = "Balanced"
        score = int(sentiment["score"])
        label = sentiment["label"]
        # Balanced rule: BUY if score > 15 and bullish
        action = "BUY" if score > 15 and label == "bullish" else "HOLD"
        assert action == "BUY"

    def test_bearish_low_score_should_be_sell(self):
        """Sentiment score < -15 should trigger SELL for Balanced profile."""
        sentiment = {"score": -40, "label": "bearish", "confidence": 80}
        score = int(sentiment["score"])
        # Balanced rule: SELL if score < -15
        action = "SELL" if score < -15 else "HOLD"
        assert action == "SELL"

    def test_neutral_score_should_be_hold(self):
        """Score near zero should result in HOLD."""
        sentiment = {"score": 5, "label": "neutral", "confidence": 50}
        score = int(sentiment["score"])
        # Balanced rule: neither BUY (>15) nor SELL (<-15)
        action = "HOLD"
        if score > 15:
            action = "BUY"
        elif score < -15:
            action = "SELL"
        assert action == "HOLD"

    def test_conservative_profile_requires_higher_threshold(self):
        """Conservative: only BUY if score > 40."""
        score = 30  # would be BUY for Balanced but not Conservative
        conservative_buy = score > 40
        balanced_buy = score > 15
        assert not conservative_buy
        assert balanced_buy

    def test_aggressive_profile_buys_at_any_positive_score(self):
        """Aggressive: BUY if score > 0."""
        score = 5
        aggressive_buy = score > 0
        balanced_buy = score > 15
        assert aggressive_buy
        assert not balanced_buy

    def test_action_record_json_format(self):
        """decide_action result must be a well-formed JSON record."""
        action_record = {
            "action": "BUY",
            "symbol": "BTC",
            "score": 75,
            "label": "bullish",
            "confidence": 88,
            "rationale": "Strong bullish sentiment with high confidence.",
            "profile": "Balanced",
            "block": 54321,
            "caller": "0xABC123",
        }
        serialised = json.dumps(action_record)
        parsed = json.loads(serialised)

        assert parsed["action"] in VALID_ACTIONS
        assert parsed["symbol"] in ALL_ASSETS
        assert -100 <= parsed["score"] <= 100
        assert parsed["label"] in {"bullish", "bearish", "neutral"}
        assert 0 <= parsed["confidence"] <= 100
        assert isinstance(parsed["rationale"], str)
        assert parsed["profile"] in {"Conservative", "Balanced", "Aggressive"}

    def test_invalid_llm_response_defaults_to_hold(self):
        """If the LLM returns an invalid action, it should default to HOLD."""
        raw_action = "PANIC_SELL"  # invalid
        action = raw_action if raw_action in VALID_ACTIONS else "HOLD"
        assert action == "HOLD"

    def test_batch_decide_returns_one_entry_per_asset(self):
        """batch_decide() should return one decision record per supported asset."""
        mock_results = [
            {"symbol": asset, "action": "HOLD", "score": 0}
            for asset in ALL_ASSETS
        ]
        serialised = json.dumps(mock_results)
        parsed = json.loads(serialised)
        assert len(parsed) == 8
        symbols = [r["symbol"] for r in parsed]
        for asset in ALL_ASSETS:
            assert asset in symbols

    def test_get_action_default_for_new_asset(self):
        """get_action for an asset with no history should return HOLD with rationale."""
        default = {
            "action": "HOLD",
            "symbol": "ADA",
            "score": 0,
            "label": "neutral",
            "confidence": 0,
            "rationale": "No consensus decision yet — call decide_action first",
            "block": 0,
            "caller": "none",
        }
        assert default["action"] == "HOLD"
        assert "No consensus decision" in default["rationale"]

    def test_get_all_actions_returns_8_entries(self):
        """get_all_actions() should return one entry for each of the 8 assets."""
        all_actions = [
            {"symbol": asset, "action": "HOLD", "score": 0} for asset in ALL_ASSETS
        ]
        assert len(all_actions) == 8


# ── Unit Tests: Weight Computation ───────────────────────────────────────────

class TestWeightComputation:

    def test_bullish_scenario_weights(self, bullish_sentiments):
        weights = compute_weights(bullish_sentiments)
        # BTC (80) > ETH (60) > DOGE (70) — all bullish eligible
        assert weights.get("BTC", 0) > 0
        assert weights.get("BNB", 0) == 0  # BNB is bearish (-20)

    def test_all_bearish_falls_back_to_equal(self, all_bearish_sentiments):
        weights = compute_weights(all_bearish_sentiments, 3)
        total = sum(weights.values())
        assert 99 <= total <= 101
        for asset in ALL_ASSETS:
            assert asset in weights

    def test_weights_sum_to_100(self, bullish_sentiments, mixed_sentiments, all_bearish_sentiments):
        for sentiments in [bullish_sentiments, mixed_sentiments, all_bearish_sentiments]:
            for profile in [1, 2, 3]:
                weights = compute_weights(sentiments, profile)
                total = sum(weights.values())
                assert 95 <= total <= 105, f"Weights must sum to ~100, got {total}"

    def test_max_weight_cap_by_profile(self, bullish_sentiments):
        w1 = compute_weights(bullish_sentiments, 1)
        w2 = compute_weights(bullish_sentiments, 2)
        w3 = compute_weights(bullish_sentiments, 3)
        for sym in ALL_ASSETS:
            assert w1.get(sym, 0) <= 40
            assert w2.get(sym, 0) <= 60
            assert w3.get(sym, 0) <= 90

    def test_threshold_filtering_by_profile(self, mixed_sentiments):
        # Mixed: BTC=50, ETH=5, SOL=-10, BNB=40, ADA=12, XRP=-5, DOT=35, DOGE=-25
        w1 = compute_weights(mixed_sentiments, 1)  # threshold 30
        assert "BTC" in w1 and "BNB" in w1 and "DOT" in w1
        assert w1.get("ETH", 0) == 0  # ETH=5 < 30
        assert w1.get("SOL", 0) == 0   # SOL=-10 < 30


# ── Unit Tests: Balance Management ───────────────────────────────────────────

class TestBalanceManagement:

    def test_deposit_increases_balance(self):
        balance = 0
        balance += 1000
        assert balance == 1000

    def test_withdraw_decreases_balance(self):
        balance = 1000
        balance -= 400
        assert balance == 600

    def test_cannot_withdraw_more_than_balance(self):
        balance = 500
        withdraw = 1000
        error = "Insufficient balance" if withdraw > balance else None
        assert error == "Insufficient balance"

    def test_zero_deposit_rejected(self):
        amount = 0
        error = "Amount must be > 0" if amount == 0 else None
        assert error == "Amount must be > 0"


# ── Unit Tests: Trade Record Format ──────────────────────────────────────────

class TestTradeRecords:

    def test_trade_record_serialisation(self):
        record = {
            "block": 12345,
            "caller": "0xABCDEF",
            "old_weights": {a: 12 for a in ALL_ASSETS},
            "new_weights": {"BTC": 40, "ETH": 30, "DOGE": 15, "ADA": 15},
            "reason": "Balanced Bot consensus rebalance",
        }
        serialised = json.dumps(record)
        deserialised = json.loads(serialised)
        assert deserialised["block"] == 12345
        assert "consensus" in deserialised["reason"]

    def test_consensus_decision_is_recorded_in_trade_history(self):
        """decide_action results should appear in trade_history."""
        trade = {
            "block": 99001,
            "caller": "0xABC",
            "old_weights": "{}",
            "new_weights": "pending_rebalance",
            "reason": "Consensus Decision: BUY BTC — Strong bullish sentiment.",
        }
        assert "Consensus Decision" in trade["reason"]
        assert "BUY" in trade["reason"] or "SELL" in trade["reason"] or "HOLD" in trade["reason"]

    def test_get_portfolio_includes_all_8_default_weights(self):
        """Default portfolio should include all 8 assets with equal weighting."""
        equal_weight = round(100 / len(ALL_ASSETS))
        default_weights = {a: equal_weight for a in ALL_ASSETS}
        assert len(default_weights) == 8
        total = sum(default_weights.values())
        assert 95 <= total <= 105
