# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from genlayer.gl.vm import UserError
import json

# ─── Sentiment Leaderboard ────────────────────────────────────────────────────
# Records historical sentiment snapshots and tracks caller accuracy.
# Callers who trigger an update earn +1 point per call.
# This contract is the on-chain history store and ranking system.

MAX_HISTORY_PER_SYMBOL = 50   # max snapshots to keep per symbol


class SentimentLeaderboard(gl.Contract):
    # per-symbol snapshot history, stored as JSON arrays
    sentiment_history: TreeMap[str, str]
    # caller address -> points earned
    caller_scores: TreeMap[Address, u256]
    # ordered list of unique caller address strings (for iteration)
    callers_list: DynArray[str]
    # owner address
    owner: Address
    # oracle address (only oracle can record snapshots)
    oracle_address: Address
    # total snapshots recorded
    total_snapshots: u256

    def __init__(self, oracle_address: Address) -> None:
        self.owner = gl.message.sender_address
        self.oracle_address = oracle_address
        self.total_snapshots = u256(0)

    # ── Internal helpers ───────────────────────────────────────────────────────

    def _require_oracle_or_owner(self) -> None:
        sender = gl.message.sender_address
        if sender != self.oracle_address and sender != self.owner:
            raise UserError("Only oracle or owner can call this")

    def _has_caller(self, caller: str) -> bool:
        for c in self.callers_list:
            if c == caller:
                return True
        return False

    # ── Public write methods ───────────────────────────────────────────────────

    @gl.public.write
    def record_snapshot(self, symbol: str, score: int, label: str, caller: Address) -> None:
        """Record a new sentiment snapshot for `symbol`."""
        self._require_oracle_or_owner()

        snapshot = {
            "score": score,
            "label": label,
            "caller": str(caller),
        }

        # Load existing history
        existing_json = self.sentiment_history.get(symbol, "[]")
        history = json.loads(existing_json)

        # Append new snapshot, keep only last MAX_HISTORY_PER_SYMBOL
        history.append(snapshot)
        if len(history) > MAX_HISTORY_PER_SYMBOL:
            history = history[-MAX_HISTORY_PER_SYMBOL:]

        self.sentiment_history[symbol] = json.dumps(history)

        # Award point to caller
        caller_str = str(caller)
        current_score = self.caller_scores.get(caller, u256(0))
        self.caller_scores[caller] = current_score + u256(1)

        # Track unique callers
        if not self._has_caller(caller_str):
            self.callers_list.append(caller_str)

        self.total_snapshots = self.total_snapshots + u256(1)

    @gl.public.write
    def set_oracle_address(self, address: Address) -> None:
        if gl.message.sender_address != self.owner:
            raise UserError("Only owner can call this")
        self.oracle_address = address

    # ── Public view methods ────────────────────────────────────────────────────

    @gl.public.view
    def get_history(self, symbol: str, limit: int) -> str:
        """Returns JSON array of the last `limit` snapshots for `symbol`."""
        raw = self.sentiment_history.get(symbol, "[]")
        history = json.loads(raw)
        if limit > 0:
            history = history[-limit:]
        return json.dumps(history)

    @gl.public.view
    def get_all_history(self, symbol: str) -> str:
        return self.sentiment_history.get(symbol, "[]")

    @gl.public.view
    def get_leaderboard(self) -> str:
        """Returns JSON array of {caller, score} sorted descending by score."""
        entries = []
        for caller_str in self.callers_list:
            caller_addr = Address(caller_str)
            score = self.caller_scores.get(caller_addr, u256(0))
            entries.append({"caller": caller_str, "score": int(score)})

        entries.sort(key=lambda x: x["score"], reverse=True)
        return json.dumps(entries)

    @gl.public.view
    def get_top_callers(self, limit: int) -> str:
        """Returns top `limit` callers by score."""
        all_entries = json.loads(self.get_leaderboard())
        return json.dumps(all_entries[:limit])

    @gl.public.view
    def get_caller_score(self, caller: Address) -> u256:
        return self.caller_scores.get(caller, u256(0))

    @gl.public.view
    def get_total_snapshots(self) -> u256:
        return self.total_snapshots

    @gl.public.view
    def get_oracle_address(self) -> Address:
        return self.oracle_address

    @gl.public.view
    def get_owner(self) -> Address:
        return self.owner
