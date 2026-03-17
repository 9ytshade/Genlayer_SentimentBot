# { "Depends": "py-genlayer:test" }
from genlayer import *
from genlayer.gl.vm import UserError
import json

# ─── Portfolio Agent ──────────────────────────────────────────────────────────
# Reads sentiment from SentimentOracle, manages user deposits,
# auto-rebalances portfolio weights based on consensus sentiment scores,
# and records all buy/sell/hold decisions on-chain via Optimistic Democracy.
#
# Network: Testnet Bradbury

REBALANCE_THRESHOLD = 10   # min absolute score to include an asset
MAX_WEIGHT = 60            # max % weight for any single asset

ALL_ASSETS = ["BTC", "ETH", "SOL", "BNB", "ADA", "XRP", "DOT", "DOGE"]


class PortfolioAgent(gl.Contract):
    # oracle_address: address of the deployed SentimentOracle
    oracle_address: Address
    # leaderboard_address: address of the deployed SentimentLeaderboard
    leaderboard_address: Address
    # user balances: address -> amount (in wei-equivalent units)
    balances: TreeMap[Address, u256]
    # portfolio weights per user: address -> JSON string of {symbol: weight_pct}
    portfolio_weights: TreeMap[Address, str]
    # user risk profiles: address -> int (1=Conservative, 2=Balanced, 3=Aggressive)
    user_risk_profiles: TreeMap[Address, int]
    # all trade records as JSON array
    trade_history: DynArray[str]
    # supported assets
    supported_assets: DynArray[str]
    # contract owner
    owner: Address
    # total value locked
    total_deposited: u256
    # consensus-approved buy/sell/hold actions per asset
    asset_actions: TreeMap[str, str]  # symbol -> JSON {action, score, label, block, caller}

    def __init__(self, oracle_address: Address, leaderboard_address: Address) -> None:
        self.owner = gl.message.sender_account
        self.oracle_address = oracle_address
        self.leaderboard_address = leaderboard_address
        self.total_deposited = u256(0)
        for asset in ALL_ASSETS:
            self.supported_assets.append(asset)

    # ── Internal helpers ───────────────────────────────────────────────────────

    def _require_owner(self) -> None:
        if gl.message.sender_account != self.owner:
            raise UserError("Only owner can call this")

    def _get_oracle_sentiments(self) -> str:
        """Read all sentiment scores from the oracle contract."""
        oracle = gl.get_contract_at(self.oracle_address)
        return oracle.view().get_all_sentiments()

    def _compute_weights(self, sentiments_json: str, profile_id: int) -> str:
        """
        Given sentiments JSON array, compute portfolio weights.
        Assets with score >= threshold get proportional positive weight, capped at max_weight.
        Returns JSON {symbol: weight_pct} summing to 100.
        """
        # Risk Profile constraints
        # 1: Conservative (threshold 30, max 40%)
        # 2: Balanced (threshold 10, max 60%)
        # 3: Aggressive (threshold 0, max 90%)
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

        # Collect eligible assets and their positive scores
        eligible = []
        for s in sentiments:
            score = int(s.get("score", 0))
            if score >= threshold:
                eligible.append((s["symbol"], score))

        weights = {}

        if not eligible:
            # Equal weight if no positive sentiment
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

            # Normalise to sum to 100
            total_assigned = sum(raw_weights.values())
            if total_assigned > 0:
                for symbol in raw_weights:
                    raw_weights[symbol] = round(raw_weights[symbol] * 100 / total_assigned)
            weights = raw_weights

        return json.dumps(weights)

    def _record_trade(self, caller: str, old_weights: str, new_weights: str, reason: str) -> None:
        """Append a trade record to history."""
        record = json.dumps({
            "block": gl.block.number,
            "caller": caller,
            "old_weights": old_weights,
            "new_weights": new_weights,
            "reason": reason,
        })
        self.trade_history.append(record)

    # ── Public write methods ───────────────────────────────────────────────────

    @gl.public.write
    def deposit(self, amount: u256) -> None:
        """Deposit `amount` into the portfolio agent."""
        if amount == u256(0):
            raise UserError("Amount must be > 0")
        sender = gl.message.sender_account
        current = self.balances.get(sender, u256(0))
        self.balances[sender] = current + amount
        self.total_deposited = self.total_deposited + amount

    @gl.public.write
    def withdraw(self, amount: u256) -> None:
        """Withdraw `amount` from the portfolio agent."""
        sender = gl.message.sender_account
        current = self.balances.get(sender, u256(0))
        if amount > current:
            raise UserError("Insufficient balance")
        self.balances[sender] = current - amount
        self.total_deposited = self.total_deposited - amount

    @gl.public.write
    def decide_action(self, symbol: str) -> str:
        """
        Optimistic Democracy: Validators independently ask the LLM whether to
        BUY, SELL, or HOLD the given asset based on its current oracle sentiment.
        The result is only committed on-chain if validators reach consensus
        via prompt_non_comparative equivalence principle.

        Returns JSON: {action, score, label, confidence, rationale, block, caller}
        """
        # Read current oracle sentiment for the symbol
        oracle = gl.get_contract_at(self.oracle_address)
        sentiment_json = oracle.view().get_sentiment(symbol)
        sentiment = json.loads(sentiment_json)

        score = int(sentiment.get("score", 0))
        label = sentiment.get("label", "neutral")
        confidence = int(sentiment.get("confidence", 50))
        caller_str = str(gl.message.sender_account)

        # Get user risk profile to influence the decision
        profile_id = self.user_risk_profiles.get(gl.message.sender_account, 2)
        profile_names = {1: "Conservative", 2: "Balanced", 3: "Aggressive"}
        profile_name = profile_names.get(profile_id, "Balanced")

        def action_task() -> str:
            prompt = f"""You are an autonomous crypto portfolio manager operating under an Optimistic Democracy consensus network.

Current market intelligence for {symbol}:
- Sentiment Score: {score} (range: -100 to +100)
- Sentiment Label: {label}
- Confidence Level: {confidence}%
- Investor Risk Profile: {profile_name}

Risk Profile Guidelines:
- Conservative: Only BUY if score > 40 and label is bullish. SELL if score < -20.
- Balanced: BUY if score > 15 and bullish. SELL if score < -15.
- Aggressive: BUY if score > 0. SELL if score < -30.

Task: Based on this data, recommend exactly ONE of these portfolio actions:
- BUY  (increase allocation for this asset)
- SELL (reduce allocation for this asset)  
- HOLD (maintain current allocation)

Respond with a JSON object in this exact format:
{{"action": "BUY", "rationale": "one sentence explanation"}}

Do not include any other text."""
            return gl.nondet.exec_prompt(prompt).strip()

        # Validators independently run the decision and must reach consensus
        decision_json = gl.eq_principle.prompt_non_comparative(
            action_task,
            task=f"Determine portfolio action (BUY/SELL/HOLD) for {symbol}",
            criteria="Validators must agree on the same action word (BUY, SELL, or HOLD). "
                     "Minor differences in rationale wording are acceptable, "
                     "but the core action decision must be unanimous.",
        )

        try:
            decision = json.loads(decision_json)
            action = decision.get("action", "HOLD").upper()
            rationale = decision.get("rationale", "")
        except Exception:
            # Fallback if JSON parse fails
            action = "HOLD"
            rationale = "Could not parse consensus decision"

        if action not in ("BUY", "SELL", "HOLD"):
            action = "HOLD"

        # Record the consensus-approved action on-chain
        action_record = json.dumps({
            "action": action,
            "symbol": symbol,
            "score": score,
            "label": label,
            "confidence": confidence,
            "rationale": rationale,
            "profile": profile_name,
            "block": gl.block.number,
            "caller": caller_str,
        })
        self.asset_actions[symbol] = action_record

        # Also append to trade history
        self._record_trade(
            caller=caller_str,
            old_weights=self.portfolio_weights.get(gl.message.sender_account, "{}"),
            new_weights="pending_rebalance",
            reason=f"Consensus Decision: {action} {symbol} — {rationale}",
        )

        return action_record

    @gl.public.write
    def batch_decide(self) -> str:
        """
        Run decide_action() for every supported asset.
        Returns JSON array of all consensus decisions.
        """
        results = []
        for asset in self.supported_assets:
            try:
                result = self.decide_action(asset)
                results.append(json.loads(result))
            except Exception as e:
                results.append({"symbol": asset, "action": "HOLD", "error": str(e)})
        return json.dumps(results)

    @gl.public.write
    def rebalance(self) -> str:
        """
        Read oracle sentiment, run validator consensus on weight computation,
        store agreed weights on-chain, and return the new weights as JSON.
        """
        sender = str(gl.message.sender_account)

        # Fetch sentiment from oracle
        sentiments_json = self._get_oracle_sentiments()
        profile_id = self.user_risk_profiles.get(gl.message.sender_account, 2)
        profile_names = {1: "Conservative", 2: "Balanced", 3: "Aggressive"}
        profile_name = profile_names.get(profile_id, "Balanced")

        # Wrap weight computation in prompt_comparative so validators must
        # independently agree on the final allocation percentages
        def weights_task() -> str:
            sentiments = json.loads(sentiments_json)
            summary_lines = []
            for s in sentiments:
                summary_lines.append(
                    f"{s['symbol']}: score={s.get('score', 0)}, label={s.get('label', 'neutral')}, confidence={s.get('confidence', 50)}%"
                )
            summary = "\n".join(summary_lines)

            prompt = f"""You are an autonomous portfolio allocation engine.

Risk Profile: {profile_name}
Current market sentiment scores:
{summary}

Rules:
- Conservative: only allocate to assets with score >= 30, max 40% per asset
- Balanced: allocate to assets with score >= 10, max 60% per asset
- Aggressive: allocate to all assets with positive score, max 90% per asset
- Weights must sum to exactly 100
- Only include assets that meet the threshold
- If no asset meets the threshold, distribute equally across all

Return ONLY a JSON object mapping symbol to integer weight percentage, e.g.:
{{"BTC": 45, "ETH": 35, "SOL": 20}}

No other text."""
            return gl.nondet.exec_prompt(prompt).strip()

        new_weights_json = gl.eq_principle.prompt_comparative(
            weights_task,
            task=f"Compute portfolio allocation weights for {profile_name} profile",
            criteria="Validators must agree on asset allocations within 10 percentage points per asset. "
                     "The same assets must be included. Total must sum to 100.",
            tolerance=0.10,
        )

        # Validate and normalise the result
        try:
            weights = json.loads(new_weights_json)
            # Ensure all values are integers summing to 100
            total = sum(weights.values())
            if total != 100 and total > 0:
                weights = {k: round(v * 100 / total) for k, v in weights.items()}
            new_weights_json = json.dumps(weights)
        except Exception:
            # Fallback to equal split across active assets
            count = len(list(self.supported_assets))
            equal = 100 // count
            weights = {a: equal for a in self.supported_assets}
            new_weights_json = json.dumps(weights)

        old_weights_json = self.portfolio_weights.get(
            gl.message.sender_account,
            json.dumps({a: round(100 / len(ALL_ASSETS)) for a in ALL_ASSETS})
        )

        self.portfolio_weights[gl.message.sender_account] = new_weights_json

        bot_names = {1: "Conservative", 2: "Balanced", 3: "Aggressive"}
        reason = f"{bot_names.get(profile_id, 'Balanced')} Bot consensus rebalance"
        self._record_trade(
            caller=sender,
            old_weights=old_weights_json,
            new_weights=new_weights_json,
            reason=reason,
        )

        return new_weights_json

    @gl.public.write
    def set_risk_profile(self, profile_id: int) -> None:
        """Set user risk profile: 1=Conservative, 2=Balanced, 3=Aggressive."""
        if profile_id not in [1, 2, 3]:
            raise UserError("Profile ID must be 1, 2, or 3")
        self.user_risk_profiles[gl.message.sender_account] = profile_id

    @gl.public.write
    def set_oracle_address(self, address: Address) -> None:
        self._require_owner()
        self.oracle_address = address

    @gl.public.write
    def set_leaderboard_address(self, address: Address) -> None:
        self._require_owner()
        self.leaderboard_address = address

    # ── Public view methods ────────────────────────────────────────────────────

    @gl.public.view
    def get_balance(self, user: Address) -> u256:
        return self.balances.get(user, u256(0))

    @gl.public.view
    def get_portfolio(self, user: Address) -> str:
        """Returns JSON with balance and current weights."""
        balance = self.balances.get(user, u256(0))
        equal_weight = round(100 / len(ALL_ASSETS))
        weights = self.portfolio_weights.get(
            user,
            json.dumps({a: equal_weight for a in ALL_ASSETS})
        )
        return json.dumps({
            "balance": balance,
            "weights": json.loads(weights),
        })

    @gl.public.view
    def get_trade_history(self) -> str:
        """Returns JSON array of all trade records."""
        records = [json.loads(r) for r in self.trade_history]
        return json.dumps(records)

    @gl.public.view
    def get_trade_history_length(self) -> u256:
        return u256(len(self.trade_history))

    @gl.public.view
    def get_risk_profile(self, user: Address) -> int:
        return self.user_risk_profiles.get(user, 2)

    @gl.public.view
    def get_total_deposited(self) -> u256:
        return self.total_deposited

    @gl.public.view
    def get_oracle_address(self) -> Address:
        return self.oracle_address

    @gl.public.view
    def get_supported_assets(self) -> str:
        return json.dumps(list(self.supported_assets))

    @gl.public.view
    def get_owner(self) -> Address:
        return self.owner

    @gl.public.view
    def get_action(self, symbol: str) -> str:
        """Returns the latest consensus-approved BUY/SELL/HOLD action for a given symbol."""
        if symbol not in self.asset_actions:
            return json.dumps({
                "action": "HOLD",
                "symbol": symbol,
                "score": 0,
                "label": "neutral",
                "confidence": 0,
                "rationale": "No consensus decision yet — call decide_action first",
                "block": 0,
                "caller": "none",
            })
        return self.asset_actions[symbol]

    @gl.public.view
    def get_all_actions(self) -> str:
        """Returns JSON array of the latest consensus decision for every supported asset."""
        results = []
        equal_weight = round(100 / len(ALL_ASSETS))
        for asset in self.supported_assets:
            if asset in self.asset_actions:
                entry = json.loads(self.asset_actions[asset])
            else:
                entry = {
                    "action": "HOLD",
                    "symbol": asset,
                    "score": 0,
                    "label": "neutral",
                    "confidence": 0,
                    "rationale": "No consensus decision yet",
                    "block": 0,
                }
            results.append(entry)
        return json.dumps(results)
