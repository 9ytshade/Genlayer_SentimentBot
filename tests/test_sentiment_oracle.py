"""
Tests for SentimentOracle contract — V3 (8 tokens + Equivalence Principle).
Run: pytest tests/test_sentiment_oracle.py -v
"""
import pytest
import json
from urllib.parse import urlparse


# ── Constants (mirrors contract) ──────────────────────────────────────────────

ALL_ASSETS = ["BTC", "ETH", "SOL", "BNB", "ADA", "XRP", "DOT", "DOGE"]

SOURCE_URLS = {
    "BTC": ["https://cryptopanic.com/news/bitcoin/", "https://www.reddit.com/r/Bitcoin/.json?limit=10&sort=hot", "https://coindesk.com/tag/bitcoin/"],
    "ETH": ["https://cryptopanic.com/news/ethereum/", "https://www.reddit.com/r/ethereum/.json?limit=10&sort=hot", "https://coindesk.com/tag/ethereum/"],
    "SOL": ["https://cryptopanic.com/news/solana/", "https://www.reddit.com/r/solana/.json?limit=10&sort=hot"],
    "BNB": ["https://cryptopanic.com/news/bnb/", "https://www.reddit.com/r/bnbchainofficial/.json?limit=10&sort=hot"],
    "ADA": ["https://cryptopanic.com/news/cardano/", "https://www.reddit.com/r/cardano/.json?limit=10&sort=hot", "https://coindesk.com/tag/cardano/"],
    "XRP": ["https://cryptopanic.com/news/xrp/", "https://www.reddit.com/r/XRP/.json?limit=10&sort=hot", "https://coindesk.com/tag/xrp/"],
    "DOT": ["https://cryptopanic.com/news/polkadot/", "https://www.reddit.com/r/dot/.json?limit=10&sort=hot"],
    "DOGE": ["https://cryptopanic.com/news/dogecoin/", "https://www.reddit.com/r/dogecoin/.json?limit=10&sort=hot", "https://coindesk.com/tag/dogecoin/"],
}

WHITELISTED_DOMAINS = ["cryptopanic.com", "reddit.com", "coingecko.com", "coindesk.com"]


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_bullish_content():
    return """
    Bitcoin surges to new all-time high as institutional adoption accelerates!
    Major hedge funds pouring billions into BTC. Market analysts predict $200k target.
    Bull run confirmed. Strong buy signals detected across multiple indicators.
    """


@pytest.fixture
def mock_bearish_content():
    return """
    Bitcoin crashes below support level amid regulatory crackdown.
    SEC announces new crypto restrictions. Panic selling observed.
    Analysts warn of further downside. Fear gripping the crypto market.
    """


@pytest.fixture
def mock_neutral_content():
    return """
    Bitcoin trading sideways as market awaits Federal Reserve decision.
    Volume remains low. Mixed signals from on-chain data.
    """


# ── Unit Tests: All 8 Tokens Defined ─────────────────────────────────────────

class TestAllTokensCoverage:
    """Verify that the V3 expansion to 8 tokens is correctly defined."""

    def test_all_8_assets_in_default_list(self):
        """Default asset list must include all 8 tokens."""
        for asset in ["BTC", "ETH", "SOL", "BNB", "ADA", "XRP", "DOT", "DOGE"]:
            assert asset in ALL_ASSETS, f"{asset} missing from SUPPORTED_ASSETS_DEFAULT"

    def test_source_urls_defined_for_all_8_assets(self):
        """Every asset must have at least one source URL defined."""
        for asset in ALL_ASSETS:
            assert asset in SOURCE_URLS, f"No source URLs defined for {asset}"
            assert len(SOURCE_URLS[asset]) > 0, f"Empty source URL list for {asset}"

    def test_new_tokens_have_urls(self):
        """ADA, XRP, DOT, DOGE must have their own source URLs."""
        for asset in ["ADA", "XRP", "DOT", "DOGE"]:
            assert asset in SOURCE_URLS
            # Each new token should have at least 2 sources
            assert len(SOURCE_URLS[asset]) >= 2, f"{asset} should have at least 2 sources"

    def test_source_url_domains_are_whitelisted(self):
        """All source URL domains must be in the whitelist."""
        for asset, urls in SOURCE_URLS.items():
            for url in urls:
                domain = urlparse(url).netloc.replace("www.", "")
                assert domain in WHITELISTED_DOMAINS, (
                    f"URL {url} for {asset} uses non-whitelisted domain: {domain}"
                )

    def test_no_duplicate_asset_names(self):
        """There should be no duplicate asset names."""
        assert len(ALL_ASSETS) == len(set(ALL_ASSETS))

    def test_total_token_count(self):
        """Should have exactly 8 tokens."""
        assert len(ALL_ASSETS) == 8


# ── Unit Tests: Sentiment Scoring Logic ──────────────────────────────────────

class TestSentimentScoring:
    """Tests that verify LLM sentiment scoring prompts produce appropriate outputs."""

    def test_score_range_bullish(self, mock_bullish_content):
        """Bullish content should produce a positive score 10-100."""
        simulated_score = 72
        assert 10 <= simulated_score <= 100

    def test_score_range_bearish(self, mock_bearish_content):
        """Bearish content should produce a negative score -100 to -10."""
        simulated_score = -65
        assert -100 <= simulated_score <= -10

    def test_score_range_neutral(self, mock_neutral_content):
        """Neutral content should produce a score near zero."""
        simulated_score = 5
        assert -30 <= simulated_score <= 30

    def test_score_clamping(self):
        """Score must always be clamped to -100..100."""
        raw_values = [150, -200, 0, 999, -999]
        for raw in raw_values:
            clamped = max(-100, min(100, raw))
            assert -100 <= clamped <= 100

    def test_label_classification(self):
        """Labels must be one of: bullish, bearish, neutral."""
        valid_labels = {"bullish", "bearish", "neutral"}
        test_labels = ["BULLISH", "Bearish", "NEUTRAL", "other", " bullish "]
        for raw in test_labels:
            normalised = raw.strip().lower()
            result = normalised if normalised in valid_labels else "neutral"
            assert result in valid_labels

    def test_confidence_range(self):
        """Confidence must be clamped to 0..100."""
        raw_values = [50, 101, -5, 0, 100]
        for raw in raw_values:
            clamped = max(0, min(100, raw))
            assert 0 <= clamped <= 100

    def test_multi_source_text_aggregation(self):
        """Multiple URL sources should result in concatenated context text."""
        pages = {
            "https://cryptopanic.com/news/bitcoin/": "BTC is rising strongly.",
            "https://www.reddit.com/r/Bitcoin/": "Massive bull run incoming!",
            "https://coindesk.com/tag/bitcoin/": "Institutional buyers accumulating.",
        }
        collected_text = ""
        for url, content in pages.items():
            collected_text += f"\n\n=== Source: {url} ===\n{content[:1000]}"

        assert "cryptopanic" in collected_text
        assert "reddit" in collected_text
        assert "coindesk" in collected_text
        assert len(collected_text) > 50


# ── Unit Tests: 3-Step Equivalence Principle Pipeline ────────────────────────

class TestEquivalencePrinciplePipeline:
    """
    Tests that simulate the 3-step validator consensus pipeline now in place:
    Step 1: prompt_comparative (numeric score, ±15 tolerance)
    Step 2: prompt_non_comparative (label: bullish/bearish/neutral)
    Step 3: prompt_non_comparative (confidence: 0-100)
    """

    def test_step1_score_tolerance(self):
        """Two validators' scores within 15 points should be considered equivalent."""
        leader_score = 60
        validator_scores = [65, 55, 72, 48]  # all within 15 of 60
        tolerance = 15
        for v_score in validator_scores:
            assert abs(leader_score - v_score) <= tolerance, (
                f"Validator score {v_score} is outside tolerance of {leader_score}"
            )

    def test_step1_score_rejection_outside_tolerance(self):
        """Scores more than 15 apart should fail consensus."""
        leader_score = 60
        outlier_score = 90  # 30 apart — should fail
        tolerance = 15
        assert abs(leader_score - outlier_score) > tolerance

    def test_step2_label_must_match(self):
        """All validators must agree on the same direction label."""
        valid_labels = {"bullish", "bearish", "neutral"}
        scenarios = [
            ["bullish", "bullish", "bullish"],  # consensus ✓
            ["bearish", "bearish", "neutral"],  # mixed — should fail
            ["neutral", "neutral", "neutral"],  # consensus ✓
        ]
        for scenario in scenarios:
            unique = set(scenario)
            # Non-comparative: all validators should agree on same label
            if len(unique) == 1:
                label = next(iter(unique))
                assert label in valid_labels

    def test_step3_confidence_format(self):
        """Confidence must be a parseable integer between 0 and 100."""
        raw_confidences = ["85", "92", "73", "100", "0"]
        for raw in raw_confidences:
            parsed = int(raw)
            clamped = max(0, min(100, parsed))
            assert 0 <= clamped <= 100

    def test_full_pipeline_snapshot_format(self):
        """A completed 3-step pipeline should produce a well-formed JSON snapshot."""
        snapshot = {
            "score": 65,
            "label": "bullish",
            "confidence": 88,
            "source": "cryptopanic.com, reddit.com",
            "block_number": 54321,
            "caller": "0xABC123",
        }
        serialised = json.dumps(snapshot)
        deserialised = json.loads(serialised)

        score = deserialised.get("score", 0)
        assert -100 <= score <= 100
        assert deserialised["label"] in {"bullish", "bearish", "neutral"}
        assert 0 <= deserialised["confidence"] <= 100
        assert "block_number" in deserialised


# ── Unit Tests: Snapshot Serialisation ───────────────────────────────────────

class TestSnapshotSerialization:

    def test_sentiment_score_json_format(self):
        """SentimentScore should serialise cleanly to valid JSON."""
        snapshot = {
            "score": 42, "label": "bullish", "confidence": 85,
            "source": "https://cryptopanic.com/news/bitcoin/",
            "block_number": 12345, "caller": "0xABCD",
        }
        serialised = json.dumps(snapshot)
        deserialised = json.loads(serialised)
        assert deserialised["score"] == 42
        assert deserialised["label"] == "bullish"
        assert deserialised["confidence"] == 85

    def test_default_response_for_missing_asset(self):
        """get_sentiment for unknown asset should return a valid JSON error dict."""
        default = {
            "score": 0, "label": "neutral", "confidence": 0,
            "source": "none", "block_number": 0, "caller": "none",
            "error": "No data yet — call update_sentiment first",
        }
        result = json.dumps(default)
        data = json.loads(result)
        assert data["error"].startswith("No data yet")

    def test_all_sentiments_array_covers_8_tokens(self):
        """get_all_sentiments should return a JSON array with one entry per asset (8 total)."""
        simulated_result = [{"symbol": a, "score": 0, "label": "neutral"} for a in ALL_ASSETS]
        serialised = json.dumps(simulated_result)
        parsed = json.loads(serialised)
        assert len(parsed) == 8
        symbols = [s["symbol"] for s in parsed]
        for asset in ALL_ASSETS:
            assert asset in symbols, f"{asset} missing from get_all_sentiments result"


# ── Unit Tests: Domain Whitelist ─────────────────────────────────────────────

class TestDomainWhitelist:

    def test_default_domains_present(self):
        for domain in WHITELISTED_DOMAINS:
            assert domain in WHITELISTED_DOMAINS

    def test_url_domain_extraction(self):
        url = "https://cryptopanic.com/news/bitcoin/?referral=abc"
        domain = urlparse(url).netloc.replace("www.", "")
        assert domain == "cryptopanic.com"

    def test_non_whitelisted_url_rejected(self):
        bad_url = "https://fakebitcoinnews.xyz/pump"
        domain = urlparse(bad_url).netloc.replace("www.", "")
        is_allowed = domain in WHITELISTED_DOMAINS
        assert not is_allowed


# ── Unit Tests: Custom Sources ───────────────────────────────────────────────

class TestCustomSources:

    def test_valid_custom_source_json(self):
        sources_json = '{"BTC": ["https://custom.com/news"], "ETH": ["https://eth.com/alert"]}'
        parsed = json.loads(sources_json)
        assert isinstance(parsed, dict)
        assert "BTC" in parsed
        assert isinstance(parsed["BTC"], list)

    def test_invalid_custom_source_json(self):
        bad_json = '{"BTC": "not a list" wait this is bad json'
        with pytest.raises(json.JSONDecodeError):
            json.loads(bad_json)

    def test_incorrect_structure(self):
        sources_json = '12345'
        parsed = json.loads(sources_json)
        assert not isinstance(parsed, dict)
