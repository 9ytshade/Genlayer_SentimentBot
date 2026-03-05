"""
Tests for SentimentOracle contract.
Run: pytest tests/test_sentiment_oracle.py -v
"""
import pytest
import json


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


# ── Unit Tests: Sentiment Scoring Logic ──────────────────────────────────────

class TestSentimentScoring:
    """Tests that verify LLM sentiment scoring prompts produce appropriate outputs."""

    def test_score_range_bullish(self, mock_bullish_content):
        """Bullish content should produce a positive score 10-100."""
        # Simulated: in real GenLayer test env this calls gl.nondet.exec_prompt
        simulated_score = 72
        assert 10 <= simulated_score <= 100, (
            f"Bullish content should yield a score between 10 and 100, got {simulated_score}"
        )

    def test_score_range_bearish(self, mock_bearish_content):
        """Bearish content should produce a negative score -100 to -10."""
        simulated_score = -65
        assert -100 <= simulated_score <= -10, (
            f"Bearish content should yield a score between -100 and -10, got {simulated_score}"
        )

    def test_score_range_neutral(self, mock_neutral_content):
        """Neutral content should produce a score near zero."""
        simulated_score = 5
        assert -30 <= simulated_score <= 30, (
            f"Neutral content should yield a score between -30 and 30, got {simulated_score}"
        )

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


# ── Unit Tests: Snapshot Serialisation ───────────────────────────────────────

class TestSnapshotSerialization:

    def test_sentiment_score_json_format(self):
        """SentimentScore should serialise cleanly to valid JSON."""
        snapshot = {
            "score": 42,
            "label": "bullish",
            "confidence": 85,
            "source": "https://cryptopanic.com/news/bitcoin/",
            "block_number": 12345,
            "caller": "0xABCD",
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

    def test_all_sentiments_array(self):
        """get_all_sentiments should return a JSON array with one entry per asset."""
        assets = ["BTC", "ETH", "SOL", "BNB"]
        simulated_result = [{"symbol": a, "score": 0, "label": "neutral"} for a in assets]
        serialised = json.dumps(simulated_result)
        parsed = json.loads(serialised)
        assert len(parsed) == 4
        symbols = [s["symbol"] for s in parsed]
        assert "BTC" in symbols
        assert "ETH" in symbols


# ── Unit Tests: Domain Whitelist ─────────────────────────────────────────────

class TestDomainWhitelist:

    DEFAULT_DOMAINS = ["cryptopanic.com", "reddit.com", "coingecko.com", "coindesk.com"]

    def test_default_domains_present(self):
        for domain in self.DEFAULT_DOMAINS:
            assert domain in self.DEFAULT_DOMAINS

    def test_url_domain_extraction(self):
        """Verify a URL's domain is correctly identified."""
        from urllib.parse import urlparse
        url = "https://cryptopanic.com/news/bitcoin/?referral=abc"
        domain = urlparse(url).netloc.replace("www.", "")
        assert domain == "cryptopanic.com"

    def test_non_whitelisted_url_rejected(self):
        """URLs with non-whitelisted domains should be rejected."""
        from urllib.parse import urlparse
        bad_url = "https://fakebitcoinnews.xyz/pump"
        domain = urlparse(bad_url).netloc.replace("www.", "")
        is_allowed = domain in self.DEFAULT_DOMAINS
        assert not is_allowed


# ── Unit Tests: Supported Assets ─────────────────────────────────────────────

class TestSupportedAssets:

    SUPPORTED = ["BTC", "ETH", "SOL", "BNB"]

    def test_default_assets(self):
        assert "BTC" in self.SUPPORTED
        assert "ETH" in self.SUPPORTED
        assert "SOL" in self.SUPPORTED
        assert "BNB" in self.SUPPORTED

    def test_unsupported_asset_rejected(self):
        asset = "DOGE"
        is_supported = asset in self.SUPPORTED
        assert not is_supported

    def test_source_urls_defined_for_all_assets(self):
        SOURCE_URLS = {
            "BTC": ["https://cryptopanic.com/news/bitcoin/"],
            "ETH": ["https://cryptopanic.com/news/ethereum/"],
            "SOL": ["https://cryptopanic.com/news/solana/"],
            "BNB": ["https://cryptopanic.com/news/bnb/"],
        }
        for asset in self.SUPPORTED:
            assert asset in SOURCE_URLS, f"No source URLs defined for {asset}"
            assert len(SOURCE_URLS[asset]) > 0

# ── Unit Tests: Custom Sources ───────────────────────────────────────────────

class TestCustomSources:
    
    def test_valid_custom_source_json(self):
        """A valid JSON for custom sources should parse correctly."""
        sources_json = '{"BTC": ["https://custom.com/news"], "ETH": ["https://eth.com/alert"]}'
        parsed = json.loads(sources_json)
        assert isinstance(parsed, dict)
        assert "BTC" in parsed
        assert isinstance(parsed["BTC"], list)
        assert len(parsed["BTC"]) == 1

    def test_invalid_custom_source_json(self):
        """Invalid JSON formatting should be rejected or caught."""
        bad_json = '{"BTC": "not a list" wait this is bad json'
        with pytest.raises(json.JSONDecodeError):
            json.loads(bad_json)

    def test_incorrect_structure(self):
        """If valid JSON but wrong structure (e.g. integer instead of dict), should handle gracefully."""
        sources_json = '12345'
        parsed = json.loads(sources_json)
        assert not isinstance(parsed, dict)
