# { "Depends": "py-genlayer:test" }
from genlayer import *
from genlayer.gl.vm import UserError
import json

# ─── Portfolio Agent ──────────────────────────────────────────────────────────
# Reads sentiment from SentimentOracle, manages user deposits,
# auto-rebalances portfolio weights based on sentiment scores,
# and records all trade decisions on-chain.

REBALANCE_THRESHOLD = 10   # min absolute score to include an asset
MAX_WEIGHT = 60            # max % weight for any single asset


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

    def __init__(self, oracle_address: Address, leaderboard_address: Address) -> None:
        self.owner = gl.message.sender_account
        self.oracle_address = oracle_address
        self.leaderboard_address = leaderboard_address
        self.total_deposited = u256(0)
        for asset in ["BTC", "ETH", "SOL", "BNB"]:
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
    def rebalance(self) -> str:
        """
        Read oracle sentiment, compute new portfolio weights,
        record the trade, and return the new weights as JSON.
        """
        sender = str(gl.message.sender_account)

        # Fetch sentiment from oracle
        sentiments_json = self._get_oracle_sentiments()

        # Get risk profile (default Balanced = 2)
        profile_id = self.user_risk_profiles.get(gl.message.sender_account, 2)

        # Compute new weights
        new_weights_json = self._compute_weights(sentiments_json, profile_id)

        # Get old weights for the caller (default equal)
        old_weights_json = self.portfolio_weights.get(
            gl.message.sender_account,
            json.dumps({a: 25 for a in ["BTC", "ETH", "SOL", "BNB"]})
        )

        # Store new weights
        self.portfolio_weights[gl.message.sender_account] = new_weights_json

        # Record trade
        bot_names = {1: "Conservative", 2: "Balanced", 3: "Aggressive"}
        reason = f"{bot_names.get(profile_id, 'Balanced')} Bot rebalance"
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
        weights = self.portfolio_weights.get(
            user,
            json.dumps({"BTC": 25, "ETH": 25, "SOL": 25, "BNB": 25})
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
