"""
blockchain.py – Web3/Ganache service for Electra blockchain voting.
Handles contract compilation, deployment, and all chain interactions.
"""

import os
import json
from pathlib import Path
from web3 import Web3
try:
    # web3 v6+ 
    from web3.middleware import ExtraDataToPOAMiddleware as geth_poa_middleware
except ImportError:
    try:
        # web3 v5
        from web3.middleware import geth_poa_middleware
    except ImportError:
        # Fallback for unexpected structures
        from web3.middleware.geth_poa import geth_poa_middleware

# ─── Configuration ───────────────────────────────────────────────────────────
# GANACHE_URL is read dynamically in get_web3()
CONTRACT_SOL = Path(__file__).parent / "Election.sol"

# ─── Singleton web3 connection ────────────────────────────────────────────────
_w3 = None
_compiled_abi = None
_compiled_bytecode = None


def get_web3() -> Web3:
    """Return a cached Web3 instance connected to Ganache, re-initializing if URL changes."""
    global _w3
    # Refresh GANACHE_URL from env in case it changed
    url = os.getenv("GANACHE_URL", "http://localhost:7545")
    
    if _w3 is None or not _w3.is_connected() or _w3.provider.endpoint_uri != url:
        print(f"[blockchain] Initializing Web3 with URL: {url}")
        _w3 = Web3(Web3.HTTPProvider(url))
        try:
            _w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        except Exception as e:
            print(f"[blockchain] POA middleware inject skipped: {e}")
    return _w3


def is_connected() -> bool:
    """Check if Ganache is reachable."""
    try:
        w3 = get_web3()
        connected = w3.is_connected()
        if not connected:
            url = w3.provider.endpoint_uri if hasattr(w3.provider, 'endpoint_uri') else "Unknown"
            print(f"[blockchain] Web3.is_connected() returned False. URL={url}")
        return connected
    except Exception as e:
        print(f"[blockchain] is_connected() exception: {e}")
        return False


# ─── Contract compilation ─────────────────────────────────────────────────────
def _compile_contract():
    """Compile Election.sol and cache ABI + bytecode."""
    global _compiled_abi, _compiled_bytecode
    if _compiled_abi and _compiled_bytecode:
        return _compiled_abi, _compiled_bytecode

    try:
        from solcx import compile_source, install_solc, get_installed_solc_versions

        # Install solc 0.8.0 if not already present
        installed = get_installed_solc_versions()
        target = "0.8.0"
        if not any(str(v) == target for v in installed):
            install_solc(target)

        source = CONTRACT_SOL.read_text()
        compiled = compile_source(
            source,
            output_values=["abi", "bin"],
            solc_version=target
        )

        # compiled keys look like <stdin>:Election
        contract_id = next(k for k in compiled if "Election" in k)
        iface = compiled[contract_id]
        _compiled_abi = iface["abi"]
        _compiled_bytecode = iface["bin"]
        return _compiled_abi, _compiled_bytecode

    except ImportError:
        raise RuntimeError(
            "py-solc-x is not installed. Run: pip install py-solc-x"
        )


# ─── Deployment ───────────────────────────────────────────────────────────────
def deploy_contract() -> dict:
    """
    Deploy the Election contract to Ganache.
    Returns {"contract_address": str, "admin_address": str, "tx_hash": str}
    """
    w3 = get_web3()
    if not w3.is_connected():
        url = w3.provider.endpoint_uri if hasattr(w3.provider, 'endpoint_uri') else "Unknown"
        raise ConnectionError(f"Cannot connect to Ganache at {url}")

    abi, bytecode = _compile_contract()
    admin = w3.eth.accounts[0]
    w3.eth.default_account = admin

    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    tx_hash = Contract.constructor().transact({"from": admin, "gas": 3_000_000})
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return {
        "contract_address": receipt.contractAddress,
        "admin_address": admin,
        "tx_hash": tx_hash.hex(),
        "block_number": receipt.blockNumber,
    }


# ─── Contract Helper ─────────────────────────────────────────────────────────
def _get_contract(contract_address: str):
    """Return a contract instance for the given deployed address."""
    w3 = get_web3()
    abi, _ = _compile_contract()
    return w3.eth.contract(
        address=Web3.to_checksum_address(contract_address),
        abi=abi
    )


def _admin_address() -> str:
    w3 = get_web3()
    return w3.eth.accounts[0]


def _voter_address(voter_index: int) -> str:
    """
    Get a deterministic Ganache account for a voter.
    Accounts[0] = admin, Accounts[1..N] = voters.
    Ganache typically provides 10 accounts by default.
    We use voter_index mod available_accounts to assign an eth address.
    NOTE: For a real deployment each voter would have a MetaMask wallet;
    in Ganache simulated mode we cycle through test accounts (accounts[1..9]).
    """
    w3 = get_web3()
    accounts = w3.eth.accounts
    # accounts[0] is admin, reserve [1..] for voters
    max_idx = max(len(accounts) - 1, 1)
    eth_idx = (voter_index % max_idx) + 1
    # Clamp to available range
    eth_idx = min(eth_idx, len(accounts) - 1)
    return accounts[eth_idx]


# ─── Admin Operations ─────────────────────────────────────────────────────────
def add_candidate(contract_address: str, name: str, position: str, symbol: str) -> dict:
    """Add a candidate to the deployed contract (admin only). Returns tx_hash."""
    w3 = get_web3()
    contract = _get_contract(contract_address)
    admin = _admin_address()
    tx_hash = contract.functions.addCandidate(name, position, symbol).transact(
        {"from": admin, "gas": 200_000}
    )
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return {"tx_hash": tx_hash.hex(), "status": receipt.status}


def start_voting(contract_address: str) -> dict:
    """Start voting (admin only)."""
    w3 = get_web3()
    contract = _get_contract(contract_address)
    admin = _admin_address()
    tx_hash = contract.functions.startVoting().transact({"from": admin, "gas": 100_000})
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return {"tx_hash": tx_hash.hex(), "status": receipt.status}


def end_voting(contract_address: str) -> dict:
    """End voting (admin only)."""
    w3 = get_web3()
    contract = _get_contract(contract_address)
    admin = _admin_address()
    tx_hash = contract.functions.endVoting().transact({"from": admin, "gas": 100_000})
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return {"tx_hash": tx_hash.hex(), "status": receipt.status}


# ─── Voter Operations ─────────────────────────────────────────────────────────
def cast_vote(contract_address: str, candidate_id: int, voter_eth_address: str) -> dict:
    """
    Cast a vote on the blockchain.
    voter_eth_address: the Ganache account assigned to this voter.
    Returns {"tx_hash": str, "block_number": int}
    """
    w3 = get_web3()
    contract = _get_contract(contract_address)
    voter_addr = Web3.to_checksum_address(voter_eth_address)

    tx_hash = contract.functions.castVote(candidate_id).transact(
        {"from": voter_addr, "gas": 150_000}
    )
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt.status != 1:
        raise RuntimeError("Transaction reverted — vote not counted")
    return {
        "tx_hash": tx_hash.hex(),
        "block_number": receipt.blockNumber,
        "voter_address": voter_addr,
    }


def check_has_voted(contract_address: str, voter_eth_address: str) -> bool:
    """Check if an Ethereum address has already voted on the contract."""
    contract = _get_contract(contract_address)
    return contract.functions.hasVoted(
        Web3.to_checksum_address(voter_eth_address)
    ).call()


# ─── Read-Only Queries ────────────────────────────────────────────────────────
def get_status(contract_address: str) -> dict:
    """Get voting status: open/closed, candidate count, total votes."""
    contract = _get_contract(contract_address)
    voting_open, candidate_count, total_votes = contract.functions.getStatus().call()
    return {
        "voting_open": voting_open,
        "candidate_count": candidate_count,
        "total_votes": total_votes,
    }


def get_candidates(contract_address: str) -> list:
    """Return list of all candidates with their vote counts."""
    contract = _get_contract(contract_address)
    _, candidate_count, _ = contract.functions.getStatus().call()
    result = []
    for i in range(1, candidate_count + 1):
        cid, name, position, symbol, vote_count = contract.functions.getCandidate(i).call()
        result.append({
            "id": cid,
            "name": name,
            "position": position,
            "symbol": symbol,
            "vote_count": vote_count,
        })
    return result


def get_results(contract_address: str) -> dict:
    """Return full results: candidates with vote counts, winner, total votes."""
    contract = _get_contract(contract_address)
    voting_open, candidate_count, total_votes = contract.functions.getStatus().call()

    candidates = []
    for i in range(1, candidate_count + 1):
        cid, name, position, symbol, vote_count = contract.functions.getCandidate(i).call()
        pct = round((vote_count / total_votes * 100), 1) if total_votes else 0
        candidates.append({
            "id": cid,
            "name": name,
            "position": position,
            "symbol": symbol,
            "vote_count": vote_count,
            "percentage": pct,
        })

    # Group by position and find winner per position
    positions = {}
    for c in candidates:
        pos = c["position"]
        positions.setdefault(pos, []).append(c)

    results_by_position = []
    overall_winner = None
    max_votes = -1

    for pos, cands in positions.items():
        winner = max(cands, key=lambda x: x["vote_count"])
        results_by_position.append({
            "position": pos,
            "candidates": sorted(cands, key=lambda x: x["vote_count"], reverse=True),
            "winner": winner if not voting_open else None,
        })
        if winner["vote_count"] > max_votes:
            max_votes = winner["vote_count"]
            overall_winner = winner

    return {
        "voting_open": voting_open,
        "total_votes": total_votes,
        "candidate_count": candidate_count,
        "results_by_position": results_by_position,
        "all_candidates": candidates,
        "overall_winner": overall_winner if not voting_open else None,
    }
