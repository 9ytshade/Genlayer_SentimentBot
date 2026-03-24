# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from genlayer.gl.vm import UserError
import json

# ─── Storage-compatible struct stored as JSON string ───────────────────────────
# SentimentScore: {score: int(-100..100), label: str, confidence: int(0..100), source: str, block_number: int}

SUPPORTED_ASSETS_DEFAULT = ["BTC", "ETH", "SOL", "BNB", "ADA", "XRP", "DOT", "DOGE"]
WHITELISTED_DOMAINS_DEFAULT = ["cryptopanic.com", "reddit.com", "coingecko.com", "coindesk.com"]

SOURCE_URLS = {
    "BTC": [
        "https://cryptopanic.com/news/bitcoin/",
        "https://www.reddit.com/r/Bitcoin/.json?limit=10&sort=hot",
        "https://coindesk.com/tag/bitcoin/",
    ],
    "ETH": [
        "https://cryptopanic.com/news/ethereum/",
        "https://www.reddit.com/r/ethereum/.json?limit=10&sort=hot",
        "https://coindesk.com/tag/ethereum/",
    ],
    "SOL": [
        "https://cryptopanic.com/news/solana/",
        "https://www.reddit.com/r/solana/.json?limit=10&sort=hot",
    ],
    "BNB": [
        "https://cryptopanic.com/news/bnb/",
        "https://www.reddit.com/r/bnbchainofficial/.json?limit=10&sort=hot",
    ],
    "ADA": [
        "https://cryptopanic.com/news/cardano/",
        "https://www.reddit.com/r/cardano/.json?limit=10&sort=hot",
        "https://coindesk.com/tag/cardano/",
    ],
    "XRP": [
        "https://cryptopanic.com/news/xrp/",
        "https://www.reddit.com/r/XRP/.json?limit=10&sort=hot",
        "https://coindesk.com/tag/xrp/",
    ],
    "DOT": [
        "https://cryptopanic.com/news/polkadot/",
        "https://www.reddit.com/r/dot/.json?limit=10&sort=hot",
    ],
    "DOGE": [
        "https://cryptopanic.com/news/dogecoin/",
        "https://www.reddit.com/r/dogecoin/.json?limit=10&sort=hot",
        "https://coindesk.com/tag/dogecoin/",
    ],
}


class SentimentOracle(gl.Contract):
    # latest sentiment score per asset (JSON-serialised SentimentScore)
    sentiment_scores: TreeMap[str, str]
    # last block number each asset was updated
    last_updated: TreeMap[str, u256]
    # user overrides for sources: address -> JSON dict of {symbol: [urls]}
    user_custom_sources: TreeMap[Address, str]
    # approved source domains (only used for domain-check validation)
    whitelisted_domains: DynArray[str]
    # asset symbols we track
    supported_assets: DynArray[str]
    # contract owner
    owner: Address

    def __init__(self) -> None:
        self.owner = gl.message.sender_address
        for asset in SUPPORTED_ASSETS_DEFAULT:
            self.supported_assets.append(asset)
        for domain in WHITELISTED_DOMAINS_DEFAULT:
            self.whitelisted_domains.append(domain)

    # ── Internal helpers ───────────────────────────────────────────────────────

    def _require_owner(self) -> None:
        if gl.message.sender_address != self.owner:
            raise UserError("Only owner can call this method")

    def _is_supported(self, symbol: str) -> bool:
        for asset in self.supported_assets:
            if asset == symbol:
                return True
        return False

    def _fetch_and_score(self, symbol: str, caller_addr: str) -> str:
        """Non-deterministic: fetch web sources + LLM score → JSON string."""
        
        # Determine URLs to fetch
        urls = []
        user_urls_json = self.user_custom_sources.get(Address(caller_addr), "{}")
        try:
            user_urls = json.loads(user_urls_json)
            if symbol in user_urls and isinstance(user_urls[symbol], list) and len(user_urls[symbol]) > 0:
                urls = user_urls[symbol]
        except Exception:
            pass
            
        if not urls:
            urls = SOURCE_URLS.get(symbol, [])
            
        collected_text = ""
        used_source = "unknown"

        for url in urls[:5]: # Cap at 5 URLs to avoid context window explosion
            try:
                resp = gl.nondet.web.get(url)
                if resp.status == 200 and resp.body:
                    page = resp.body.decode('utf-8', errors='replace')
                else:
                    page = ""
                if page and len(page) > 100:
                    # truncate individual pages to keep total prompt size manageable
                    collected_text += f"\n\n=== Source: {url} ===\n{page[:1000]}"
                    if used_source == "unknown":
                        used_source = url # Track the primary (first successful) source
                    else:
                        used_source += f", {url}" # Append subsequent sources
            except Exception:
                continue

        if not collected_text:
            collected_text = f"No data could be fetched for {symbol} at this time."

        # Step 1 – Numeric score (via prompt_comparative: validators agree within tolerance)
        score_prompt = f"""You are a crypto market sentiment analyst.
Based on the following recent news, articles, and social media content aggregated from multiple sources about {symbol}, 
synthesize a single sentiment score from -100 (extremely bearish) to +100 (extremely bullish).

Combined Source Content:
{collected_text[:5000]}

Rules:
- Read all provided sources to form a holistic view
- Respond with a single integer only (e.g. 42 or -15)
- No explanation, no extra text
- Score must be between -100 and 100"""

        raw_score = gl.nondet.exec_prompt(score_prompt).strip()

        # Step 2 – Sentiment label (via prompt_non_comparative: validators agree on direction)
        def label_task() -> str:
            lp = f"""Based on a sentiment score of {raw_score} for {symbol} cryptocurrency,
classify the market sentiment as exactly one word: bullish, bearish, or neutral.
Respond with only one word."""
            return gl.nondet.exec_prompt(lp).strip().lower()

        raw_label = gl.eq_principle.prompt_non_comparative(
            label_task,
            task=f"Classify sentiment direction for {symbol}",
            criteria="Must return exactly one of: bullish, bearish, neutral. "
                     "Validators must agree on the same directional classification.",
        )

        # Step 3 – Confidence level (via prompt_non_comparative: validators agree on certainty)
        def confidence_task() -> str:
            cp = f"""You are a sentiment analyst. How confident are you in the following assessment?
Asset: {symbol}
Score: {raw_score}
Label: {raw_label}

Rate your confidence from 0 to 100 (integer only, no text)."""
            return gl.nondet.exec_prompt(cp).strip()

        raw_confidence = gl.eq_principle.prompt_non_comparative(
            confidence_task,
            task=f"Assess confidence level for {symbol} sentiment",
            criteria="Must return an integer between 0 and 100. "
                     "Validators should agree within 20 points.",
        )

        result = json.dumps({
            "score": raw_score,
            "label": raw_label,
            "confidence": raw_confidence,
            "source": used_source,
        })
        return result

    # ── Public write methods ───────────────────────────────────────────────────

    @gl.public.write
    def update_sentiment(self, symbol: str) -> None:
        """Fetch latest web sentiment for `symbol` and record it on-chain via consensus."""
        if not self._is_supported(symbol):
            raise UserError(f"Asset {symbol} is not supported")

        caller_str = str(gl.message.sender_address)

        def task() -> str:
            return self._fetch_and_score(symbol, caller_str)

        # Comparative consensus: validators run independently, agree if within tolerance
        result_json = gl.eq_principle.prompt_comparative(
            task,
            principle=f"Both outputs must reflect a similar market sentiment direction for {symbol}. "
                      f"The numeric score may differ by up to 15 points. "
                      f"The label (bullish/bearish/neutral) should match in most cases.",
        )

        # Parse and validate
        data = json.loads(result_json)
        score = int(data.get("score", 0))
        label = data.get("label", "neutral")
        confidence = int(data.get("confidence", 50))
        source = data.get("source", "unknown")

        score = max(-100, min(100, score))
        if label not in ("bullish", "bearish", "neutral"):
            label = "neutral"
        confidence = max(0, min(100, confidence))

        snapshot = json.dumps({
            "score": score,
            "label": label,
            "confidence": confidence,
            "source": source,
            "block_number": gl.block.number,
            "caller": str(gl.message.sender_address),
        })

        self.sentiment_scores[symbol] = snapshot
        self.last_updated[symbol] = gl.block.number

    @gl.public.write
    def update_all_sentiments(self) -> None:
        """Update sentiment for every supported asset."""
        for asset in self.supported_assets:
            self.update_sentiment(asset)

    @gl.public.write
    def add_asset(self, symbol: str) -> None:
        self._require_owner()
        if not self._is_supported(symbol):
            self.supported_assets.append(symbol)

    @gl.public.write
    def add_domain(self, domain: str) -> None:
        self._require_owner()
        self.whitelisted_domains.append(domain)

    @gl.public.write
    def set_custom_sources(self, sources_json: str) -> None:
        """
        Store a JSON mapping of multiple symbols to custom URLs.
        e.g. {"BTC": ["https://custom.com/news"], "ETH": [...]}
        """
        # basic validation
        try:
            parsed = json.loads(sources_json)
        except Exception:
            raise UserError("sources_json must be a valid JSON dictionary")
        if not isinstance(parsed, dict):
            raise UserError("sources_json must be a valid JSON dictionary")
            
        self.user_custom_sources[gl.message.sender_address] = sources_json

    # ── Public view methods ────────────────────────────────────────────────────

    @gl.public.view
    def get_sentiment(self, symbol: str) -> str:
        """Returns JSON string of the latest SentimentScore for `symbol`."""
        if symbol not in self.sentiment_scores:
            return json.dumps({
                "score": 0,
                "label": "neutral",
                "confidence": 0,
                "source": "none",
                "block_number": 0,
                "caller": "none",
                "error": "No data yet — call update_sentiment first",
            })
        return self.sentiment_scores[symbol]

    @gl.public.view
    def get_all_sentiments(self) -> str:
        """Returns JSON array of {symbol, ...SentimentScore} for all assets."""
        results = []
        for asset in self.supported_assets:
            entry = {"symbol": asset}
            if asset in self.sentiment_scores:
                data = json.loads(self.sentiment_scores[asset])
                entry.update(data)
            else:
                entry.update({"score": 0, "label": "neutral", "confidence": 0})
            results.append(entry)
        return json.dumps(results)

    @gl.public.view
    def get_supported_assets(self) -> str:
        return json.dumps(list(self.supported_assets))

    @gl.public.view
    def get_custom_sources(self, user: Address) -> str:
        return self.user_custom_sources.get(user, "{}")

    @gl.public.view
    def get_last_updated(self, symbol: str) -> u256:
        return self.last_updated.get(symbol, u256(0))

    @gl.public.view
    def get_owner(self) -> Address:
        return self.owner
